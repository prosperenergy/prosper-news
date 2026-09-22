// Read-only audit: match existing form receipts to existing GHL notes.
// No submissions, contact writes, workflow enrollments, or outbound messages.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const siteId='9a1a6ce8-20e3-4250-8d40-4db437f1f33b';
const formId='6a578118ad41f20008bfe805';
const cli='/Users/craigstratton/.npm-global/bin/netlify';
const api=(name,data)=>JSON.parse(execFileSync(cli,['api',name,'--data',JSON.stringify(data)],{encoding:'utf8',maxBuffer:8e6,timeout:30000,stdio:['ignore','pipe','pipe']}));
const site=api('getSite',{site_id:siteId});
assert.equal(site.custom_domain,'prospershield.io');
const env=api('getEnvVars',{account_id:site.account_slug,site_id:siteId,context_name:'production'});
const value=key=>{const e=env.find(x=>x.key===key);return (e?.values?.find(v=>v.context==='production')||e?.values?.find(v=>v.context==='all'))?.value;};
const locationId=value('GHL_LOCATION_ID');
const candidate=process.argv.includes('--candidate');
const local=candidate?fs.readFileSync('/Users/craigstratton/.config/prosper/prosper.env','utf8'):'';
const localValue=key=>local.match(new RegExp(`^(?:export\\s+)?${key}=(.*)$`,'m'))?.[1].trim().replace(/^["']|["']$/g,'');
if(candidate)assert.equal(localValue('GHL_LOCATION_ID'),locationId);
const token=candidate?localValue('GHL_API_TOKEN'):value('GHL_API_TOKEN');
assert(locationId&&token,'Existing intake configuration is incomplete');
if(/^\*+/.test(token)){
  console.log(JSON.stringify({checkedAt:new Date().toISOString(),siteId,formId,locationId,credentialMasked:true,liveConnectionStatus:'not tested',reason:'Netlify returned a masked placeholder. It is not a usable credential and must not be used for an authentication test.',readOnly:true}));
  process.exit(0);
}
const get=async route=>{
  const response=await fetch('https://services.leadconnectorhq.com'+route,{headers:{Authorization:`Bearer ${token}`,Version:value('GHL_API_VERSION')||'2021-07-28'},signal:AbortSignal.timeout(15000)});
  if(!response.ok){const detail=await response.json().catch(()=>({}));return {errorStatus:response.status,errorMessage:String(detail.message||detail.error||'Request rejected').slice(0,160)};}
  return response.json();
};
const records=api('listFormSubmissions',{form_id:formId,per_page:3});
const checks=[];
for(const record of records){
  const query=new URLSearchParams({locationId,email:record.data.email});
  const found=await get('/contacts/search/duplicate?'+query);
  if(found.errorStatus){checks.push({submissionId:record.id,crmReadStatus:found.errorStatus,reason:found.errorMessage});break;}
  const contact=found.contact;
  if(!contact?.id){checks.push({submissionId:record.id,contactFound:false});continue;}
  assert.equal(contact.locationId,locationId,'Contact location mismatch');
  const notes=await get(`/contacts/${encodeURIComponent(contact.id)}/notes`);
  const matched=(notes.notes||[]).some(note=>note.body?.includes(`[prosper-web-submission:${record.id}]`));
  checks.push({submissionId:record.id,submittedAt:record.created_at,contactFound:true,contactId:contact.id,matchingSubmissionNote:matched,notesReadStatus:notes.errorStatus||200});
}
const report={checkedAt:new Date().toISOString(),siteId,formId,locationId,candidate,existingSubmissionMatched:checks.some(c=>c.matchingSubmissionNote),checks,readOnly:true,newSubmissionTested:false};
fs.mkdirSync('outputs/customer-news-2026-09-17',{recursive:true});
fs.writeFileSync(`outputs/customer-news-2026-09-17/assessment-ghl-${candidate?'candidate':'readback'}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));

// Craig approved reconnecting this existing integration on September 17, 2026.
// Never print credentials or pass them as process arguments.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const siteId='9a1a6ce8-20e3-4250-8d40-4db437f1f33b';
const expectedDeploy='6a9b7434264b6566cc936a01';
const expectedLocation='hU3tflAFRrVsoETFstfk';
assert(!fs.existsSync('outputs/customer-news-2026-09-17/CREDENTIAL-ROTATION-REQUIRED.md'),'Credential rotation is required before this script can be reused. Do not reuse the exposed integration key.');
const cliConfig=JSON.parse(fs.readFileSync('/Users/craigstratton/Library/Preferences/netlify/config.json','utf8'));
const auth=cliConfig.users[cliConfig.userId].auth;
const netlifyToken=typeof auth==='string'?auth:auth.token;
assert(netlifyToken,'Netlify authentication is unavailable');
const envText=fs.readFileSync('/Users/craigstratton/.config/prosper/prosper.env','utf8');
const localValue=key=>envText.match(new RegExp(`^(?:export\\s+)?${key}=(.*)$`,'m'))?.[1].trim().replace(/^["']|["']$/g,'');
const candidate=localValue('GHL_API_TOKEN');
assert(candidate?.startsWith('pit-'),'Only the existing private integration is allowed');
assert.equal(localValue('GHL_LOCATION_ID'),expectedLocation);
const netlify=async(route,options={})=>{
  const r=await fetch('https://api.netlify.com/api/v1'+route,{...options,headers:{Authorization:`Bearer ${netlifyToken}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});
  assert(r.ok,`Netlify request rejected: HTTP ${r.status}`);
  return r.json();
};
const site=await netlify(`/sites/${siteId}`);
assert.equal(site.custom_domain,'prospershield.io');
assert.equal(site.published_deploy.id,expectedDeploy,'Published main site changed; stop for coordination');
const route=`/accounts/${site.account_slug}/env/GHL_API_TOKEN?site_id=${siteId}`;
const before=await netlify(route);
assert.deepEqual(before.scopes,['functions']);
const production=before.values.find(v=>v.context==='production');
assert(production,'Expected production credential not found');
const location=await fetch(`https://services.leadconnectorhq.com/locations/${expectedLocation}`,{headers:{Authorization:`Bearer ${candidate}`,Version:'2021-07-28'},signal:AbortSignal.timeout(15000)});
assert.equal(location.status,200,'Replacement must pass a live, read-only account check');
const body=await location.json();
assert.equal(body.location?.id,expectedLocation);
const applying=process.argv.includes('--apply');
if(applying){
  await netlify(route,{method:'PATCH',body:JSON.stringify({context:'production',value:candidate})});
  const after=await netlify(route);
  const stored=after.values.find(v=>v.context==='production')?.value;
  assert(stored===candidate||(/^\*+/.test(stored||'')&&stored.endsWith(candidate.slice(-4))),'Stored secret confirmation failed');
  assert.deepEqual(after.scopes,before.scopes);
  assert(JSON.stringify(after.values.filter(v=>v.context!=='production'))===JSON.stringify(before.values.filter(v=>v.context!=='production')),'An unrelated environment context changed');
  const current=await netlify(`/sites/${siteId}`);
  assert.equal(current.published_deploy.id,expectedDeploy);
  assert.equal(current.published_deploy.locked,site.published_deploy.locked);
}
const hash=v=>createHash('sha256').update(v).digest('hex');
const report={checkedAt:new Date().toISOString(),applied:applying,siteId,domain:site.custom_domain,locationId:expectedLocation,locationName:body.location.name,key:'GHL_API_TOKEN',context:'production',scopes:before.scopes,oldFingerprint:hash(production.value),newFingerprint:hash(candidate),existingPrivateIntegrationReused:true,credentialRotated:false,publishedDeployUnchanged:expectedDeploy,newDeploymentCreated:false,runtimeReactivationVerified:false,customerRecordsWritten:false,messagesSent:false,workflowsChanged:false};
fs.mkdirSync('outputs/customer-news-2026-09-17',{recursive:true});
fs.writeFileSync(`outputs/customer-news-2026-09-17/ghl-reconnection-${applying?'applied':'preflight'}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));

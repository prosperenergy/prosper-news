import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const cli='/Users/craigstratton/.npm-global/bin/netlify';
const api=(name,data)=>JSON.parse(execFileSync(cli,['api',name,'--data',JSON.stringify(data)],{encoding:'utf8',maxBuffer:8e6,timeout:180000}));
for(const file of config.qa){const qa=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(qa.passed,true,file);assert(qa.base.includes(config.target),file);}
const slim=s=>({id:s.id,name:s.name,custom_domain:s.custom_domain,published_deploy:{id:s.published_deploy?.id,state:s.published_deploy?.state,locked:!!s.published_deploy?.locked}});
const before=api('getSite',{site_id:config.siteId});
assert.equal(before.name,config.name);assert.equal(before.custom_domain,config.domain);assert.equal(before.published_deploy.id,config.previous);assert.equal(!!before.published_deploy.locked,config.locked);
let unlocked=false;
try{
  if(config.locked){api('unlockDeploy',{deploy_id:config.previous});unlocked=true;}
  api('restoreSiteDeploy',{site_id:config.siteId,deploy_id:config.target});
  if(config.locked)api('lockDeploy',{deploy_id:config.target});
  const after=api('getSite',{site_id:config.siteId});assert.equal(after.published_deploy.id,config.target);assert.equal(after.published_deploy.state,'ready');assert.equal(!!after.published_deploy.locked,config.locked);
  const result={releasedAt:new Date().toISOString(),before:slim(before),after:slim(after),qa:config.qa,rollbackDeployId:config.previous,dnsChanged:false,lockStatePreserved:true};
  fs.writeFileSync(config.receipt,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}catch(error){
  if(unlocked){const current=api('getSite',{site_id:config.siteId});if([config.previous,config.target].includes(current.published_deploy?.id))api('lockDeploy',{deploy_id:current.published_deploy.id});}
  throw error;
}

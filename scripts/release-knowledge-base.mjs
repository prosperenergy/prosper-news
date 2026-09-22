import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const cli='/Users/craigstratton/.npm-global/bin/netlify';
const siteId='23acc4f3-1ecb-4238-bb16-03eff09b72dd',previous='6aa5f338f0b721078f31695d',target='6aa8aaa95e9b478163626a53';
const api=(operation,data)=>JSON.parse(execFileSync(cli,['api',operation,'--data',JSON.stringify(data)],{encoding:'utf8',maxBuffer:4e6}));
const slim=s=>({id:s.id,name:s.name,custom_domain:s.custom_domain,published_deploy:{id:s.published_deploy?.id,state:s.published_deploy?.state,locked:s.published_deploy?.locked}});
const qa=JSON.parse(fs.readFileSync('outputs/knowledge-base/preview-verification.json','utf8'));assert(qa.passed);assert(qa.base.includes(target));
const before=api('getSite',{site_id:siteId});assert.equal(before.name,'prosper-news');assert.equal(before.custom_domain,'news.prospershield.io');assert.equal(before.published_deploy.id,previous);assert.equal(before.published_deploy.locked,true);
let unlocked=false;
try{api('unlockDeploy',{deploy_id:previous});unlocked=true;api('restoreSiteDeploy',{site_id:siteId,deploy_id:target});api('lockDeploy',{deploy_id:target});const after=api('getSite',{site_id:siteId});assert.equal(after.published_deploy.id,target);assert.equal(after.published_deploy.state,'ready');assert.equal(after.published_deploy.locked,true);const record={releasedAt:new Date().toISOString(),before:slim(before),after:slim(after),previewVerified:true,rollbackDeployId:previous,dnsChanged:false,productionLockRestored:true};fs.writeFileSync('outputs/knowledge-base/release.json',JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));}catch(error){if(unlocked){const current=api('getSite',{site_id:siteId});if([previous,target].includes(current.published_deploy?.id))api('lockDeploy',{deploy_id:current.published_deploy.id});}throw error;}

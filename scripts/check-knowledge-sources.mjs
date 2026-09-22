import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {sources} from '../content/knowledge/catalog.mjs';
const run=promisify(execFile);
const targets=[...sources.map(s=>({id:s.id,url:s.url})),...['https://fixit.prospershield.io/','https://batteries.prospershield.io/','https://prospershield.io/'].map((url,i)=>({id:'cta-'+i,url}))];
const results=[];let cursor=0;
await Promise.all(Array.from({length:6},async()=>{while(cursor<targets.length){const t=targets[cursor++];try{const {stdout}=await run('curl',['-L','-sS','-o','/dev/null','--max-time','25','-A','Mozilla/5.0','-w','%{http_code}\t%{url_effective}',t.url]);const [status,finalUrl]=stdout.split('\t');results.push({...t,status:Number(status),finalUrl,classification:Number(status)>=200&&Number(status)<400?'reachable':[403,429,503].includes(Number(status))?'automated-access-restricted':'needs-review'});}catch(e){results.push({...t,status:0,classification:'request-timeout-or-network-error',error:e.message.slice(0,200)});}}}));
const report={checkedAt:new Date().toISOString(),note:'Reachability check, not content verification. Automated-access restrictions do not establish that a page is unavailable to human readers.',results};fs.writeFileSync('outputs/knowledge-base/source-link-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify({total:results.length,counts:results.reduce((a,r)=>(a[r.classification]=(a[r.classification]||0)+1,a),{}),review:results.filter(r=>r.classification!=='reachable')},null,2));

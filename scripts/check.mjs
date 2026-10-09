import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const exclude = new Set(['.git', 'node_modules', 'dist', '.payment-data', 'private-products']);
async function walk(dir) { const files=[]; for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||exclude.has(e.name))continue; const path=resolve(dir,e.name);if(e.isDirectory())files.push(...await walk(path));else files.push(path);}return files; }
let errors=[]; const files=await walk(root);
for (const file of files) {
 try {
  if(['.js','.mjs'].includes(extname(file)))execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
  if(extname(file)==='.json')JSON.parse(await readFile(file,'utf8'));
  if(extname(file)==='.html')for(const m of (await readFile(file,'utf8')).matchAll(/(?:src|href)=["']([^"']+)["']/g)){
   const url=m[1];if(/^(?:[a-z]+:|\/\/|#)/i.test(url))continue;
   const path=decodeURIComponent(url.split(/[?#]/)[0]);if(!path)continue;
   try{await access(path.startsWith('/')?resolve(root,'.'+path):resolve(dirname(file),path));}catch{errors.push(`${file}: missing ${url}`);}
  }
 } catch(e){errors.push(`${file}: ${e.message}`);}
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Checked JavaScript syntax, JSON and local HTML links across ${files.length} files.`);

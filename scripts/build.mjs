import { readdir, mkdir, cp, rm } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
const extensions=new Set(['.html','.css','.js','.json','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.mp4','.webm','.woff2','.xml','.txt']);
// Copy a public allowlist only. Backend, secrets, audit data and paid files never enter this artifact.
await rm(dist,{recursive:true,force:true});await mkdir(dist);
for(const e of await readdir(root,{withFileTypes:true})){
 if(e.isDirectory()&&['counting-carbon','warm-nights'].includes(e.name))await cp(resolve(root,e.name),resolve(dist,e.name),{recursive:true});
 else if(e.isFile()&&extensions.has(extname(e.name))&&!['package.json','package-lock.json'].includes(e.name))await cp(resolve(root,e.name),resolve(dist,e.name));
}
console.log('Static preview built in dist/. No deployment performed.');

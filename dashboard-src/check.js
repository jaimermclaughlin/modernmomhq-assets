const fs=require('fs'),vm=require('vm');
const ctx={window:{}};vm.createContext(ctx);
['data_meta.js','data_sources1.js','data_sources2.js','data_sources3.js','data_findings.js','data_sick_want.js','data_listening.js','data_landscape.js','data_strategy.js','data_resources.js'].forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f}));
const D=ctx.window.DATA; let bad=0;
const src=new Set(); D.sources.forEach(s=>{if(src.has(s.id)){console.log('DUP source',s.id);bad++;} src.add(s.id); if(!/^https?:\/\//.test(s.url)){console.log('BAD url',s.id);bad++;} ['Firsthand','Research','Journalism','Expert/Creator','Commercial'].includes(s.type)||(console.log('type',s.id,s.type),bad++); ['High','Moderate','Low'].includes(s.quality)||(console.log('quality',s.id),bad++);});
const items=[]; const add=(arr,where)=>arr.forEach(i=>items.push([i,where]));
add(D.exec.findings,'exec');add(D.exec.patterns,'exec');add(D.exec.surprises,'exec');add(D.exec.implications,'exec');
add(D.painPoints,'pain');add(D.sickOf,'sick');add(D.wants,'want');add(D.listening,'listen');add(D.dynamics,'listen');add(D.creators,'land');
['patterns','repetitive','overrep','underserved','performing','opportunities'].forEach(k=>add(D.landscape[k],'land'));
add(D.disruptors,'dis');add(D.resources.items,'res');add(D.resources.products,'res');['problems','differentiation','investigate','approach','pillars'].forEach(k=>add(D.recs[k],'recs'));
const ids=new Set(); items.forEach(([i])=>{if(ids.has(i.id)){console.log('DUP item',i.id);bad++;} ids.add(i.id);});
const used=new Set();
const chk=(id,ctxs)=>{used.add(id); if(!src.has(id)){console.log('MISSING source',id,'in',ctxs);bad++;}};
items.forEach(([i])=>{(i.sources||[]).forEach(s=>chk(s,i.id));(i.quotes||[]).forEach(q=>chk(q.src,i.id+' quote')); if(i.src) chk(i.src,i.id); (i.links||[]).forEach(l=>{if(!ids.has(l)){console.log('MISSING link',l,'in',i.id);bad++;}}); if(i.level&&!['verified','pattern','hypothesis','gap'].includes(i.level)){console.log('level',i.id);bad++;}
 (i.quotes||[]).forEach(q=>{if(!['caption','excerpt','article','set'].includes(q.fid)){console.log('fid',i.id);bad++;}}); if(i.fid&&!['caption','excerpt','article','set'].includes(i.fid)){console.log('fid',i.id);bad++;}
 (i.segs||[]).forEach(s=>{if(!['adhd','suspected','moms','millennial'].includes(s)){console.log('seg',i.id,s);bad++;}}); (i.topics||[]).forEach(t=>{if(!D.topics.find(x=>x.id===t)){console.log('topic',i.id,t);bad++;}});});
D.segmentProfiles.forEach(p=>p.sources.forEach(s=>chk(s,'seg '+p.seg)));
D.overlaps.forEach(o=>o.sources.forEach(s=>chk(s,'overlap')));
D.glossary.forEach(g=>g.sources.forEach(s=>chk(s,'glossary '+g.term)));
const R=D.resources, resIds=new Set(R.items.map(r=>r.id)), flagIds=new Set(R.flags.map(f=>f.id));
R.items.forEach(r=>{if(!flagIds.has(r.flag)){console.log('flag',r.id);bad++;} if(!['resource','content'].includes(r.type)){console.log('type',r.id);bad++;} if(!['Now','Next','Later'].includes(r.priority)){console.log('priority',r.id);bad++;} (r.pillars||[]).forEach(p=>{if(![1,2,3,4].includes(p)){console.log('pillar',r.id);bad++;}}); ['title','what','from','format','home','why'].forEach(k=>{if(!r[k]){console.log('missing',k,r.id);bad++;}});});
R.products.forEach(p=>{p.holds.concat(p.change,p.fix).forEach(b=>{(b.links||[]).forEach(l=>{if(!ids.has(l)){console.log('MISSING link',l,'in',p.id);bad++;}});(b.sources||[]).forEach(s=>chk(s,p.id));}); p.becomes.forEach(x=>{if(!resIds.has(x)){console.log('MISSING becomes',x,'in',p.id);bad++;}});});
const covSeen=new Set(); R.coverage.forEach(c=>{if(!ids.has(c[0])){console.log('MISSING coverage item',c[0]);bad++;} if(covSeen.has(c[0])){console.log('DUP coverage',c[0]);bad++;} covSeen.add(c[0]); if(!['yes','part','conflict','no'].includes(c[1])){console.log('coverage value',c[0]);bad++;} (c[3]?c[3].split(' '):[]).forEach(x=>{if(!resIds.has(x)){console.log('MISSING coverage resource',x,'in',c[0]);bad++;}});});
D.painPoints.forEach(p=>{if(!covSeen.has(p.id)){console.log('pain point missing from coverage',p.id);bad++;}});
const unused=[...src].filter(s=>!used.has(s));
console.log('sources',src.size,'items',ids.size,'unused sources',unused.length, unused.join(' '));
const all=['data_meta.js','data_sources1.js','data_sources2.js','data_sources3.js','data_findings.js','data_sick_want.js','data_listening.js','data_landscape.js','data_strategy.js','data_resources.js','app.js','shell.html','shell_artifact.html','styles.css'];
all.forEach(f=>{const t=fs.readFileSync(f,'utf8'); const m=t.match(/[—–]|\\u2014|\\u2013/g); if(m){console.log('DASH in',f,m.length);bad++;}});
console.log(bad?('PROBLEMS: '+bad):'ALL CHECKS PASSED');

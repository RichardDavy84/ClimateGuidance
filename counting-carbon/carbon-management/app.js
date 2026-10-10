import { initTutorial } from '../tutorial.js';
import {createState, calculate, applyPreset, setConstraint, isPreset, setDirectPotential, resumeAssumptions} from './model.js';

const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg';
const data = await fetch('./data/approaches.json').then(r => {if (!r.ok) throw new Error('Book data could not be loaded'); return r.json();});
let state = createState(data), result = calculate(data, state), view = {level:'overall'}, focus = null;
const colors = {land:{fill:'#d5eadc',stroke:'#287952'},ocean:{fill:'#d8eaf5',stroke:'#3479a7'},engineered:{fill:'#e1e5e7',stroke:'#62717c'}};
const positions = {forest:[150,215],soil:[305,225],peat:[90,355],grass:[260,370],biochar:[165,490],coast:[1000,205],algae:[1160,225],pump:[950,350],alkalinity:[1100,355],doc:[1190,485],beccs:[510,620],dac:[670,620],weather:[825,620]};
const titles = {land:[205,110],ocean:[1080,110],engineered:[670,557]};
const orbs = new Map(), clusterEls = new Map(), segments = new Map(), controls = new Map();
const fmt = n => n === 0 ? '0' : n >= 100 ? String(+n.toFixed(1)) : n >= 1 ? String(+n.toFixed(2)) : String(+n.toPrecision(3));
const presetName = p => ({practical_scenario:'Practical Scenario',ipcc:'IPCC Assessed',physical_limit:'Physical Limit'}[p]);
function svg(tag, attrs = {}, text) {const e = document.createElementNS(NS,tag); for (const [k,v] of Object.entries(attrs)) e.setAttribute(k,v); if (text !== undefined) e.textContent=text; return e;}
function add(parent,tag,attrs,text) {const e=svg(tag,attrs,text); parent.append(e); return e;}
function activate(el, action) {el.addEventListener('click', action); el.addEventListener('keydown',e => {if (['Enter',' '].includes(e.key)) {e.preventDefault(); action();}});}
function enterHover(f) {focus=f; paintHighlight();}
function exitHover() {focus=null; paintHighlight();}
function selected() {return data.approaches.find(a => a.approach_id === view.id);}

for (const c of data.clusters) {
  const [x,y]=titles[c.id], g=add($('cluster-titles'),'g',{class:'cluster-title',role:'button',tabindex:0,'aria-label':`Explore ${c.name}`});
  g.style.transform=`translate(${x}px,${y}px)`;
  add(g,'rect',{x:-125,y:-26,width:250,height:66,fill:'transparent'});
  add(g,'text',{'text-anchor':'middle',fill:colors[c.id].stroke},c.name);
  add(g,'text',{y:25,'text-anchor':'middle',class:'cluster-value'},'');
  g.addEventListener('pointerenter',()=>enterHover({kind:'cluster',id:c.id}));g.addEventListener('pointerleave',exitHover);
  g.addEventListener('focus',()=>enterHover({kind:'cluster',id:c.id}));g.addEventListener('blur',exitHover);
  activate(g,()=>navigate({level:'cluster',id:c.id}));clusterEls.set(c.id,g);
}
for (const a of data.approaches) {
  const g=add($('method-orbs'),'g',{class:'orb',role:'button',tabindex:0,'data-method':a.approach_id,'aria-label':a.approach_name});
  add(g,'circle',{r:33,fill:colors[a.cluster].fill,stroke:colors[a.cluster].stroke});
  add(g,'text',{y:60,'text-anchor':'middle'},a.short_name);
  add(g,'text',{y:82,'text-anchor':'middle',class:'orb-value'},'');
  add(g,'title',{},`${a.approach_name} — click to inspect`);
  g.addEventListener('pointerenter',()=>enterHover({kind:'method',id:a.approach_id}));g.addEventListener('pointerleave',exitHover);
  g.addEventListener('focus',()=>enterHover({kind:'method',id:a.approach_id}));g.addEventListener('blur',exitHover);
  activate(g,()=>navigate({level:'method',id:a.approach_id,parent:view.level==='cluster'?view.id:null}));orbs.set(a.approach_id,g);
  const s=add($('potential-stack'),'rect',{x:130,width:66,fill:'#287952','data-segment':a.approach_id});segments.set(a.approach_id,s);
}

// Small screens use the same model and the same assumption input nodes.
const compactMedia = matchMedia('(max-width:900px)');
for (const cluster of data.clusters) {
  const group = document.createElement('optgroup'); group.label = cluster.name;
  for (const a of data.approaches.filter(a => a.cluster === cluster.id)) {
    const option = document.createElement('option'); option.value = a.approach_id; option.textContent = a.approach_name; group.append(option);
  }
  $('compact-method').append(group);
}
$('compact-method').addEventListener('change', () => navigate($('compact-method').value ? {level:'method',id:$('compact-method').value} : {level:'overall'}));
$('compact-direct-value').addEventListener('input', () => { state=setDirectPotential(state,selected(),Number($('compact-direct-value').value)); render(); });
$('compact-resume').addEventListener('click', () => {state=resumeAssumptions(state,selected());render();});
document.querySelectorAll('[data-compact-preset]').forEach(b=>b.addEventListener('click',()=>setPreset(b.dataset.compactPreset,view.id)));
compactMedia.addEventListener('change',()=>render());
function paintCompact() {
  const a=selected(),isMethod=view.level==='method',maximum=Math.max(data.reference.value,result.total);
  $('compact-method').value=isMethod?view.id:'';
  $('compact-total').textContent=`${fmt(result.total)} GtCO₂e/yr`;
  $('compact-reference').style.width=`${data.reference.value/maximum*100}%`;
  $('compact-stack').replaceChildren();
  for(const method of data.approaches){const segment=document.createElement('span');segment.style.width=`${result.methods[method.approach_id].current_potential/maximum*100}%`;segment.style.background=colors[method.cluster].stroke;segment.title=method.approach_name;$('compact-stack').append(segment);}
  $('compact-direct').hidden=!isMethod;
  $('compact-method-value').textContent=isMethod?`${a.approach_name}: ${fmt(result.methods[a.approach_id].current_potential)} GtCO₂e/yr · ${state.methods[a.approach_id].mode==='assumptions'?'from assumptions':state.methods[a.approach_id].mode.replaceAll('_',' ')}`:'';
  if(!isMethod){$('compact-primary').hidden=true;return;}
  $('compact-primary').hidden=false;
  const input=$('compact-direct-value');input.max=a.physical_limit_potential;input.step=a.physical_limit_potential/1000;input.value=result.methods[a.approach_id].current_potential;
  $('compact-resume').hidden=state.methods[a.approach_id].mode==='assumptions';
  if($('compact-primary').dataset.method!==a.approach_id){$('compact-primary').replaceChildren();$('compact-primary').dataset.method=a.approach_id;}
  for(const [i,c] of a.constraints.slice(0,3).entries()) {
    const wrap=controls.get(c.constraint_id).input.parentElement;
    const parent=compactMedia.matches?$('compact-primary'):$('constraint-controls').children[i];
    if(wrap.parentElement!==parent)parent.append(wrap);
  }
}

function navigate(next) {
  // Avoid leaving focus on an orb or title that the zoom hides.
  document.activeElement?.blur?.();
  view=next;focus=null;$('evidence').open=false;$('sources').open=false;render();
  if(next.level!=='overall') $('back').focus({preventScroll:true});
}
function setPreset(preset, scope=null) {state=applyPreset(data,state,preset,scope);render();$('status').textContent=`${scope?'Selected method':'All methods'} restored to ${presetName(preset)}. Total ${fmt(result.total)} gigatonnes per year.`;}
function updateConstraint(id, value) {state=setConstraint(state,selected(),id,value);render();}
$('ipcc-preset').addEventListener('click',()=>setPreset('ipcc'));
$('resume-assumptions').addEventListener('click',()=>{state=resumeAssumptions(state,selected());render();});
$('practical-preset').addEventListener('click',()=>setPreset('practical_scenario'));
$('physical_limit-preset').addEventListener('click',()=>setPreset('physical_limit'));
$('back').addEventListener('click',()=>navigate(view.level==='method'&&view.parent?{level:'cluster',id:view.parent}:{level:'overall'}));
document.querySelectorAll('[data-local]').forEach(b=>b.addEventListener('click',()=>setPreset(b.dataset.local,view.id)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&view.level!=='overall')$('back').click();});

function paintGlobalBars() {
  const max=Math.max(data.reference.value,result.total), step=max<=25?5:max<=100?20:100, ceiling=Math.ceil(max/step)*step, h=300;
  $('axis').replaceChildren();
  for(let v=0;v<=ceiling;v+=step) {
    const y=320-h*v/ceiling;
    add($('axis'),'line',{x1:-8,x2:204,y1:y,y2:y,stroke:'#e0e6e1','stroke-width':1});
    add($('axis'),'text',{x:-18,y:y+4,'text-anchor':'end',class:'axis-label'},v);
  }
  const rh=h*data.reference.value/ceiling;$('reference-bar').setAttribute('y',320-rh);$('reference-bar').setAttribute('height',rh);
  let sum=0;
  for(const a of data.approaches) {
    const value=result.methods[a.approach_id].current_potential,s=segments.get(a.approach_id),height=h*value/ceiling,y=320-h*(sum+value)/ceiling;
    s.setAttribute('y',y);s.setAttribute('height',height);s.dataset.y=y;s.dataset.h=height;sum+=value;
  }
  $('target-number').textContent=fmt(data.reference.value);$('total-number').textContent=fmt(result.total);
}
function focusIds() {
  const f=focus || (view.level==='method'?{kind:'method',id:view.id}:view.level==='cluster'?{kind:'cluster',id:view.id}:null);
  return f ? data.approaches.filter(a=>f.kind==='method'?a.approach_id===f.id:a.cluster===f.id).map(a=>a.approach_id) : [];
}
function paintHighlight() {
  const ids=focusIds();let bottom=-Infinity,top=Infinity;
  for(const a of data.approaches) {
    const active=ids.includes(a.approach_id),orb=orbs.get(a.approach_id),s=segments.get(a.approach_id);
    orb.style.opacity=orb.dataset.visible==='false'?0:ids.length>0&&!active&&view.level!=='method'?.18:1;orb.classList.toggle('emphasised',active);
    s.setAttribute('fill',active?colors[a.cluster].stroke:'#287952');s.setAttribute('opacity',ids.length?(active?1:.20):.9);
    s.setAttribute('stroke',active?'#203d2c':'#fcfdfc');s.setAttribute('stroke-width',active?.8:.3);
    if(active) {top=Math.min(top,+s.dataset.y);bottom=Math.max(bottom,+s.dataset.y+ +s.dataset.h);}
  }
  for(const [id,g] of clusterEls)g.classList.toggle('dimmed',!!focus&&(focus.kind==='cluster'?focus.id!==id:!data.approaches.some(a=>a.approach_id===focus.id&&a.cluster===id)));
  $('highlight-marker').replaceChildren();
  if(ids.length&&Number.isFinite(top)) {
    const mid=(top+bottom)/2, amount=ids.reduce((s,id)=>s+result.methods[id].current_potential,0);
    add($('highlight-marker'),'path',{d:`M200 ${top}H208V${bottom}H200 M208 ${mid}H230`,fill:'none',stroke:'#1b4431','stroke-width':2});
    add($('highlight-marker'),'text',{x:236,y:mid+5,'font-size':15,fill:'#1b4431'},fmt(amount));
  }
  if(focus) {
    const isMethod=focus.kind==='method',a=isMethod?data.approaches.find(a=>a.approach_id===focus.id):null;
    $('hover-name').textContent=isMethod?a.approach_name:`${focus.id[0].toUpperCase()+focus.id.slice(1)} total`;
    const v=isMethod?result.methods[focus.id].current_potential:result.clusters[focus.id];
    $('hover-value').textContent=`${fmt(v)} GtCO₂e/yr · ${result.total>0?(v/result.total*100).toFixed(1):'0'}% of the current total`;
  } else {$('hover-name').textContent='';$('hover-value').textContent='';}
  $('hover-copy').setAttribute('visibility',view.level==='overall'?'visible':'hidden');
  if(view.level==='cluster'){
    const hovered=focus?.kind==='method'?data.approaches.find(a=>a.approach_id===focus.id):null;
    $('detail-name').textContent=hovered?`${hovered.approach_name} · ${fmt(result.methods[hovered.approach_id].current_potential)} GtCO₂e/yr`:`${view.id.toUpperCase()} · ${fmt(result.clusters[view.id])} GtCO₂e/yr`;
  }
  if(view.level==='overall')for(const [id,g] of clusterEls)g.style.opacity=g.classList.contains('dimmed')?.18:1;
}
function createControls(a) {
 const container=$('constraint-controls');
 if(container.dataset.method===a.approach_id)return;
 container.replaceChildren();$('secondary-body').replaceChildren();$('secondary-controls').open=false;controls.clear();container.dataset.method=a.approach_id;
 const positions=[[820,118,340,135],[1000,290,278,155],[760,476,430,132]];
 a.constraints.forEach((c,i)=>{
  const wrap=document.createElement('div');wrap.className='control';
  const label=document.createElement('label');label.htmlFor=`control-${c.constraint_id}`;label.textContent=c.name;wrap.append(label);
  const output=document.createElement('output');output.htmlFor=label.htmlFor;wrap.append(output);
  let input;
  if(c.control_type==='continuous'){input=document.createElement('input');Object.assign(input,{type:'range',min:c.minimum,max:c.maximum,step:c.step});}
  else {input=document.createElement('select');for(const o of c.allowed_options){const option=document.createElement('option');option.value=o.value;option.textContent=o.label;input.append(option);}}
  input.id=label.htmlFor;input.setAttribute('aria-label',c.name);input.addEventListener(c.control_type==='continuous'?'input':'change',()=>updateConstraint(c.constraint_id,Number(input.value)));wrap.append(input);
  if(i<3){const [x,y,width,height]=positions[i];const fo=add(container,'foreignObject',{x,y,width,height});wrap.setAttribute('xmlns','http://www.w3.org/1999/xhtml');fo.append(wrap);}
  else {$('secondary-body').append(wrap);}
  controls.set(c.constraint_id,{input,output});
 });
}
function paintMethod(a) {
 const g=$('method-bar');
 // Keep the interactive bar node alive while pointer capture is active.
 if(g.dataset.method!==a.approach_id){
  g.replaceChildren();g.dataset.method=a.approach_id;
  add(g,'g',{id:'method-display','pointer-events':'none'});
  const hit=add(g,'rect',{id:'bar-input',x:494,y:250,width:98,height:286,fill:'transparent',role:'slider',tabindex:0,'aria-label':'Choose potential directly','aria-valuemin':0,'aria-orientation':'vertical'});
  const fromPointer=e=>{const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform($('scene').getScreenCTM().inverse());const a=selected();state=setDirectPotential(state,a,(536-pt.y)/285*a.physical_limit_potential);render();};
  hit.addEventListener('pointerdown',e=>{e.preventDefault();hit.setPointerCapture(e.pointerId);fromPointer(e);});
  hit.addEventListener('pointermove',e=>{if(hit.hasPointerCapture(e.pointerId))fromPointer(e);});
  hit.addEventListener('pointerup',e=>{if(hit.hasPointerCapture(e.pointerId))hit.releasePointerCapture(e.pointerId);});
  hit.addEventListener('keydown',e=>{const a=selected(),v=result.methods[a.approach_id].current_potential,step=a.physical_limit_potential/100;let target;if(['ArrowUp','ArrowRight'].includes(e.key))target=v+step;if(['ArrowDown','ArrowLeft'].includes(e.key))target=v-step;if(e.key==='Home')target=0;if(e.key==='End')target=a.physical_limit_potential;if(target!==undefined){e.preventDefault();state=setDirectPotential(state,a,target);render();}});
 }
 const display=$('method-display');display.replaceChildren();const x=510,w=66,h=285,baseline=536,limit=a.physical_limit_potential,v=result.methods[a.approach_id].current_potential,scale=h/limit;
 add(display,'text',{x:x+w/2,y:151,'text-anchor':'middle',class:'method-number'},fmt(v));
 add(display,'text',{x:x+w/2,y:178,'text-anchor':'middle',class:'units'},a.unit);
 const mode=state.methods[a.approach_id].mode;
 add(display,'text',{x:x+w/2,y:202,'text-anchor':'middle',class:'mode-label'},mode==='direct'?'USER SELECTED':mode==='assessment'?(result.methods[a.approach_id].qualification?'BOOK FALLBACK':'ASSESSMENT REFERENCE'):mode==='resource_reference'?'RESOURCE REFERENCE':'FROM ASSUMPTIONS');
 add(display,'rect',{x,y:baseline-h,width:w,height:h,fill:'#e8edec'});
 add(display,'rect',{x,y:baseline-v*scale,width:w,height:v*scale,fill:colors[a.cluster].stroke,'data-result':'method'});
 const refs=[[limit,'Physical Limit','#536767'],[a.practical_scenario_potential,'Practical Scenario','#287952']];
 if(a.ipcc.midpoint!==null)refs.push([a.ipcc.midpoint,'IPCC midpoint','#697692']);
 const labels=[];
 for(const [value,name,color] of refs.sort((a,b)=>b[0]-a[0])){
  const y=baseline-Math.min(value,limit)*scale;let ly=y;
  for(const old of labels)if(ly<old+38)ly=old+38;
  labels.push(ly);
  add(display,'path',{d:`M${x-12} ${y}H${x+w+22} L${x+w+37} ${ly}`,fill:'none',stroke:color,'stroke-width':1,'stroke-dasharray':'4 4'});
  add(display,'text',{x:x+w+43,y:ly-3,class:'ghost-label',fill:color},name+(value>limit?' ↑':''));
  add(display,'text',{x:x+w+43,y:ly+15,class:'ghost-label',fill:color},fmt(value)+(value>limit?' · above ceiling':''));
 }
 add(display,'line',{x1:x-5,x2:x+w+5,y1:baseline-v*scale,y2:baseline-v*scale,stroke:'#17494d','stroke-width':3});
 add(display,'text',{x:x+w/2,y:228,'text-anchor':'middle',class:'units'},'Click or drag to choose a value');
 const hit=$('bar-input');hit.setAttribute('aria-valuemax',limit);hit.setAttribute('aria-valuenow',v);hit.setAttribute('aria-valuetext',`${fmt(v)} ${a.unit}, ${mode}`);
 createControls(a);
 for(const c of a.constraints){const {input,output}=controls.get(c.constraint_id);input.value=state.methods[a.approach_id].constraints[c.constraint_id];output.textContent=`${fmt(+input.value)} ${c.unit}`;input.setAttribute('aria-valuetext',output.textContent);}
 $('secondary-controls').hidden=a.constraints.length<=3;
 $('mode-control').toggleAttribute('hidden',mode==='assumptions');
 $('connections').replaceChildren();for(const [x,y] of [[875,242],[1000,348],[875,476]])add($('connections'),'line',{x1:875,y1:353,x2:x,y2:y,stroke:'#c5d7cb','stroke-width':1.5});
 $('detail-subtitle').textContent=mode==='assumptions'?'Change the assumptions, or choose a value on the bar':mode==='direct'?'Your selected potential · assumptions kept unchanged':mode==='assessment'?(result.methods[a.approach_id].qualification?'Book Practical Scenario fallback · no matching IPCC range':'IPCC reference · change a control to return to book assumptions'):'Book resource case · change a control to use the technical equation';
}
function updateEvidence() {
 const area=$('evidence-body'),sources=$('sources-body');area.replaceChildren();sources.replaceChildren();
 const para=(parent,text)=>{const e=document.createElement('p');e.textContent=text;parent.append(e);};
 const link=(parent,text,url)=>{const e=document.createElement('a');e.textContent=text;e.href=url;e.target='_blank';e.rel='noopener';parent.append(e);};
 para(area,'The red bar is the book’s 19-GtCO₂ annual atmospheric increase: 40 from human emissions minus 21 absorbed naturally. It is not total emissions. Potential is credited removal in CO₂-equivalent units; this comparison is not an exact physical CO₂ balance.');
 if(view.level==='method'){
  const a=selected(),ip=a.ipcc,r=result.methods[a.approach_id];
  para(area,`${a.book_chapter}, page ${a.references[0].page} in the v13 review layout. Book calculation: ${a.equation}.`);
  para(area,`Physical Limit resource equation: ${a.physical_limit_calculation.equation}.`);
  para(area,`Mode: ${state.methods[a.approach_id].mode.replaceAll('_',' ')}. Direct selection and assessed references do not imply a unique set of scientific assumptions. Changing a control resumes the displayed book equation.`);
  if(r.bound_applied)para(area,`Uncapped result ${fmt(r.raw_potential)}; tool result capped at ${fmt(a.physical_limit_potential)}. The book resource limit is unchanged.`);
  if(ip.midpoint!==null)para(sources,`IPCC range: ${ip.lower}–${ip.upper} ${ip.unit}; arithmetic midpoint ${fmt(ip.midpoint)}. ${ip.location}, ${ip.category}. ${ip.qualification}`);
  else para(sources,ip.qualification);
  link(sources,`${ip.source_report} · ${ip.location}`,ip.source_url);
  for(const c of a.constraints)para(sources,`${c.name}: ${c.description} Practical Scenario ${c.default_practical_scenario} ${c.unit}; Physical Limit setting ${c.default_physical_limit===null?'not uniquely mapped':c.default_physical_limit+' '+c.unit}. ${c.notes} Source: ${c.source_page_or_chapter}.`);
  para(sources,'Review: '+(a.review_issues.join(' ')||'The assessed potential and the book deployment scenario have different scopes.'));
  para(sources,'Shared resources: '+a.resource_dependencies.join(', ')+'. These interactions are not yet reconciled.');
 }else{
  para(area,`Standalone chapter values are summed before shared-resource deductions. The book’s coordinated Practical Scenario is ${fmt(data.aggregation.coordinated_book_practical_scenario)} GtCO₂e/yr. Avoided natural releases and storage services are not added as extra removals.`);
  para(sources,'Practical Scenario is our worked scenario using the resource and deployment assumptions in the book. It is not a measure of today’s installed capability. IPCC Assessed uses arithmetic range midpoints, not reported means. Physical Limit uses the book’s permissive resource cases. They are different kinds of reference, not low/medium/high forecasts.');
  para(sources,'IPCC comparison: nine methods have mapped assessed ranges. Peat, coastal restoration, macroalgae and direct ocean capture use labelled Book Practical Scenario fallbacks because an appropriate separate range was not identified. Biochar and alkalinity midpoints exceed their book ceilings and are capped in the tool. The aggregate is therefore a mixed comparison, not an IPCC-assessed portfolio.');
  link(sources,'IPCC AR6 WGIII Chapter 12', 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-12/');
  para(sources,'Cropland and grassland ranges are assessed separately in Chapter 7 §7.4.3.1. Range definitions, dates and geographic constraints differ. Land, biomass, nutrients, clean energy and geological storage remain shared limitations; adding methods does not establish feasibility.');
 }
}
function render() {
  result=calculate(data,state);paintGlobalBars();
  const overview=view.level==='overall',method=view.level==='method',a=selected();
  $('back').hidden=overview;$('location').textContent=overview?'OVERALL':method?`OVERALL / ${a.cluster.toUpperCase()} / ${a.short_name.toUpperCase()}`:`OVERALL / ${view.id.toUpperCase()}`;
  $('global-bars').style.transform=overview?'translate(525px,165px)':'translate(62px,258px) scale(.78)';
  $('detail-heading').toggleAttribute('hidden',overview);$('method-bar').toggleAttribute('hidden',!method);$('local-presets').toggleAttribute('hidden',!method);$('mode-control').toggleAttribute('hidden',!method);$('secondary-controls').hidden=!method;$('constraint-controls').toggleAttribute('hidden',!method||!a.constraints.length);
  $('detail-name').textContent=method?a.approach_name:overview?'':`${view.id.toUpperCase()} · ${fmt(result.clusters[view.id])} GtCO₂e/yr`;
  if(!method){$('connections').replaceChildren();$('detail-subtitle').textContent='One family within the global account · click a method to go deeper';}
  for(const [id,g] of clusterEls){g.style.opacity=overview?1:0;g.setAttribute('aria-hidden',!overview);g.style.pointerEvents=overview?'auto':'none';g.setAttribute('tabindex',overview?0:-1);g.querySelector('.cluster-value').textContent=`${fmt(result.clusters[id])} GtCO₂e/yr`;}
  const family=view.level==='cluster'?data.approaches.filter(a=>a.cluster===view.id):[];
  for(const a0 of data.approaches) {
    const g=orbs.get(a0.approach_id),visible=overview||(method?a0.approach_id===view.id:a0.cluster===view.id);let [x,y]=positions[a0.approach_id];
    if(method&&visible){x=875;y=353;}else if(view.level==='cluster'&&visible){const i=family.indexOf(a0),angle=(i/family.length)*2*Math.PI-Math.PI/2;x=850+235*Math.cos(angle);y=375+200*Math.sin(angle);}
    g.style.transform=`translate(${x}px,${y}px)`;g.dataset.visible=String(visible);g.style.opacity=visible?1:0;g.style.pointerEvents=visible?'auto':'none';g.setAttribute('tabindex',visible?0:-1);g.setAttribute('aria-hidden',!visible);
    g.querySelector('circle').setAttribute('r',method&&visible?62:33);g.querySelector('text').setAttribute('y',method?88:60);
    const vt=g.querySelector('.orb-value');vt.textContent=`${fmt(result.methods[a0.approach_id].current_potential)}`;vt.setAttribute('y',method?111:82);
    g.setAttribute('aria-label',`${a0.approach_name}, ${fmt(result.methods[a0.approach_id].current_potential)} gigatonnes per year. Inspect assumptions.`);
  }
  if(method)paintMethod(a);
  let active=null;for(const p of ['practical_scenario','ipcc','physical_limit']){const on=isPreset(data,state,p);$(p==='practical_scenario'?'practical-preset':p+'-preset').setAttribute('aria-pressed',on);if(on)active=p;}
  $('preset-state').textContent=active?presetName(active):'CUSTOM';
  $('view-hint').textContent=overview?'Hover to compare · click to explore':method?'Zoom out keeps your changes':'Click a method to explore its assumptions';
  const current=method?result.methods[view.id]:null;
  $('scenario-note').textContent=current?.bound_applied?`Capped at the book Physical Limit · reference value ${fmt(current.raw_potential)} remains visible above.`:current?.qualification?current.qualification:active==='ipcc'?'Mixed comparison · 9 assessed ranges, 4 book fallbacks, 2 capped midpoints · details below':'Standalone sum · shared resources not yet reconciled';
  paintHighlight();updateEvidence();paintCompact();

}
render();

// Optional browser WebMCP surface: same state/actions as the visible controls.
const context=document.modelContext;
if(context?.registerTool) {
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const tools=[{name:'read_carbon_scenario',description:'Read the visible carbon scenario and accounting qualification.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({view,total:result.total,clusters:result.clusters,methods:result.methods,accounting:result.reconciliation.status})},{name:'restore_carbon_preset',description:'Restore all methods or one method to an explicit book scenario; updates the visible bars.',inputSchema:{type:'object',properties:{preset:{enum:['practical_scenario','ipcc','physical_limit']},scope:{type:'string'}},required:['preset'],additionalProperties:false},execute:input=>{setPreset(input.preset,input.scope||null);return {total:result.total};}}];
  for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}

let tutorialView;
initTutorial("management", {
  onStart: () => { tutorialView = {...view}; },
  onStep: step => navigate(step < 2 ? {level:"overall"} : {level:"method",id:"forest"}),
  onClose: () => navigate(tutorialView),
});

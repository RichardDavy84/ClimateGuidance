// Scientific state and calculations are independent of presentation.
export const PRESETS=['practical_scenario','ipcc','physical_limit'];
export function presetSettings(a,preset) {
 if(!PRESETS.includes(preset))throw new Error('Unknown preset');
 return {scenario:preset,mode:preset==='ipcc'?'assessment':preset==='physical_limit'?'resource_reference':'assumptions',direct:null,constraints:Object.fromEntries(a.constraints.map(c=>[c.constraint_id,c[preset==='physical_limit'&&a.physical_controls_supported?'default_physical_limit':'default_practical_scenario']]))};
}
export function createState(data,preset='practical_scenario'){return {methods:Object.fromEntries(data.approaches.map(a=>[a.approach_id,presetSettings(a,preset)]))};}
export function validateConstraint(a,id,value){const c=a.constraints.find(c=>c.constraint_id===id);if(!c||!Number.isFinite(value)||typeof value!=='number')throw new Error('Unknown constraint or non-finite value');if(value<c.minimum||value>c.maximum)throw new Error('Value outside the allowed range');if(c.control_type==='discrete'&&!c.allowed_options.some(o=>o.value===value))throw new Error('Choose an allowed scenario');return c;}
export function setConstraint(state,a,id,value){validateConstraint(a,id,value);const old=state.methods[a.approach_id];return {...state,methods:{...state.methods,[a.approach_id]:{...old,scenario:'custom',mode:'assumptions',direct:null,constraints:{...old.constraints,[id]:value}}}};}
export function setDirectPotential(state,a,value){if(typeof value!=='number'||!Number.isFinite(value))throw new Error('Invalid potential');return {...state,methods:{...state.methods,[a.approach_id]:{...state.methods[a.approach_id],scenario:'custom',mode:'direct',direct:Math.max(0,Math.min(value,a.physical_limit_potential))}}};}
export function resumeAssumptions(state,a){return {...state,methods:{...state.methods,[a.approach_id]:{...state.methods[a.approach_id],scenario:'custom',mode:'assumptions',direct:null}}};}
export function applyPreset(data,state,preset,scope=null){if(!PRESETS.includes(preset))throw new Error('Unknown preset');if(scope&&!data.approaches.some(a=>a.approach_id===scope||a.cluster===scope))throw new Error('Unknown scope');const methods={...state.methods};for(const a of data.approaches)if(!scope||a.approach_id===scope||a.cluster===scope)methods[a.approach_id]=presetSettings(a,preset);return {...state,methods};}
export function calculateAssumptions(a,c){for(const v of a.constraints)validateConstraint(a,v.constraint_id,c[v.constraint_id]);
 if(a.calculation_method==='book_factor_product')return a.model.terms.reduce((n,t)=>n*c[t.id]*t.scale,a.model.coefficient);
 if(a.calculation_method==='dac_energy_minimum')return Math.min(c.electricity/a.constants.electricity_MWh_per_t,c.heat/a.constants.heat_MWh_per_t)/1000*c.storage/100*c.delivery/100;
 if(a.calculation_method==='coastal_habitat_sum')return a.model.habitats.reduce((n,h)=>{const id=h.share.replace('_share','');return n+h.area_billion_ha*c[h.share]/100*c[id+'_rate']*c[id+'_success']/100;},0);
 throw new Error('Unresolved calculation method');
}
export function evaluateApproach(a,s){let raw,qualification=null;
 if(s.mode==='direct')raw=s.direct;
 else if(s.mode==='assessment'){raw=a.ipcc.midpoint;if(raw===null){raw=a.practical_scenario_potential;qualification='No applicable IPCC range; Book Practical Scenario retained.';}}
 else if(s.mode==='resource_reference')raw=a.physical_limit_potential;
 else raw=calculateAssumptions(a,s.constraints);
 if(!Number.isFinite(raw))throw new Error('Non-finite result');
 return {current_potential:Math.max(0,Math.min(raw,a.physical_limit_potential)),raw_potential:raw,bound_applied:raw>a.physical_limit_potential,mode:s.mode,qualification,unit:a.unit,verification_status:a.verification_status};
}
export function reconcileSharedResources(data,outputs){if(data.aggregation.strategy!=='naive_standalone_sum')throw new Error('Unknown aggregation');return {outputs,status:'unreconciled_standalone_sum',warning:data.aggregation.warning,adjustments:[]};}
export function calculate(data,state){const outputs=Object.fromEntries(data.approaches.map(a=>[a.approach_id,evaluateApproach(a,state.methods[a.approach_id])]));const reconciliation=reconcileSharedResources(data,outputs),clusters=Object.fromEntries(data.clusters.map(c=>[c.id,0]));for(const a of data.approaches)clusters[a.cluster]+=outputs[a.approach_id].current_potential;return {methods:outputs,clusters,total:Object.values(clusters).reduce((a,b)=>a+b,0),reconciliation};}
export function isPreset(data,state,preset){return data.approaches.every(a=>state.methods[a.approach_id].scenario===preset);}

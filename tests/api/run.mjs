import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const annotations = new Set(['title','description','example','examples','default','readOnly','writeOnly','deprecated','$schema','$id','xml','externalDocs','discriminator']);
const supported = new Set(['$ref','type','required','properties','items','additionalProperties','allOf','enum','minimum','maximum','minLength','maxLength','pattern','format','minItems','maxItems']);

// Checks the keywords used in Pet Clinic's live OpenAPI schemas.
// Unknown constraints fail rather than being silently ignored.
export function validate(doc, schema, value, location='$') {
  if (schema === true) return;
  assert.notEqual(schema, false, location+': forbidden value');
  assert.ok(schema && typeof schema === 'object', location+': missing schema');
  for (const key of Object.keys(schema)) assert.ok(supported.has(key)||annotations.has(key)||key.startsWith('x-'), location+': unsupported schema keyword '+key);
  if (schema.$ref) {
    assert.ok(schema.$ref.startsWith('#/'), 'Only local contract references supported');
    const target = schema.$ref.slice(2).split('/').reduce((o,k)=>o?.[k.replaceAll('~1','/').replaceAll('~0','~')],doc);
    assert.ok(target,'Unresolved reference '+schema.$ref);
    validate(doc,target,value,location);
  }
  for (const child of schema.allOf??[]) validate(doc,child,value,location);
  if (schema.type) {
    const types = Array.isArray(schema.type)?schema.type:[schema.type];
    assert.ok(types.some(t=>t==='array'?Array.isArray(value):t==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):t==='integer'?Number.isInteger(value):t==='null'?value===null:typeof value===t),location+': expected '+types.join('|'));
  }
  if (schema.enum) assert.ok(schema.enum.some(v=>JSON.stringify(v)===JSON.stringify(value)),location+': enum mismatch');
  if (typeof value==='string') {
    if (schema.minLength!==undefined) assert.ok([...value].length>=schema.minLength,location+': minLength');
    if (schema.maxLength!==undefined) assert.ok([...value].length<=schema.maxLength,location+': maxLength');
    if (schema.pattern) assert.match(value,new RegExp(schema.pattern,'u'),location+': pattern');
  }
  if (typeof value==='number') {
    if (schema.minimum!==undefined) assert.ok(value>=schema.minimum,location+': minimum');
    if (schema.maximum!==undefined) assert.ok(value<=schema.maximum,location+': maximum');
  }
  if (schema.format) {
    assert.ok(['date','date-time','uri','int32','int64'].includes(schema.format),location+': unsupported format '+schema.format);
    if (schema.format==='date'&&typeof value==='string') {
      assert.match(value,/^\d{4}-\d{2}-\d{2}$/);
      assert.equal(new Date(value).toISOString().slice(0,10),value,location+': invalid calendar date');
    }
    if (schema.format==='date-time'&&typeof value==='string') {
      assert.match(value,/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i);
      assert.ok(Number.isFinite(Date.parse(value)),location+': invalid date-time');
    }
    if (schema.format==='uri'&&typeof value==='string') assert.ok(new URL(value).protocol);
    if (schema.format==='int32'&&typeof value==='number') assert.ok(Number.isInteger(value)&&value>=-2147483648&&value<=2147483647,location+': int32');
    if (schema.format==='int64'&&typeof value==='number') assert.ok(Number.isSafeInteger(value),location+': unsafe int64');
  }
  if (Array.isArray(value)) {
    if (schema.minItems!==undefined) assert.ok(value.length>=schema.minItems);
    if (schema.maxItems!==undefined) assert.ok(value.length<=schema.maxItems);
    if (schema.items!==undefined) value.forEach((v,i)=>validate(doc,schema.items,v,location+'['+i+']'));
  } else if (value!==null&&typeof value==='object') {
    for (const key of schema.required??[]) assert.ok(Object.hasOwn(value,key),location+': missing '+key);
    for (const [key,v] of Object.entries(value)) {
      if (schema.properties?.[key]!==undefined) validate(doc,schema.properties[key],v,location+'.'+key);
      else if (schema.additionalProperties!==undefined) validate(doc,schema.additionalProperties,v,location+'.'+key);
    }
  }
}

function selfTest() {
  const doc={components:{schemas:{Sample:{type:'object',required:['id','name','date'],properties:{id:{type:'integer'},name:{type:'string',pattern:'^[\\p{L}]+$',minLength:1},date:{type:'string',format:'date'}}}}}};
  const schema={$ref:'#/components/schemas/Sample'};
  validate(doc,schema,{id:1,name:'Test',date:'2020-02-20'});
  for(const bad of [{name:'Test',date:'2020-02-20'},{id:'1',name:'Test',date:'2020-02-20'},{id:1,name:'123',date:'2020-02-20'},{id:1,name:'Test',date:'2020-02-30'}]) assert.throws(()=>validate(doc,schema,bad));
  assert.throws(()=>validate({}, {type:'string',unknownConstraint:1},'Test'));
  assert.throws(()=>validate({}, {type:'string',format:'unknown'},'Test'));
  assert.throws(()=>validate({}, {type:'array',items:{type:'integer'}},[1,'bad']));
  assert.throws(()=>validate({}, {type:'object',additionalProperties:false},{extra:1}));
  console.log('Schema validator positive and mutation checks passed');
}

export async function runSuite({baseUrl=process.env.API_URL??'http://localhost:9966/petclinic',reportDir=path.join(here,'reports')}={}) {
  const base=baseUrl.replace(/\/$/,'');
  const url=new URL(base);
  assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&url.protocol==='http:','Test only your local service');
  const data=JSON.parse(await readFile(path.join(here,'fixtures.json'),'utf8'));
  const results=[]; const evidence=[]; const state={};
  async function check(name,fn) {try {await fn();results.push({name,status:'PASS'});console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:e.message});console.error('FAIL '+name+': '+e.message);}}
  async function request(method,route,body) {
    const r=await fetch(base+route,{method,headers:{accept:'*/*',...(body!==undefined?{'content-type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
    const text=await r.text();let json;
    try {json=text?JSON.parse(text):undefined;}catch {}
    const entry={method,route,status:r.status,contentType:(r.headers.get('content-type')??'').split(';')[0],body:json??text,location:r.headers.get('location')};
    evidence.push(entry);return {...entry,json};
  }
  let doc;
  await check('Load live OpenAPI 3.1 contract',async()=>{const r=await request('GET','/v3/api-docs');assert.equal(r.status,200);doc=r.json;assert.match(doc.openapi,/^3\.1\./);});
  async function exercise(name,method,route,template,body,expected,verify=()=>{}) {
    let r;
    await check(name+' — behaviour',async()=>{r=await request(method,route,body);assert.equal(r.status,expected,'Unexpected HTTP status');await verify(r);});
    if (!r) return;
    await check(name+' — OpenAPI contract',()=>{
      assert.ok(doc,'Contract unavailable');
      const operation=doc.paths[template]?.[method.toLowerCase()];
      assert.ok(operation,'Operation missing from OpenAPI: '+template);
      const response=operation.responses[String(r.status)];
      assert.ok(response,'Undocumented status '+r.status);
      if (response.content) {
        const definition=response.content[r.contentType];
        assert.ok(definition,'Undocumented content type '+r.contentType+'; documented: '+Object.keys(response.content).join(', '));
        assert.ok(r.json!==undefined,'Expected documented JSON response body');
        validate(doc,definition.schema,r.json);
      } else assert.ok(r.body===''||r.body===undefined,'Unexpected response body');
    });
    return r;
  }
  try {
    await check('Schema validator self-check',selfTest);
    await exercise('List owners','GET','/api/owners','/api/owners',undefined,200,r=>assert.ok(Array.isArray(r.json)));
    await exercise('List pet types','GET','/api/pettypes','/api/pettypes',undefined,200,r=>{state.type=r.json[0];assert.ok(Number.isInteger(state.type?.id));});
    await exercise('Create owner','POST','/api/owners','/api/owners',data.owner,201,r=>{state.owner=r.json.id;assert.ok(Number.isInteger(state.owner));for(const[k,v]of Object.entries(data.owner))assert.deepEqual(r.json[k],v);});
    await exercise('Create second owner','POST','/api/owners','/api/owners',data.secondOwner,201,r=>{state.other=r.json.id;assert.ok(Number.isInteger(state.other));});
    await exercise('Find created owner','GET','/api/owners?lastName='+encodeURIComponent(data.owner.lastName),'/api/owners',undefined,200,r=>{assert.ok(r.json.some(o=>o.id===state.owner));assert.ok(r.json.every(o=>o.lastName.startsWith(data.owner.lastName)));});
    await exercise('No-match surname search','GET','/api/owners?lastName=NoSuchApiOwner','/api/owners',undefined,404,r=>assert.equal(r.body,''));
    for(const field of Object.keys(data.owner)) for(const mode of ['missing','blank']) {const b={...data.owner};if(mode==='missing')delete b[field];else b[field]='';await exercise('Owner '+mode+' '+field,'POST','/api/owners','/api/owners',b,400);}
    for(const telephone of data.invalidTelephones) await exercise('Invalid telephone '+telephone,'POST','/api/owners','/api/owners',{...data.owner,telephone},400);
    const pet={...data.pet,type:state.type};
    const petPath='/api/owners/'+state.owner+'/pets';
    await exercise('Create pet','POST',petPath,'/api/owners/{ownerId}/pets',pet,201,r=>{state.pet=r.json.id;assert.ok(Number.isInteger(state.pet));assert.equal(r.json.ownerId,state.owner);assert.equal(r.json.name,pet.name);assert.equal(r.json.birthDate,pet.birthDate);assert.deepEqual(r.json.type,pet.type);});
    for(const field of ['name','birthDate','type']) {const b={...pet};delete b[field];await exercise('Pet missing '+field,'POST',petPath,'/api/owners/{ownerId}/pets',b,400);}
    await exercise('Pet blank name','POST',petPath,'/api/owners/{ownerId}/pets',{...pet,name:''},400);
    await exercise('Pet invalid date','POST',petPath,'/api/owners/{ownerId}/pets',{...pet,birthDate:'not-a-date'},400);
    await exercise('Pet unknown type','POST',petPath,'/api/owners/{ownerId}/pets',{...pet,type:{id:data.missingId,name:'InvalidTestType'}},404);
    await exercise('Pet missing owner','POST','/api/owners/'+data.missingId+'/pets','/api/owners/{ownerId}/pets',pet,404);
    const visitPath=petPath+'/'+state.pet+'/visits';
    await exercise('Book visit','POST',visitPath,'/api/owners/{ownerId}/pets/{petId}/visits',data.visit,201,r=>{state.visit=r.json.id;assert.ok(Number.isInteger(state.visit));assert.equal(r.json.petId,state.pet);assert.equal(r.json.date,data.visit.date);assert.equal(r.json.description,data.visit.description);});
    for(const field of ['date','description']) {const b={...data.visit};delete b[field];await exercise('Visit missing '+field,'POST',visitPath,'/api/owners/{ownerId}/pets/{petId}/visits',b,400);}
    await exercise('Visit blank description','POST',visitPath,'/api/owners/{ownerId}/pets/{petId}/visits',{...data.visit,description:''},400);
    await exercise('Visit invalid date','POST',visitPath,'/api/owners/{ownerId}/pets/{petId}/visits',{...data.visit,date:'not-a-date'},400);
    await exercise('Visit missing pet','POST',petPath+'/'+data.missingId+'/visits','/api/owners/{ownerId}/pets/{petId}/visits',data.visit,404);
    await exercise('Visit rejects wrong owner','POST','/api/owners/'+state.other+'/pets/'+state.pet+'/visits','/api/owners/{ownerId}/pets/{petId}/visits',data.visit,404);
    await exercise('Retrieve owner and nested records','GET','/api/owners/'+state.owner,'/api/owners/{ownerId}',undefined,200,r=>{for(const[k,v]of Object.entries(data.owner))assert.deepEqual(r.json[k],v);const p=r.json.pets.find(p=>p.id===state.pet);assert.ok(p);assert.ok(p.visits.some(v=>v.id===state.visit));});
    await exercise('Retrieve pet and its visit','GET','/api/pets/'+state.pet,'/api/pets/{petId}',undefined,200,r=>{assert.equal(r.json.ownerId,state.owner);assert.equal(r.json.name,pet.name);assert.ok(r.json.visits.some(v=>v.id===state.visit));});
    await exercise('Retrieve visit','GET','/api/visits/'+state.visit,'/api/visits/{visitId}',undefined,200,r=>{assert.equal(r.json.petId,state.pet);assert.equal(r.json.date,data.visit.date);assert.equal(r.json.description,data.visit.description);});
    for(const [resource,parameter] of [['owners','ownerId'],['pets','petId'],['visits','visitId']]) await exercise('Missing '+resource,'GET','/api/'+resource+'/'+data.missingId,'/api/'+resource+'/{'+parameter+'}',undefined,404);
  } catch(e) {results.push({name:'Suite infrastructure',status:'FAIL',error:e.message});}
  const summary={date:new Date().toISOString(),baseUrl:base,records:state,total:results.length,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,results,evidence};
  await mkdir(reportDir,{recursive:true});
  await writeFile(path.join(reportDir,'results.json'),JSON.stringify(summary,null,2));
  if(doc) await writeFile(path.join(reportDir,'openapi.json'),JSON.stringify(doc,null,2));
  const clean=s=>String(s).replaceAll('|','/').replaceAll('\n',' ');
  await writeFile(path.join(reportDir,'summary.md'),'# API quality gate\n\n'+summary.passed+' passed; '+summary.failed+' failed.\n\n| Check | Result | Detail |\n| --- | --- | --- |\n'+results.map(r=>'| '+clean(r.name)+' | '+r.status+' | '+clean(r.error??'')+' |').join('\n')+'\n');
  console.log(summary.passed+' passed; '+summary.failed+' failed. Reports: '+reportDir);
  return summary;
}

if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if(process.argv.includes('--self-test')) selfTest();
    else if(process.argv.includes('--intentional-failure')) assert.fail('Intentional gate proof');
    else {const summary=await runSuite();process.exitCode=summary.failed?1:0;}
  }catch(e){console.error(e.stack);process.exitCode=1;}
}

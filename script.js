/* ---------- C / WebAssembly loader (wasm/recursion.js built by Emscripten) ---------- */
let wasm=false;
const setBadge=()=>{const b=document.getElementById('badge');b.textContent=wasm?'Engine: C → WebAssembly ✓':'Engine: demo mirror (build wasm to use C)';b.classList.toggle('ok',wasm)};
window.Module={onRuntimeInitialized(){wasm=true;setBadge()}};
{const s=document.createElement('script');s.src='wasm/recursion.js';s.onerror=setBadge;document.head.appendChild(s)}

const A={
 factorial:{name:'Factorial',fn:'factorial',min:1,max:10,def:4,code:['Algorithm Factorial(n)','  If n ≤ 1  (base case)','    Return 1','  Else Return n × Factorial(n − 1)','End']},
 fibonacci:{name:'Fibonacci',fn:'fib',min:1,max:7,def:4,code:['Algorithm Fibonacci(n)','  If n ≤ 1  (base case)','    Return n','  Else Return Fibonacci(n − 1) + Fibonacci(n − 2)','End']}
};
let key='factorial',cur=null,steps=[],meta={},evCount=0,step=-1,playing=false,timer=null;

/* Event source: C via WebAssembly, or a demo mirror producing the identical 7-field events */
function runEngine(k,n){
 if(wasm){const c=k==='factorial'?Module._run_factorial(n):Module._run_fibonacci(n),p=Module._get_events()>>2,H=Module.HEAP32,o=[];
  for(let i=0;i<c;i++){const b=p+i*7;o.push({type:H[b],id:H[b+1],parent:H[b+2],depth:H[b+3],n:H[b+4],value:H[b+5],line:H[b+6]})}return o}
 const o=[];let nid=0;const em=(type,id,parent,depth,n,value,line)=>o.push({type,id,parent,depth,n,value,line});
 const f=(n,parent,depth)=>{const id=nid++;let r;em(0,id,parent,depth,n,0,0);em(1,id,parent,depth,n,0,0);
  if(n<=1){r=k==='factorial'?1:n;em(2,id,parent,depth,n,r,2)}else r=k==='factorial'?n*f(n-1,id,depth+1):f(n-1,id,depth+1)+f(n-2,id,depth+1);
  em(3,id,parent,depth,n,r,n<=1?2:3);em(4,id,parent,depth,n,r,4);return r};
 f(n,-1,0);return o;
}
function prepare(k,raw){
 evCount=raw.length;const kids={},pos={};let leaf=0;
 steps=raw.filter(e=>e.type===0||e.type===2||e.type===3);          /* PUSH/POP are shown together with CALL/RETURN */
 steps.forEach(e=>{if(e.type===0){kids[e.id]=[];if(e.parent>=0)kids[e.parent].push(e.id)}});
 const lay=i=>{const c=kids[i];if(!c.length){pos[i]=leaf++;return}c.forEach(lay);pos[i]=(pos[c[0]]+pos[c[c.length-1]])/2};lay(0);
 meta={pos,maxX:Math.max(1,leaf-1),maxD:Math.max(...steps.filter(e=>e.type===0).map(e=>e.depth))+1};
}
function stateAt(k){
 const S={nodes:new Map(),stack:[],calls:0,maxD:0,rets:[],op:'–',line:-1,result:null,baseNow:false,msg:''};const fn=A[cur.key].fn;
 for(let i=0;i<=k;i++){const e=steps[i];S.line=e.line;const lb=fn+'('+e.n+')';
  if(e.type===0){S.nodes.set(e.id,{label:lb,n:e.n,depth:e.depth,parent:e.parent,status:'wait'});S.stack.push(e.id);S.calls++;S.maxD=Math.max(S.maxD,S.stack.length);S.op='FUNCTION_CALL + STACK_PUSH  '+lb;S.msg=lb+' is called and pushed on top of the stack (last in, first out).'}
  else if(e.type===2){S.nodes.get(e.id).status='base';S.op='BASE_CASE  '+lb;S.msg='Base case reached: '+lb+' answers directly, so recursion stops here.'}
  else{const nd=S.nodes.get(e.id);nd.status='done';nd.value=e.value;S.stack.pop();S.rets.push(lb+' → '+e.value);S.op='RETURN + STACK_POP  '+lb+' = '+e.value;
   S.msg=lb+' returns '+e.value+' and is popped off the top of the stack.';if(e.id===0)S.result=e.value}
 }
 S.baseNow=k>=0&&steps[k].type===2;return S;
}

/* ---------- UI ---------- */
const $=id=>document.getElementById(id);
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const hl=s=>esc(s).replace(/\b(Algorithm|If|Else|Return|End)\b/g,'<span class="k">$1</span>').replace(/\b(\d+)\b/g,'<span class="n">$1</span>');
for(const k in A){const b=document.createElement('button');b.textContent=A[k].name;b.dataset.k=k;b.onclick=()=>pick(k);$('tabs').appendChild(b)}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go;g==='about'?$('about').showModal():document.getElementById(g==='top'?'top':'lab').scrollIntoView({behavior:'smooth'})});
function pick(k){key=k;stop();steps=[];step=-1;cur=null;const a=A[k];
 [...$('tabs').children].forEach(b=>b.classList.toggle('on',b.dataset.k===k));
 $('inp').min=a.min;$('inp').max=a.max;$('inp').value=a.def;$('hint').textContent='Value of n · allowed '+a.min+' to '+a.max;$('err').textContent='';
 $('code').innerHTML=a.code.map((l,i)=>'<div class="l" data-i="'+i+'">'+hl(l)+'</div>').join('');
 $('title').textContent=a.name.toUpperCase();$('msg').textContent='Press Start Visualization. Drag to orbit, scroll to zoom.';
 buildScene();render()}
function start(){const a=A[key],raw=$('inp').value.trim(),n=Number(raw);
 if(raw===''||!Number.isInteger(n)||n<a.min||n>a.max){$('err').textContent='Enter a whole number from '+a.min+' to '+a.max+'.';return}
 $('err').textContent='';stop();cur={key,n};prepare(key,runEngine(key,n));buildScene();go(0);play()}
function go(k){step=Math.max(-1,Math.min(steps.length-1,k));render()}
function play(){if(!steps.length)return;if(step>=steps.length-1)go(-1);playing=true;schedule();render()}
function stop(){playing=false;clearInterval(timer)}
function schedule(){clearInterval(timer);timer=setInterval(()=>{if(step>=steps.length-1){stop();render();return}go(step+1)},1100/Number($('spd').value))}
function render(){
 const has=steps.length>0,S=has?stateAt(step):{nodes:new Map(),stack:[],calls:0,maxD:0,rets:[],op:'–',line:-1,result:null,baseNow:false,msg:''},top=S.stack[S.stack.length-1];
 $('bPrev').disabled=!has||step<0;$('bNext').disabled=!has||step>=steps.length-1;$('bPlay').disabled=!has;$('bReset').disabled=!has;$('bPlay').textContent=playing?'⏸ Pause':'▶ Play';
 $('sCalls').textContent=S.calls;$('sDepth').textContent=S.stack.length;$('sMax').textContent=S.maxD;$('sEv').textContent=has?evCount:0;
 $('sRets').textContent=S.rets.length?S.rets.slice(-6).join('  ·  '):'–';$('sRes').textContent=S.result===null?'–':S.result;
 $('op').textContent=S.op;$('banner').classList.toggle('show',S.baseNow);if(S.msg)$('msg').textContent=S.msg;
 $('stk').innerHTML=S.stack.length?S.stack.slice().reverse().map(id=>{const n=S.nodes.get(id);return '<div class="fr '+(id===top?'act ':'')+(n.status==='base'?'bs':'')+'"><span>'+esc(n.label)+'</span><small>depth '+(n.depth+1)+(id===top?' · active':'')+'</small></div>'}).join(''):'<div class="empty">Stack is empty</div>';
 document.querySelectorAll('#code .l').forEach(l=>l.classList.toggle('on',Number(l.dataset.i)===S.line));
 syncScene(S,top);
}
$('start').onclick=start;$('inp').addEventListener('keydown',e=>{if(e.key==='Enter')start()});
$('bNext').onclick=()=>{stop();go(step+1)};$('bPrev').onclick=()=>{stop();go(step-1)};$('bReset').onclick=()=>{stop();go(-1)};
$('bPlay').onclick=()=>{playing?(stop(),render()):play()};$('spd').oninput=e=>{$('spv').textContent=e.target.value+'x';if(playing)schedule()};

/* ---------- Three.js: green and black scene ---------- */
const stage=$('stage'),cv=$('c');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.setClearColor(0x070b12);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x070b12,.017);
const camera=new THREE.PerspectiveCamera(45,1,.1,200);
scene.add(new THREE.AmbientLight(0x2a3f66,.9));
const sun=new THREE.SpotLight(0xeaf3ff,1.2,80,.6,.5);sun.position.set(8,18,10);sun.castShadow=true;scene.add(sun);
[[-9,5,6],[9,4,-4]].forEach(p=>{const l=new THREE.PointLight(0x22d3ee,1.2,40);l.position.set(...p);scene.add(l)});
const dust=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(Array.from({length:240},(_, i)=>i%3===1?Math.random()*18:(Math.random()-.5)*40),3)),new THREE.PointsMaterial({color:0x22d3ee,size:.07,transparent:true,opacity:.55}));scene.add(dust);
const world=new THREE.Group();scene.add(world);
const boxG=new THREE.BoxGeometry(3.6,1,1.8),smallG=new THREE.BoxGeometry(1.7,.8,.8),planeG=new THREE.PlaneGeometry(1,1);
const edgeBig=new THREE.EdgesGeometry(boxG),edgeSm=new THREE.EdgesGeometry(smallG);
const COL={wait:[0x1d4e89,0x000000],act:[0x0ea5c6,0x22d3ee],base:[0x4ade80,0x4ade80],done:[0x1e293b,0x000000]};
function tex(t){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.font='600 54px "JetBrains Mono",monospace';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#F1F6FF';g.fillText(t,256,66,490);return new THREE.CanvasTexture(c)}
let objs=new Map();const cam={tx:0,ty:3,dist:14,gx:0,gy:3,gd:14,az:0,el:.4,zoom:1};
function buildScene(){objs.forEach(o=>{world.remove(o.g);if(o.line)world.remove(o.line)});objs.clear();
 if(!steps.length){cam.gy=3;cam.gd=14;return}
 if(cur.key==='fibonacci'){cam.gy=meta.maxD*1.6/2+.5;cam.gd=Math.max(13,meta.maxX*1.75*1.1+4)}else{const H=(meta.maxD+1)*1.15;cam.gy=H/2;cam.gd=Math.max(11,H*1.45+5)}}
function mkNode(small,from){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:COL.wait[0],emissive:0,metalness:.55,roughness:.3});
 const m=new THREE.Mesh(small?smallG:boxG,mat);m.castShadow=true;g.add(m);
 g.add(new THREE.LineSegments(small?edgeSm:edgeBig,new THREE.LineBasicMaterial({color:0x22d3ee,transparent:true,opacity:.85})));
 const lb=new THREE.Mesh(planeG,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false}));lb.scale.set(small?1.6:3.4,small?.4:.85,1);lb.position.z=small?.42:.92;g.add(lb);
 g.position.copy(from);g.scale.setScalar(small?.001:.9);world.add(g);
 return{g,mat,lb,text:'',tp:from.clone(),ts:1,v:new THREE.Vector3(),sv:0,col:new THREE.Color(COL.wait[0]),em:new THREE.Color(0)}}
function syncScene(S,top){
 if(!cur||!steps.length)return;const fib=cur.key==='fibonacci';
 for(const[id,n]of S.nodes){let o=objs.get(id);
  if(!o){const par=objs.get(n.parent);o=mkNode(fib,fib?(par?par.tp.clone():new THREE.Vector3()):new THREE.Vector3(0,n.depth*1.15+9,0));objs.set(id,o);
   if(fib&&n.parent>=0){o.line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0x67e8f9,transparent:true,opacity:.7}));o.pid=n.parent;world.add(o.line)}}
  if(fib)o.tp.set((meta.pos[id]-meta.maxX/2)*1.75,1+(meta.maxD-1-n.depth)*1.6,0);
  else if(n.status==='done')o.tp.set(0,n.depth*1.15+4,0);else o.tp.set(0,n.depth*1.15+.6,0);
  o.ts=(!fib&&n.status==='done')?0:1;
  const st=id===top?'act':n.status;o.col.setHex(COL[st][0]);o.em.setHex(COL[st][1]);
  const t=n.label+(n.status==='done'?'='+n.value:'');if(t!==o.text){o.text=t;if(o.lb.material.map)o.lb.material.map.dispose();o.lb.material.map=tex(t);o.lb.material.needsUpdate=true}}
 for(const[id,o]of objs)if(!S.nodes.has(id)){world.remove(o.g);if(o.line)world.remove(o.line);objs.delete(id)}
}
let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing'});
cv.addEventListener('pointermove',e=>{if(!drag)return;cam.az-=(e.clientX-drag.x)*.006;cam.el=Math.max(.05,Math.min(1.35,cam.el+(e.clientY-drag.y)*.005));drag={x:e.clientX,y:e.clientY}});
cv.addEventListener('pointerup',()=>{drag=null;cv.style.cursor='grab'});
cv.addEventListener('wheel',e=>{e.preventDefault();cam.zoom=Math.max(.5,Math.min(1.8,cam.zoom*(e.deltaY>0?1.08:.92)))},{passive:false});
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(stage);
function frame(t){requestAnimationFrame(frame);
 cam.tx+=(0-cam.tx)*.06;cam.ty+=(cam.gy-cam.ty)*.06;cam.dist+=(cam.gd-cam.dist)*.06;
 const asp=camera.aspect<1?1.6/camera.aspect*.75:1,d=cam.dist*cam.zoom*Math.max(1,asp),az=cam.az+Math.sin(t/4500)*.07;
 camera.position.set(d*Math.sin(az)*Math.cos(cam.el),cam.ty+d*Math.sin(cam.el),d*Math.cos(az)*Math.cos(cam.el));camera.lookAt(0,cam.ty,0);
 dust.rotation.y=t/60000;
 objs.forEach(o=>{const g=o.g;
  o.v.x=(o.v.x+(o.tp.x-g.position.x)*.15)*.74;o.v.y=(o.v.y+(o.tp.y-g.position.y)*.15)*.74;o.v.z=(o.v.z+(o.tp.z-g.position.z)*.15)*.74;g.position.add(o.v);
  o.sv=(o.sv+(o.ts-g.scale.x)*.15)*.72;const s=Math.max(g.scale.x+o.sv,.001);g.scale.setScalar(s);g.visible=s>.03;
  o.mat.color.lerp(o.col,.18);o.mat.emissive.lerp(o.em,.18);o.mat.emissiveIntensity=.55;
  if(o.line){const p=objs.get(o.pid);if(p){const a=o.line.geometry.attributes.position;a.setXYZ(0,p.g.position.x,p.g.position.y,0);a.setXYZ(1,g.position.x,g.position.y,0);a.needsUpdate=true;o.line.visible=g.visible}}});
 renderer.render(scene,camera)}
setBadge();pick('factorial');resize();requestAnimationFrame(frame);

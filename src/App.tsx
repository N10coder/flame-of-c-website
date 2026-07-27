import React, { useEffect, useRef,  } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
export default function App() {
const [muted, setMuted] = React.useState(true);
const videoRef = React.useRef<HTMLVideoElement|null>(null);
const mountRef = useRef<HTMLDivElement>(null);

useEffect(() => {
const mount = mountRef.current!;

// Drag hint arrows
const hint = document.createElement('div');
hint.innerHTML = '⟵ DRAG TO LOOK AROUND ⟶';
hint.style.cssText = 'position:fixed;bottom:60px;left:0;right:0;text-align:center;color:#00eaff;font-size:20px;font-weight:bold;font-family:sans-serif;text-shadow:0 0 8px #00eaff,0 0 4px #000;opacity:0.95;pointer-events:none;z-index:1000;transition:opacity 1.5s;';
document.body.appendChild(hint);
setTimeout(() => { hint.style.opacity = '0'; }, 6000);
setTimeout(() => { hint.remove(); }, 7500);

RectAreaLightUniformsLib.init();

const W = window.innerWidth;
const H = window.innerHeight;


// ROOM DIMENSIONS
const BW=550, RH=160, RD=550, HW=275, HH=80, HD=275;

// ── STARFIELD SKYBOX ──
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 2048; skyCanvas.height = 1024;
const skyCtx = skyCanvas.getContext('2d')!;
skyCtx.fillStyle = '#000008';
skyCtx.fillRect(0, 0, 2048, 1024);

// Nebula glows
const nebulae = [
{x:1150, y:175, r:60, c:'rgba(120,60,180,0.25)'},
{x:50, y:165, r:75, c:'rgba(200,100,50,0.15)'},
{x:100, y:100, r:100, c:'rgba(60,100,200,0.2)'},
];
nebulae.forEach(n => {
const g = skyCtx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
g.addColorStop(0, n.c);
g.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = g;
skyCtx.fillRect(n.x-n.r, n.y-n.r, n.r*2, n.r*2);
});

// Stars
const starData: {x:number,y:number,r:number,baseA:number,speed:number,twinkles:boolean}[] = [];
for (let i=0; i<1500; i++) {
const x = Math.random()*2048, y = Math.random()*1024;
const r = Math.random()*0.9 + 0.15;
const a = Math.random()*0.5 + 0.5;
starData.push({x,y,r,baseA:a, speed: Math.random()*1.5+0.3, twinkles: Math.random() > 0.4});
skyCtx.fillStyle = `rgba(255,255,255,${a})`;
skyCtx.beginPath(); skyCtx.arc(x,y,r,0,Math.PI*2); skyCtx.fill();
}

// Distant planets
// TEMP: adjust x/y for each to position them. Canvas is 2048 wide, 1024 tall.
const planets = [
{x:50, y:165, r:5, c1:'#cc8855', c2:'#663322'},
{x:1200, y:75, r:5, c1:'#88aacc', c2:'#334455'},
{x:1150, y:175, r:10, c1:'#aa6688', c2:'#442233'},
];
planets.forEach(p => {
const g = skyCtx.createRadialGradient(p.x-p.r*0.4,p.y-p.r*0.4,p.r*0.1,p.x,p.y,p.r*1.1);
g.addColorStop(0, p.c1);
g.addColorStop(0.6, p.c2);
g.addColorStop(1, '#000000');
skyCtx.fillStyle = g;
skyCtx.beginPath(); skyCtx.arc(p.x,p.y,p.r,0,Math.PI*2); skyCtx.fill();
skyCtx.save();
skyCtx.beginPath(); skyCtx.arc(p.x,p.y,p.r,0,Math.PI*2); skyCtx.clip();
const shadow = skyCtx.createRadialGradient(p.x+p.r*0.5,p.y+p.r*0.5,0,p.x+p.r*0.3,p.y+p.r*0.3,p.r*1.2);
shadow.addColorStop(0, 'rgba(0,0,0,0.55)');
shadow.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = shadow;
skyCtx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);
skyCtx.restore();
});
// Black hole with accretion disk
const bh = {x:1050, y:130, r:5};
const diskGrad = skyCtx.createRadialGradient(bh.x,bh.y,bh.r,bh.x,bh.y,bh.r*3);
diskGrad.addColorStop(0, 'rgba(255,255,220,1.0)');
diskGrad.addColorStop(0.25, 'rgba(255,200,120,1.0)');
diskGrad.addColorStop(0.55, 'rgba(255,140,70,0.8)');
diskGrad.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = diskGrad;
skyCtx.beginPath(); skyCtx.ellipse(bh.x,bh.y,bh.r*3,bh.r*1,0,0,Math.PI*2); skyCtx.fill();
skyCtx.fillStyle = '#000000';
skyCtx.beginPath(); skyCtx.arc(bh.x,bh.y,bh.r,0,Math.PI*2); skyCtx.fill();

// Spiral galaxy smudge
const galCanvas = {x:100, y:100, r:10};
for(let i=0;i<3;i++){
const outerR = Math.max(1, galCanvas.r*2-i*30);
const ellipseW = Math.max(1, galCanvas.r-i*20);
const ellipseH = Math.max(1, galCanvas.r*0.375-i*8);
const g2 = skyCtx.createRadialGradient(galCanvas.x,galCanvas.y,0,galCanvas.x,galCanvas.y,outerR);
g2.addColorStop(0, `rgba(230,220,255,${Math.max(0,0.7-i*0.15)})`);
g2.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = g2;
skyCtx.beginPath(); skyCtx.ellipse(galCanvas.x,galCanvas.y,ellipseW,ellipseH,0.6,0,Math.PI*2); skyCtx.fill();
}
for(let arm=0; arm<2; arm++){
for(let j=0; j<14; j++){
const ang = (j/14)*Math.PI*2.2 + arm*Math.PI + 0.6;
const dist = (j/14)*galCanvas.r*1.8;
const ax = galCanvas.x + Math.cos(ang)*dist;
const ay = galCanvas.y + Math.sin(ang)*dist*0.4;
const sizeBlob = Math.max(1, galCanvas.r*0.25*(1-j/16));
const armGrad = skyCtx.createRadialGradient(ax,ay,0,ax,ay,sizeBlob);
armGrad.addColorStop(0, `rgba(210,200,255,${Math.max(0,0.35*(1-j/14))})`);
armGrad.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = armGrad;
skyCtx.beginPath(); skyCtx.arc(ax,ay,sizeBlob,0,Math.PI*2); skyCtx.fill();
}
}


const skyTex = new THREE.CanvasTexture(skyCanvas);
skyTex.needsUpdate = true;

skyTex.mapping = THREE.EquirectangularReflectionMapping;



// SCENE
const scene = new THREE.Scene();
scene.background = skyTex;

// CAMERA + PIVOT
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
// ── ROTATE-TO-LANDSCAPE PROMPT (mobile only) ──
if(isMobile){
const rotateOverlay = document.createElement('div');
rotateOverlay.id = 'rotate-overlay';
rotateOverlay.innerHTML = 'Please rotate your device to landscape for the best experience';
rotateOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000000;color:#00ccff;font-size:20px;font-family:sans-serif;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;padding:20px;box-sizing:border-box;';
document.body.appendChild(rotateOverlay);

const checkOrientation = () => {
if(window.innerHeight > window.innerWidth){
rotateOverlay.style.display = 'flex';
} else {
rotateOverlay.style.display = 'none';
}
};
checkOrientation();
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
}
const fov = W / H < 1 ? 60 : 35;
const camera = new THREE.PerspectiveCamera(fov, W/H, 0.1, 3000)
const camDist = isMobile ? 780 : 580;
const camY = isMobile ? -25 : -10;
const pivot = new THREE.Object3D();
pivot.position.set(0, camY - 17, camDist);
scene.add(pivot);
pivot.add(camera);
camera.position.set(0, 0, 0);
camera.lookAt(0, -55, 0);


// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H);
renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.xr.enabled = true;
mount.appendChild(renderer.domElement);
try {
mount.appendChild(VRButton.createButton(renderer));
} catch (e) {
console.log('VR not supported on this device');
}

// BLOOM
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(isMobile ? W/3 : W/1.5, isMobile ? H/3 : H/1.5), 0.6, 0.4, 0.3));


// LIGHTS
function pl(c:number,i:number,d:number,x:number,y:number,z:number){
const l=new THREE.PointLight(c,i,d);
l.position.set(x,y,z);
l.visible = true;
scene.add(l); return l;
}

// AMBIENT
scene.add(new THREE.AmbientLight(0xffffff, 0.1));

// DIRECTIONAL — sun-like light
const dirLight = new THREE.DirectionalLight(0xfff4e6, 0.3);
dirLight.position.set(10, 15, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// CEILING CENTER POINT LIGHT
pl(0xffffff, 8, 300, 0, 8, 0);

// FOUR CORNER LIGHTS


// LED STRIP LIGHTS around ceiling perimeter


// Neon accent lights (kept from before)
const cyanTop = pl(0x0099ff, 4, 300, 0, HH-1, -50);
const purpleBot = pl(0x8800cc, 4, 300, 0, -HH+1, -50);
const mainPl = pl(0x3300aa, 6, 500, 0, 0, -50);
const leftPl = pl(0x0044ff, 5, 400, -HW-60, 0, -50);
const rightPl = pl(0x6600aa, 5, 400, HW+60, 0, -50);

// Portal lights
const bpL1 = new THREE.RectAreaLight(0xff00ff, 2, 30, 20);
bpL1.position.set(-55, -1, -HD+5);
bpL1.lookAt(-55, -1, 0);
// scene.add(bpL1); // disabled — was causing floor light bleed near figure
const bpL2 = new THREE.RectAreaLight(0x00ccff, 2, 30, 20);
bpL2.position.set(0, -6, -HD+5);
bpL2.lookAt(0, -6, 0);
// scene.add(bpL2); // disabled — was causing floor light bleed near figure
const bpL3 = new THREE.RectAreaLight(0xff00ff, 2, 30, 20);
bpL3.position.set(55, -1, -HD+5);
bpL3.lookAt(55, -1, 0);
// scene.add(bpL3); // disabled — was causing floor light bleed near figure



pl(0x4466aa, 4, 300, 0, HH, -HD-5);
pl(0x4466aa, 10, 600, -HW-80, 0, -HD/2);
pl(0x4466aa, 10, 600, HW+80, 0, -HD/2);
pl(0xaaccff, 15, 400, 0, 0, 50);
pl(0x8899cc, 20, 1200, 0, camY, camDist);
// ── PROCEDURAL ENVIRONMENT MAP for glass reflections ──
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();


const starEnvMap = pmremGenerator.fromEquirectangular(skyTex).texture;
// Don't set scene.environment globally — apply only to glass
pmremGenerator.dispose();


// ── FLOOR TEXTURE — Blue Epoxy ──
const floorCanvas = document.createElement('canvas');
floorCanvas.width = 512; floorCanvas.height = 512;
const fc = floorCanvas.getContext('2d')!;
fc.fillStyle = '#1a3a6a'; fc.fillRect(0,0,512,512);
const fg1 = fc.createLinearGradient(0,0,512,512);
fg1.addColorStop(0, 'rgba(0,80,200,0.8)');
fg1.addColorStop(0.3, 'rgba(0,120,255,0.6)');
fg1.addColorStop(0.5, 'rgba(180,100,40,0.5)');
fg1.addColorStop(0.7, 'rgba(0,100,220,0.7)');
fg1.addColorStop(1, 'rgba(0,60,180,0.9)');
fc.fillStyle=fg1; fc.fillRect(0,0,512,512);
const swirls:[number,number,number,number,number,number,number][]=[
[50,100,480,400,100,280,0.3],
[200,50,300,480,30,220,0.5],
[400,200,100,350,25,180,0.4],
[150,300,380,200,40,250,0.6],
[300,400,200,100,35,200,0.3],
[450,150,60,430,20,160,0.4],
[80,450,420,80,45,230,0.5],
[350,250,150,300,30,190,0.35],
];
swirls.forEach(([x1,y1,,, rx,ry,op])=>{
const fg2=fc.createLinearGradient(x1,0,x1+100,512);
fg2.addColorStop(0,'rgba(255,255,255,0)');
fg2.addColorStop(0.5,`rgba(255,255,255,${op})`);
fg2.addColorStop(1,'rgba(255,255,255,0)');
fc.fillStyle=fg2;
fc.beginPath();
fc.ellipse(x1,y1,rx,ry,Math.PI*0.3,0,Math.PI*2);
fc.fill();
});
const floorTex = new THREE.CanvasTexture(floorCanvas);
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;
floorTex.repeat.set(1,1);

const roughCanvas = document.createElement('canvas');
roughCanvas.width = 128; roughCanvas.height = 128;
const rc2 = roughCanvas.getContext('2d')!;
const roughImg = rc2.createImageData(128,128);
for(let i=0;i<roughImg.data.length;i+=4){
const v = 200 + Math.random()*55;
roughImg.data[i]=v; roughImg.data[i+1]=v; roughImg.data[i+2]=v; roughImg.data[i+3]=255;
}
rc2.putImageData(roughImg,0,0);
const roughTex = new THREE.CanvasTexture(roughCanvas);
roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
roughTex.repeat.set(8,8);

const floorMat = new THREE.MeshStandardMaterial({
map: floorTex,
roughnessMap: roughTex,
roughness: 0.15,
metalness: 0.0,
});

// ── CEILING TEXTURE — Wood Panels ──
const ceilCanvas = document.createElement('canvas');
ceilCanvas.width = 512; ceilCanvas.height = 512;
const cc = ceilCanvas.getContext('2d')!;
const planks = [
'#2a2a35','#222230','#2d2d3a','#1e1e28',
'#252532','#1a1a25','#28283a','#202030',
];
const plankH = 512/8;
planks.forEach((color,i)=>{
cc.fillStyle=color;
cc.fillRect(0,i*plankH,512,plankH-2);
cc.strokeStyle='rgba(0,0,0,0.15)';
cc.lineWidth=1;
for(let g=0;g<6;g++){
const gx1=g*90, gx2=gx1+80;
cc.beginPath();
cc.moveTo(gx1, i*plankH);
cc.bezierCurveTo(gx1+20,i*plankH+plankH*0.3,gx2-20,i*plankH+plankH*0.6,gx2,i*plankH+plankH);
cc.stroke();
}
});
const ceilTex = new THREE.CanvasTexture(ceilCanvas);
ceilTex.wrapS=ceilTex.wrapT=THREE.RepeatWrapping;
ceilTex.repeat.set(3,3);
const ceilMat = new THREE.MeshPhysicalMaterial({
color: new THREE.Color(0x4a7db0),
transparent: true,
opacity: 0.45,
roughness: 0.18,
metalness: 0.0,
transmission: 0.4,
thickness: 1.2,
ior: 1.6,
reflectivity: 0.45,
specularIntensity: 0.5,
specularColor: new THREE.Color(0xaaddff),
clearcoat: 0.4,
clearcoatRoughness: 0.15,
envMap: starEnvMap,
envMapIntensity: 0.7,
side: THREE.DoubleSide,
depthWrite: true,
});

// ── GLASS MATERIAL ──
const glassMat = new THREE.MeshPhysicalMaterial({
color: new THREE.Color(0x4a7db0),
transparent: true,
opacity: 0.45,
roughness: 0.18,
metalness: 0.0,
transmission: 0.4,
thickness: 1.2,
ior: 1.6,
reflectivity: 0.45,
specularIntensity: 0.5,
specularColor: new THREE.Color(0xaaddff),
clearcoat: 0.4,
clearcoatRoughness: 0.15,
envMap: starEnvMap,
envMapIntensity: 0.7,
side: THREE.DoubleSide,
depthWrite: true,
});

const fresnelGlowMat = new THREE.ShaderMaterial({
uniforms: {
glowColor: { value: new THREE.Color(0x66ccff) },
},
vertexShader: `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
vNormal = normalize(normalMatrix * normal);
vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
vViewDir = normalize(-mvPosition.xyz);
gl_Position = projectionMatrix * mvPosition;
}
`,
fragmentShader: `
uniform vec3 glowColor;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
loat fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 4.0);
float glow = max(fresnel * 0.25, 0.05);
gl_FragColor = vec4(glowColor, glow);
}
`,
transparent: true,
side: THREE.DoubleSide,
blending: THREE.AdditiveBlending,
depthWrite: false,
});


// ── NEON TRIM MATERIALS ──
const cyanMat = new THREE.MeshStandardMaterial({color:0x00ccff, emissive:0x00aaff, emissiveIntensity:2});
const purpleMat = new THREE.MeshStandardMaterial({color:0xffaa88, emissive:0xff8844, emissiveIntensity:0.5});
const truePurpleMat = new THREE.MeshStandardMaterial({color:0x9988bb, emissive:0x7766aa, emissiveIntensity:1}); 
const dimMat = new THREE.MeshStandardMaterial({color:0x9988bb, emissive:0x7766aa, emissiveIntensity:1});

// ── HELPERS ──
function addFresnelGlow(w:number,h:number,x:number,y:number,z:number,ry:number,offsetX:number=0,offsetZ:number=0){
const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fresnelGlowMat);
m.position.set(x+offsetX,y,z+offsetZ); m.rotation.y = ry;
m.frustumCulled = false;
scene.add(m);
return m;
}
function addHorizontalFresnelGlow(w:number,d:number,x:number,y:number,z:number,offsetY:number=0){
const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fresnelGlowMat);
m.position.set(x,y+offsetY,z); m.rotation.x = Math.PI/2;
m.frustumCulled = false;
scene.add(m);
return m;
}
function addPlane(w:number,h:number,x:number,y:number,z:number,ry:number,mat:THREE.Material){
const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
m.position.set(x,y,z); m.rotation.y=ry;
m.frustumCulled=false;
scene.add(m); return m;
}
function addHorizontalPlane(w:number,d:number,x:number,y:number,z:number,mat:THREE.Material){
const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);
m.position.set(x,y,z); m.rotation.x=Math.PI/2;
m.frustumCulled=false;
scene.add(m); return m;
}
function addBox(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material){
const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
m.position.set(x,y,z);
m.frustumCulled=false;
scene.add(m); return m;
}

// ── VIDEO SCREEN BEHIND BACK WALL ──
const video = document.createElement('video');
videoRef.current = video;
video.src = '/videos/background-flame.mp4';
video.muted = false;
video.loop = true;
video.muted = true;
video.playsInline = true;
video.autoplay = true;
video.preload = 'auto';
video.play().catch(()=>{});
const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
video.addEventListener('error', () => {
const err = video.error;
console.error('VIDEO ERROR - code:', err?.code, 'message:', err?.message, 'src:', video.currentSrc);
});
video.addEventListener('loadeddata', () => console.log('VIDEO LOADED OK'));
const videoMat = new THREE.MeshBasicMaterial({ map: videoTexture, color: new THREE.Color(0xaaaaaa) });
const videoW = 160;
const videoH = videoW * 9/16;
const videoScreen = new THREE.Mesh(new THREE.PlaneGeometry(videoW, videoH), videoMat);
videoScreen.position.set(0, 10, -HD - 5);
scene.add(videoScreen);


// ── GLASS WALLS — 2 layers ──
addPlane(BW, RH+50, 0, 25, -HD, 0, glassMat);
addFresnelGlow(BW, RH+50, 0, 25, -HD, 0, 0, 0.5);
const sideGlassMat = glassMat.clone();
const RD2 = 850; // extended depth so side walls reach the same front edge as the floor
addPlane(RD2, RH+50, -HW, 25, 75, Math.PI/2, sideGlassMat);
addFresnelGlow(RD2, RH+50, -HW, 25, 75, Math.PI/2, 0.5, 0);
addPlane(RD2, RH+50, HW, 25, 75, -Math.PI/2, sideGlassMat);
addFresnelGlow(RD2, RH+50, HW, 25, 75, -Math.PI/2, -0.5, 0);


// ── FLOOR ──
addBox(BW, 1, 700, 0, -HH-0.5, 75, floorMat);

// ── CEILING ──
addHorizontalPlane(BW, 700, 0, HH+50, 75, ceilMat);
addHorizontalFresnelGlow(BW, 700, 0, HH+50, 75, -0.5);



// ── CYAN CEILING NEON ──
addBox(BW, 4, 4, 0, HH+50, -HD, dimMat);
addBox(BW, 3, 3, 0, HH+50, 420, dimMat);
addBox( 3, 3, 700, -HW, HH+50, 75, dimMat);
addBox(3, 3, 700, HW, HH+50, 75, dimMat);



// ── PURPLE FLOOR NEON ──
const frontFloorMat = new THREE.MeshStandardMaterial({color:0xfff8f0, emissive:0xffeedd, emissiveIntensity:0.15});
addBox(BW, 4, 4, 0, -HH+2, -HD, purpleMat);
addBox(BW+8, 3, 3, 0, -HH+2.5, 426, frontFloorMat);
addBox(4, 4, 700, -HW,-HH+2, 75, purpleMat);
addBox(4, 4, 700, HW,-HH+2, 75, purpleMat);



// ── SECONDARY DIM BORDER ──
addBox(BW, .5, .5, 0, -HH-.3, -HD, dimMat);
addBox(BW+8, 7, 7, 0, -HH-2.5, 426, truePurpleMat);
addBox(.5, .5, RD, -HW,-HH-.3, 0, dimMat);
addBox(.5, .5, RD, HW,-HH-.3, 0, dimMat);



// ── VERTICAL CORNERS ──
addBox(1.5, RH+47, 1.5, -HW+2, 24, -HD+2, dimMat); // back-left
addBox(1.5, RH+47, .6, HW-2, 24, -HD+2, dimMat); // back-right
addBox(1.5, RH+47, 1.5, -HW+3, 24, 420, cyanMat); // front-left
addBox(1.5, RH+47, 1.5, HW-3, 24, 420, cyanMat); // front-right


// ── MEDITATION FIGURE — 3D CHARACTER (replaces old video hologram) ──
// The GLB was exported from Unreal -> Blender with two static poses baked in
// as animation clips: "ArmsRest" and "Namaste". Each clip's keyframe data is
// only reliable at its very first frame (later frames drift toward a shared
// rest pose for several bones), so instead of playing the clips over time we
// freeze each action at frame 0 and cross-blend the WEIGHT between the two
// frozen poses. This avoids any drift and gives a clean, controllable blend.

let figureMixer: THREE.AnimationMixer | null = null;
let armsRestAction: THREE.AnimationAction | null = null;
let namasteAction: THREE.AnimationAction | null = null;
let figureModel: THREE.Object3D | null = null;

// Position/scale: tuned to roughly match where the old video plane sat.
// The GLB itself already encodes real-world meter scale (a ~0.01 factor is
// baked into the root node from the Unreal cm->m conversion), but this room
// is built on a much larger arbitrary unit system (BW=550 etc.), so the
// character needs an additional multiplier to read at the right size next to
// the room geometry. Start here and adjust FIGURE_SCALE to taste.
const FIGURE_SCALE = 55;
const FIGURE_POSITION = new THREE.Vector3(0, -HH - 46, 108);

// Dedicated light so the figure actually shows facial/body shading instead
// of reading as a flat silhouette.
const figureLight = new THREE.PointLight(0xffffff, 320, 80);
figureLight.position.set(0, -HH + 30, 30);
scene.add(figureLight);


const gltfLoader = new GLTFLoader();
gltfLoader.load(
'/models/Character_export_v2.glb', // adjust path to wherever you host the GLB
(gltf) => {
figureModel = gltf.scene;
figureModel.scale.setScalar(FIGURE_SCALE);
figureModel.position.copy(FIGURE_POSITION);
figureModel.frustumCulled = false;
figureModel.visible = false; // hide until the correct pose is applied, avoids a T-pose flash

// Re-apply the cyan "hologram" look — the material didn't survive the
// Unreal -> FBX -> Blender -> glTF round trip (it came through as flat
// grey), so we override it here to match the original M_CyanFigure look.
const cyanFigureMat = new THREE.MeshStandardMaterial({
color: 0x22aacc,
emissive: 0x00ccee,
emissiveIntensity: 0.22,
roughness: 0.55,
metalness: 0.0,
transparent: true,
opacity: 0.95,
});

figureModel.traverse((child) => {
if ((child as THREE.Mesh).isMesh) {
(child as THREE.Mesh).material = cyanFigureMat;
(child as THREE.Mesh).frustumCulled = false;
}
});

figureModel.traverse((child) => {
if ((child as THREE.Mesh).isMesh) {
const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
mat.opacity = 0;
}
});
scene.add(figureModel);

const fadeStart = performance.now();
const fadeIn = (now: number) => {
const t = Math.min((now - fadeStart) / 600, 1);
figureModel?.traverse((child) => {
if ((child as THREE.Mesh).isMesh) {
((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.95 * t;
}
});
if (t < 1) requestAnimationFrame(fadeIn);
};
requestAnimationFrame(fadeIn);

figureMixer = new THREE.AnimationMixer(figureModel);

const armsRestClip = THREE.AnimationClip.findByName(gltf.animations, 'ArmsRest');
const namasteClip = THREE.AnimationClip.findByName(gltf.animations, 'Namaste');

armsRestAction = figureMixer.clipAction(armsRestClip!);
namasteAction = figureMixer.clipAction(namasteClip!);

[armsRestAction, namasteAction].forEach((action) => {
action.play();
action.paused = true; // freeze time — never advance past frame 0
action.time = 0; // sit exactly on the first (correct) keyframe
action.enabled = true;
});

// Start fully in the resting pose, Namaste weight at 0.
armsRestAction.weight = 1;
namasteAction.weight = 0;
figureMixer.update(0);
figureModel.visible = true; // reveal only now that the pose is correctly applied

// Cross-blend the WEIGHT (not clip time) from ArmsRest -> Namaste shortly
// after load, so it never drifts into the shared rest pose.
window.setTimeout(() => {
const durationMs = 1200;
const start = performance.now();
const step = (now: number) => {
const t = Math.min((now - start) / durationMs, 1);
if (armsRestAction && namasteAction) {
armsRestAction.weight = 1 - t;
namasteAction.weight = t;
figureMixer?.update(0); // re-evaluate pose at fixed time, new weights
}
if (t < 1) requestAnimationFrame(step);
};
requestAnimationFrame(step);
}, 1500);
},
undefined,
(error) => console.error('Error loading character GLB:', error)
);

// ── FIRE BOWL ──
const bowlGroup = new THREE.Group();
bowlGroup.position.set(0, -HH + 3, 210);
scene.add(bowlGroup);

// Bowl base
const bowlMat = new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.6, metalness: 0.3 });
const bowl = new THREE.Mesh(new THREE.CylinderGeometry(6, 4, 4, 24, 1, true), bowlMat);
bowl.position.y = 2;
bowlGroup.add(bowl);
const bowlBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 3, 16), bowlMat);
bowlBase.position.y = -1;
bowlGroup.add(bowlBase);

// Fire particles
const fireParticles: THREE.Sprite[] = [];
const fireCanvas = document.createElement('canvas');
fireCanvas.width = 64; fireCanvas.height = 64;
const fireCtx = fireCanvas.getContext('2d')!;
const fireGrad = fireCtx.createRadialGradient(32,32,0,32,32,32);
fireGrad.addColorStop(0, 'rgba(255,255,200,1)');
fireGrad.addColorStop(0.3, 'rgba(255,180,50,0.9)');
fireGrad.addColorStop(0.6, 'rgba(255,80,20,0.5)');
fireGrad.addColorStop(1, 'rgba(255,40,0,0)');
fireCtx.fillStyle = fireGrad;
fireCtx.fillRect(0,0,64,64);
const fireTex = new THREE.CanvasTexture(fireCanvas);

for(let i=0; i<18; i++){
const spr = new THREE.Sprite(new THREE.SpriteMaterial({
map: fireTex,
transparent: true,
opacity: 0.55,
blending: THREE.AdditiveBlending,
depthWrite: false, depthTest: false,
}));
const s = 3.5 + Math.random()*1.5;
spr.scale.set(s, s*1.6, 1);
const spawnRadius = 1.8; // tighter cluster so flames overlap into one mass
const angle = (i / 18) * Math.PI*2 + Math.random()*0.4;
const dist = Math.random()*spawnRadius;
spr.position.set(Math.cos(angle)*dist, 2.5 + Math.random()*1, Math.sin(angle)*dist);
spr.userData.baseY = spr.position.y;
spr.userData.speed = 1.0 + Math.random()*0.15; // less speed variance = more unified motion
spr.userData.phase = (i / 18) * Math.PI*2; // evenly distributed, not fully random
spr.userData.baseX = spr.position.x;
spr.userData.baseZ = spr.position.z;
spr.userData.riseOffset = (i / 18) * 3; // staggered but structured rise timing
bowlGroup.add(spr);
fireParticles.push(spr);
}


const fireLight = new THREE.PointLight(0xff6622, 15, 60);
fireLight.position.set(0, 4, 0);
bowlGroup.add(fireLight);

// ── FLOOR TEXT: "FLAME OF C" (fire-gradient style) ──
const floorTextCanvas = document.createElement('canvas');
floorTextCanvas.width = 1024; floorTextCanvas.height = 256;
const ftCtx = floorTextCanvas.getContext('2d')!;
ftCtx.clearRect(0,0,1024,256);
ftCtx.textAlign = 'center';
ftCtx.textBaseline = 'middle';

const floorFireGrad = ftCtx.createLinearGradient(0, 40, 0, 220);
floorFireGrad.addColorStop(0, '#886644');
floorFireGrad.addColorStop(0.5, '#775522');
floorFireGrad.addColorStop(0.55, '#993311');
floorFireGrad.addColorStop(0.75, '#991100');
floorFireGrad.addColorStop(1, '#880000');
ftCtx.shadowColor = '#ff6600';
ftCtx.shadowBlur = 12;
ftCtx.fillStyle = floorFireGrad;
ftCtx.font = 'bold 70px Georgia';
ftCtx.fillText('FLAME', 280, 140);
ftCtx.fillText('OF', 540, 140);

ftCtx.shadowBlur = 18;
ftCtx.font = 'bold 130px Georgia';
ftCtx.fillText('C', 720, 140);

// Outline pass for extra definition against the fire glow
ftCtx.shadowBlur = 0;
ftCtx.strokeStyle = 'rgba(120,20,0,0.6)';
ftCtx.lineWidth = 2;
ftCtx.font = 'bold 70px Georgia';
const strokeOffsetFLAME = -6; // negative = move left, positive = move right
const strokeOffsetOF = 8; // negative = move left, positive = move right
ftCtx.strokeText('FLAME', 280 + strokeOffsetFLAME, 140);
ftCtx.strokeText('OF', 540 + strokeOffsetOF, 140);
ftCtx.font = 'bold 130px Georgia';
ftCtx.strokeText('C', 720, 140);

const floorTextTex = new THREE.CanvasTexture(floorTextCanvas);
const floorTextMesh = new THREE.Mesh(
new THREE.PlaneGeometry(450, 100),
new THREE.MeshBasicMaterial({ map: floorTextTex, transparent: true, depthWrite: false, depthTest: false })
);
floorTextMesh.rotation.x = -Math.PI/2;
floorTextMesh.position.set(20, -HH-50, 160);
floorTextMesh.renderOrder = 10;
floorTextMesh.frustumCulled = false;
scene.add(floorTextMesh);


// ── DIGITAL CLOCK — WIDE HORIZONTAL ──
const clockCanvas = document.createElement('canvas');
clockCanvas.width = 750; clockCanvas.height = 200;
const clockCtx = clockCanvas.getContext('2d')!;
const clockTex = new THREE.CanvasTexture(clockCanvas);

const worldCities = [
{ city:'LONDON', offset:0 },
{ city:'PARIS', offset:1 },
{ city:'BERLIN', offset:1 },
{ city:'ROME', offset:1 },
{ city:'MOSCOW', offset:3 },
{ city:'ABU DHABI', offset:4 },
{ city:'NEW DELHI', offset:5.5},
{ city:'BEIJING', offset:8 },
{ city:'TOKYO', offset:9 },
{ city:'CANBERRA', offset:11 },
{ city:'WASHINGTON', offset:-5 },
{ city:'BRASÍLIA', offset:-3 },
{ city:'LONDON', offset:0 },
{ city:'PARIS', offset:1 },
{ city:'BERLIN', offset:1 },
];

let scrollX = 0;

const roundRect2 = (ctx:CanvasRenderingContext2D, x:number, y:number, w:number, h:number, r:number) => {
ctx.beginPath();
ctx.moveTo(x+r, y);
ctx.lineTo(x+w-r, y);
ctx.quadraticCurveTo(x+w, y, x+w, y+r);
ctx.lineTo(x+w, y+h-r);
ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
ctx.lineTo(x+r, y+h);
ctx.quadraticCurveTo(x, y+h, x, y+h-r);
ctx.lineTo(x, y+r);
ctx.quadraticCurveTo(x, y, x+r, y);
ctx.closePath();
};

// Ticker canvas — declared before updateClock so it's in scope
const tickerCanvas = document.createElement('canvas');
tickerCanvas.width = 750; tickerCanvas.height = 60;
const tickerCtx = tickerCanvas.getContext('2d')!;
const tickerTex = new THREE.CanvasTexture(tickerCanvas);

const updateClock = () => {
const now = new Date();
const h = String(now.getHours()).padStart(2,'0');
const m = String(now.getMinutes()).padStart(2,'0');
const s = String(now.getSeconds()).padStart(2,'0');
const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const day = days[now.getDay()];
const date = String(now.getDate()).padStart(2,'0');
const month = months[now.getMonth()];
const year = now.getFullYear();

// Background
clockCtx.clearRect(0,0,750,180);
clockCtx.fillStyle = 'rgba(5,8,18,0.95)';
roundRect2(clockCtx, 0, 0, 750, 180, 20);
clockCtx.fill();

// Cyan border
clockCtx.strokeStyle = 'rgba(0,180,255,0.5)';
clockCtx.lineWidth = 2;
roundRect2(clockCtx, 1, 1, 748, 178, 19);
clockCtx.stroke();

// Divider lines
clockCtx.strokeStyle = 'rgba(0,180,255,0.2)';
clockCtx.lineWidth = 1;
clockCtx.beginPath(); clockCtx.moveTo(160,10); clockCtx.lineTo(160,150); clockCtx.stroke();
clockCtx.beginPath(); clockCtx.moveTo(620,10); clockCtx.lineTo(620,150); clockCtx.stroke();
clockCtx.beginPath(); clockCtx.moveTo(820,10); clockCtx.lineTo(820,150); clockCtx.stroke();
clockCtx.beginPath(); clockCtx.moveTo(980,10); clockCtx.lineTo(980,150); clockCtx.stroke();

// Week days vertical
days.forEach((d,i) => {
clockCtx.font = 'bold 22px monospace';
clockCtx.textAlign = 'left';
clockCtx.fillStyle = d === day ? '#ffaa00' : 'rgba(255,255,255,0.3)';
clockCtx.fillText(d, 130, 26 + i*24);
});
clockCtx.font = 'bold 13px monospace';
clockCtx.fillStyle = 'rgba(255,255,255,0.5)';
clockCtx.fillText(now.getHours() >= 12 ? 'PM' : 'AM', 100, 35);

// ── MAIN TIME (center) ──
clockCtx.font = 'bold 80px monospace';
clockCtx.fillStyle = 'rgba(255,255,255,0.7)';
clockCtx.textAlign = 'center';
clockCtx.fillText(`${h}:${m}`, 390, 120);

// Seconds
clockCtx.font = 'bold 24px monospace';
clockCtx.fillStyle = 'rgba(0,200,255,0.9)';
clockCtx.textAlign = 'left';
clockCtx.fillText(`${s}s`, 540, 40);
clockCtx.font = 'bold 13px monospace';
clockCtx.fillStyle = 'rgba(0,200,255,0.6)';
clockCtx.fillText('SEC', 540, 58);


// ── DATE (now LEFT side) ──
clockCtx.font = 'bold 42px monospace';
clockCtx.fillStyle = '#ffaa00';
clockCtx.textAlign = 'center';
clockCtx.fillText(`${date}`, 60, 70);
clockCtx.font = 'bold 30px monospace';
clockCtx.fillStyle = 'rgba(255,170,0,0.85)';
clockCtx.fillText(month, 60, 105);
clockCtx.font = 'bold 22px monospace';
clockCtx.fillStyle = 'rgba(255,170,0,0.6)';
clockCtx.fillText(String(year), 60, 135);

// Temperature — now RIGHT side
clockCtx.font = 'bold 38px monospace';
clockCtx.fillStyle = '#44ffcc';
clockCtx.textAlign = 'center';
clockCtx.fillText('23°C', 720, 80);
clockCtx.font = 'bold 13px monospace';
clockCtx.fillStyle = 'rgba(68,255,204,0.7)';
clockCtx.fillText('TEMP', 720, 105);

// ── WORLD TIMES — separate ticker canvas ──
tickerCtx.clearRect(0, 0, 750, 60);
tickerCtx.fillStyle = 'rgba(5,8,20,0.9)';
tickerCtx.fillRect(0, 0, 750, 60);
tickerCtx.strokeStyle = 'rgba(0,180,255,0.4)';
tickerCtx.lineWidth = 1;
tickerCtx.strokeRect(1, 1, 748, 58);

const itemW = 320;
const totalW = worldCities.length * itemW;
scrollX -= 4;
if(scrollX <= -totalW) scrollX += totalW;

for(let rep=0; rep<3; rep++){
worldCities.forEach((c,i) => {
const cx = scrollX + (i + rep*worldCities.length) * itemW;
const cityTime = new Date(now.getTime() + c.offset * 3600000);
const ch2 = String(cityTime.getUTCHours()).padStart(2,'0');
const cm2 = String(cityTime.getUTCMinutes()).padStart(2,'0');

tickerCtx.font = 'bold 20px monospace';
tickerCtx.fillStyle = 'rgba(0,220,255,0.5)';
tickerCtx.textAlign = 'left';
tickerCtx.fillText(`${c.city}`, cx + 10, 28);
tickerCtx.font = 'bold 30px monospace';
tickerCtx.fillStyle = 'rgba(255,255,255,0.45)';
tickerCtx.fillText(`${ch2}:${cm2}`, cx + 10, 52);

// Separator
tickerCtx.fillStyle = 'rgba(0,180,255,0.3)';
tickerCtx.fillRect(cx + itemW - 5, 5, 1, 50);
});
}

tickerTex.needsUpdate = true;
clockTex.needsUpdate = true;
};

updateClock();
updateClock();
const clockInterval = setInterval(updateClock, 200);

// Main clock (top section - time, date, temp, days)
const clockMesh = new THREE.Mesh(
new THREE.PlaneGeometry(295, 30),
new THREE.MeshBasicMaterial({ map: clockTex, transparent: true, depthWrite: false, depthTest: false })
);
clockMesh.position.set(-HW+0, 112, -HD+150);
clockMesh.rotation.y = Math.PI/2;
scene.add(clockMesh);

// World time ticker (separate mesh)
const tickerMesh = new THREE.Mesh(
new THREE.PlaneGeometry(295, 30),
new THREE.MeshBasicMaterial({ map: tickerTex, transparent: true, depthWrite: false, depthTest: false })
);
tickerMesh.position.set(HW-0, 112, -HD+150);
tickerMesh.rotation.y = -Math.PI/2;
scene.add(tickerMesh);

// ── FLAME OF... LOGO TICKER (top of back wall) ──
const logoWords = ['CONSCIOUSNESS','CONCENTRATION','COMPASSION','CONFIDENCE','CENTERING','CALMNESS','CLARITY','COURAGE','CREATIVITY','COSMIC','CARE'];
const logoCanvas = document.createElement('canvas');
logoCanvas.width = 2048; logoCanvas.height = 150;
const logoCtx = logoCanvas.getContext('2d')!;
const logoTex = new THREE.CanvasTexture(logoCanvas);
let logoScrollX = 0;
const logoItemW = 340;

const updateLogoTicker = () => {
logoCtx.clearRect(0,0,2048,150);
const totalLogoW = logoWords.length * logoItemW;
logoScrollX -= 1;
if(logoScrollX <= -totalLogoW) logoScrollX += totalLogoW;

for(let rep=0; rep<3; rep++){
logoWords.forEach((word,i) => {
const cx = logoScrollX + (i + rep*logoWords.length) * logoItemW;
logoCtx.font = 'italic bold 30px Arial';
logoCtx.textAlign = 'left';
logoCtx.fillStyle = '#8844aa';
logoCtx.shadowColor = '#663388';
logoCtx.shadowBlur = 8;
logoCtx.fillText('FLAME OF', cx, 50);
logoCtx.font = 'bold 44px Georgia';
logoCtx.fillStyle = '#ffffff';
logoCtx.shadowColor = '#ffffff';
logoCtx.shadowBlur = 8;
logoCtx.fillText('C', cx + 172, 50);
logoCtx.font = 'bold 34px Arial';
logoCtx.fillStyle = '#88aacc';
logoCtx.shadowColor = '#4488ff';
logoCtx.shadowBlur = 3;
logoCtx.fillText(word, cx, 95);
});
}
logoCtx.shadowBlur = 0;
logoTex.needsUpdate = true;
};
updateLogoTicker();
const logoInterval = setInterval(updateLogoTicker, 60);

const logoMesh = new THREE.Mesh(
new THREE.PlaneGeometry(BW, 15),
new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, depthWrite: false, depthTest: false })
);
logoMesh.position.set(0, 115, -HD+0);
logoMesh.frustumCulled = false;
scene.add(logoMesh);


// ── PORTALS ──
const portalData = [
// Back wall portals — z = -HD+2
{ label:'PODCAST', x:-200, y:-10, z:-HD+2, ry:0, color:0x00ccff, eColor:0x0099cc, icon:'🎙️' },
{ label:'GALLERY', x:-120, y:40, z:-HD+2, ry:0, color:0xff44aa, eColor:0xcc2288, icon:'🖼️' },
{ label:'JOURNEY MAP', x:0, y:80, z:-HD+1, ry:0, color:0xffaa00, eColor:0xcc8800, icon:'👁️' },
{ label:'TEACHERS TRAINING', x:120, y:40, z:-HD+2, ry:0, color:0x44ff88, eColor:0x22cc66, icon:'🧘' },
{ label:'COMMUNITY', x:200, y:-10, z:-HD+2, ry:0, color:0xaa44ff, eColor:0x8822cc, icon:'👥' },
// Left wall portals — x = -HW+2
{ label:'PERSONAL CLASS', x:-HW+2, y:50, z:-180, ry:Math.PI/2, color:0xff6644, eColor:0xcc4422, icon:'🎓' },
{ label:'VIDEO', x:-HW+2, y:10, z:-70, ry:Math.PI/2, color:0x44aaff, eColor:0x2288cc, icon:'▶️' },
// Right wall portals — x = HW-2
{ label:'LATEST NEWS', x:HW-2, y:50, z:-180, ry:-Math.PI/2, color:0xffee44, eColor:0xccbb22, icon:'📰' },
{ label:'MINDFUL SHOP', x:HW-2, y:10, z:-70, ry:-Math.PI/2, color:0xff44cc, eColor:0xcc22aa, icon:'🛍️' },
];

const portalGroups: THREE.Group[] = [];
portalData.forEach(p => {
const group = new THREE.Group();
group.position.set(p.x, p.y, p.z);
group.rotation.y = p.ry;



/// Outer ring — rainbow gradient
const ringCanvas = document.createElement('canvas');
ringCanvas.width = 512; ringCanvas.height = 64;
const ringCtx = ringCanvas.getContext('2d')!;
const ringGrad = ringCtx.createLinearGradient(0,0,512,0);
ringGrad.addColorStop(0, '#ff3366');
ringGrad.addColorStop(0.2, '#ff9933');
ringGrad.addColorStop(0.4, '#ffee33');
ringGrad.addColorStop(0.6, '#33ff88');
ringGrad.addColorStop(0.8, '#33aaff');
ringGrad.addColorStop(1, '#cc33ff');
ringCtx.fillStyle = ringGrad;
ringCtx.fillRect(0,0,512,64);
const ringTex = new THREE.CanvasTexture(ringCanvas);
ringTex.wrapS = THREE.RepeatWrapping;

const outerRing = new THREE.Mesh(
new THREE.TorusGeometry(18, 1.2, 16, 60),
new THREE.MeshStandardMaterial({
map: ringTex,
emissiveMap: ringTex,
emissive: 0xffffff,
emissiveIntensity: 0.5,
})
);
group.add(outerRing);




// Inner ring
const innerRing = new THREE.Mesh(
new THREE.TorusGeometry(15, 0.6, 16, 60),
new THREE.MeshStandardMaterial({
color: p.color,
emissive: p.eColor,
emissiveIntensity: 1.5,
transparent: true,
opacity: 0.7,
})
);
group.add(innerRing);

// Portal fill (glowing circle inside)
const fill = new THREE.Mesh(
new THREE.CircleGeometry(14.5, 60),
new THREE.MeshBasicMaterial({
color: p.color,
transparent: true,
opacity: 0.05,
side: THREE.DoubleSide,
})
);
group.add(fill);

// Icon inside portal
const iconCanvas = document.createElement('canvas');
iconCanvas.width = 256; iconCanvas.height = 256;
const iconCtx = iconCanvas.getContext('2d')!;
iconCtx.clearRect(0,0,256,256);
iconCtx.font = '180px serif';
iconCtx.textAlign = 'center';
iconCtx.textBaseline = 'middle';
iconCtx.fillText(p.icon, 128, 138);
const iconTex = new THREE.CanvasTexture(iconCanvas);
const iconMesh = new THREE.Mesh(
new THREE.PlaneGeometry(21, 21),
new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, depthWrite: false, depthTest: false })
);
iconMesh.position.z = 0.5;
group.add(iconMesh);

// Label
const canvas = document.createElement('canvas');
canvas.width = 1024; canvas.height = 256;
const ctx = canvas.getContext('2d')!;
ctx.clearRect(0,0,1024,256);
ctx.fillStyle = '#'+p.color.toString(16).padStart(6,'0');
ctx.font = 'bold 128px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.strokeStyle = 'rgba(0,0,0,0.8)';
ctx.lineWidth = 6;
const textWidth = ctx.measureText(p.label).width;
const maxWidthActual = 960;
if(textWidth > maxWidthActual){
const scaleFactor = maxWidthActual / textWidth;
ctx.save();
ctx.translate(512, 128);
ctx.scale(scaleFactor, 1);
ctx.translate(-512, -128);
ctx.strokeText(p.label, 512, 128);
ctx.fillText(p.label, 512, 128);
ctx.restore();
} else {
ctx.strokeText(p.label, 512, 128);
ctx.fillText(p.label, 512, 128);
}
const labelTex = new THREE.CanvasTexture(canvas);
const labelMesh = new THREE.Mesh(
new THREE.PlaneGeometry(68, 17),
new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false, depthTest: false })
);



labelMesh.position.y = -22;
group.add(labelMesh);

// Point light for glow
const light = new THREE.PointLight(p.color, 8, 80);
light.position.set(0, 0, 2);
group.add(light);

const hitZone = new THREE.Mesh(
new THREE.CircleGeometry(20, 32),
new THREE.MeshBasicMaterial({ visible: false })
);
hitZone.position.z = 1;
group.add(hitZone);

group.userData.outerRing = outerRing;
group.userData.hitZone = hitZone;
group.userData.spinning = false;
group.userData.spinT = 0;

scene.add(group);
portalGroups.push(group);
});


// ── PORTAL CLICK ──
const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();
const onPortalClick = (clientX:number, clientY:number) => {
mouseVec.x = (clientX / window.innerWidth) * 2 - 1;
mouseVec.y = -(clientY / window.innerHeight) * 2 + 1;
raycaster.setFromCamera(mouseVec, camera);
for(const g of portalGroups){
const hits = raycaster.intersectObject(g.userData.hitZone);
if(hits.length > 0){
g.userData.spinning = true;
g.userData.spinT = 0;
break;
}
}
};
window.addEventListener("click", (e)=>onPortalClick(e.clientX, e.clientY));

const onPortalHover = (clientX:number, clientY:number) => {
mouseVec.x = (clientX / window.innerWidth) * 2 - 1;
mouseVec.y = -(clientY / window.innerHeight) * 2 + 1;
raycaster.setFromCamera(mouseVec, camera);
let hovering = false;
portalGroups.forEach(g => g.userData.spinning = false);
for(const g of portalGroups){
const hits = raycaster.intersectObject(g.userData.hitZone);
if(hits.length > 0){
hovering = true;
g.userData.spinning = true;
}
}
document.body.style.cursor = hovering ? "pointer" : "grab";
};
window.addEventListener("mousemove", (e)=>onPortalHover(e.clientX, e.clientY));

// ── DRAG ──
const onResize = () => {
const newW = window.innerWidth;
const newH = window.innerHeight;
camera.aspect = newW / newH;
camera.updateProjectionMatrix();
renderer.setSize(newW, newH);
composer.setSize(newW, newH);
};
window.addEventListener("resize", onResize);

// ── FRESH DRAG-TO-LOOK (full 360°, camera rotates in place) ──
let isDragging = false;
let lastPointerX = 0;
let yaw = 0; // left/right look
const YAW_LIMIT = 0.1; // radians, ~34 degrees total range
function startDrag(x:number){
isDragging = true;
lastPointerX = x;
}
function updateDrag(x:number){
if(!isDragging) return;
const deltaX = x - lastPointerX;
yaw = Math.max(-YAW_LIMIT, Math.min(YAW_LIMIT, yaw - deltaX * 0.0015));
lastPointerX = x;
}
function endDrag(){
isDragging = false;
}

const onDown=(e:MouseEvent)=>startDrag(e.clientX);
const onMove=(e:MouseEvent)=>updateDrag(e.clientX);
const onUp=()=>endDrag();
const onTouchStart=(e:TouchEvent)=>startDrag(e.touches[0].clientX);
const onTouchMove=(e:TouchEvent)=>updateDrag(e.touches[0].clientX);
const onTouchEnd=()=>endDrag();


window.addEventListener("mousedown",onDown);
window.addEventListener("mousemove",onMove);
window.addEventListener("mouseup",onUp);
window.addEventListener("touchstart",onTouchStart,{passive:true});
window.addEventListener("touchmove",onTouchMove,{passive:true});
window.addEventListener("touchend",onTouchEnd);




// ── ANIMATE ──
let t=0;
const loop=()=>{
t+=.012;
scene.backgroundRotation.y += 0.0002;



if (Math.floor(t*60) % 3 === 0) { // update twinkle every few frames for performance
scene.backgroundRotation.x = 1.6 + Math.PI; // adjusted to center the pole on the back wall
skyCtx.fillStyle = '#000008';
skyCtx.fillRect(0,0,2048,1024);
nebulae.forEach(n => {
const g = skyCtx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
g.addColorStop(0, n.c);
g.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = g;
skyCtx.fillRect(n.x-n.r, n.y-n.r, n.r*2, n.r*2);
});
planets.forEach(p => {
const g = skyCtx.createRadialGradient(p.x-p.r*0.4,p.y-p.r*0.4,p.r*0.1,p.x,p.y,p.r*1.1);
g.addColorStop(0, p.c1);
g.addColorStop(0.6, p.c2);
g.addColorStop(1, '#000000');
skyCtx.fillStyle = g;
skyCtx.beginPath(); skyCtx.arc(p.x,p.y,p.r,0,Math.PI*2); skyCtx.fill();
skyCtx.save();
skyCtx.beginPath(); skyCtx.arc(p.x,p.y,p.r,0,Math.PI*2); skyCtx.clip();
const shadow = skyCtx.createRadialGradient(p.x+p.r*0.5,p.y+p.r*0.5,0,p.x+p.r*0.3,p.y+p.r*0.3,p.r*1.2);
shadow.addColorStop(0, 'rgba(0,0,0,0.55)');
shadow.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = shadow;
skyCtx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);
skyCtx.restore();
});const diskGrad = skyCtx.createRadialGradient(bh.x,bh.y,bh.r*0.5,bh.x,bh.y,bh.r*4);
diskGrad.addColorStop(0, 'rgba(255,255,230,1.0)');
diskGrad.addColorStop(0.15, 'rgba(255,220,140,0.9)');
diskGrad.addColorStop(0.35, 'rgba(255,150,60,0.7)');
diskGrad.addColorStop(0.6, 'rgba(220,70,30,0.4)');
diskGrad.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = diskGrad;
skyCtx.beginPath(); skyCtx.ellipse(bh.x,bh.y,bh.r*4,bh.r*0.7,0,0,Math.PI*2); skyCtx.fill();
skyCtx.fillStyle = '#000000';
skyCtx.beginPath(); skyCtx.arc(bh.x,bh.y,bh.r,0,Math.PI*2); skyCtx.fill();
for(let i=0;i<3;i++){
const outerR = Math.max(1, galCanvas.r*2-i*30);
const ellipseW = Math.max(1, galCanvas.r-i*20);
const ellipseH = Math.max(1, galCanvas.r*0.375-i*8);
const g2 = skyCtx.createRadialGradient(galCanvas.x,galCanvas.y,0,galCanvas.x,galCanvas.y,outerR);
g2.addColorStop(0, `rgba(230,220,255,${Math.max(0,0.7-i*0.15)})`);
g2.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = g2;
skyCtx.beginPath(); skyCtx.ellipse(galCanvas.x,galCanvas.y,ellipseW,ellipseH,0.6,0,Math.PI*2); skyCtx.fill();
}
for(let arm=0; arm<2; arm++){
for(let j=0; j<14; j++){
const ang = (j/14)*Math.PI*2.2 + arm*Math.PI + 0.6;
const dist = (j/14)*galCanvas.r*1.8;
const ax = galCanvas.x + Math.cos(ang)*dist;
const ay = galCanvas.y + Math.sin(ang)*dist*0.4;
const sizeBlob = Math.max(1, galCanvas.r*0.25*(1-j/16));
const armGrad = skyCtx.createRadialGradient(ax,ay,0,ax,ay,sizeBlob);
armGrad.addColorStop(0, `rgba(210,200,255,${Math.max(0,0.35*(1-j/14))})`);
armGrad.addColorStop(1, 'rgba(0,0,0,0)');
skyCtx.fillStyle = armGrad;
skyCtx.beginPath(); skyCtx.arc(ax,ay,sizeBlob,0,Math.PI*2); skyCtx.fill();
}
}
starData.forEach(s => {
const flicker = s.twinkles ? s.baseA + Math.sin(t*s.speed + s.x*0.05 + s.y*0.03) * 0.35 : s.baseA;
skyCtx.fillStyle = `rgba(255,255,255,${Math.max(0.1,Math.min(1,flicker))})`;
skyCtx.beginPath(); skyCtx.arc(s.x,s.y,s.r,0,Math.PI*2); skyCtx.fill();
});
skyTex.needsUpdate = true;
}


pivot.rotation.y = yaw;






fireParticles.forEach(spr => {
spr.userData.phase += 0.06 * spr.userData.speed;
const rise = (t*10*spr.userData.speed + spr.userData.riseOffset) % 6;
spr.position.y = spr.userData.baseY + rise;
const progress = rise/6;
spr.position.x = spr.userData.baseX + Math.sin(spr.userData.phase)*0.3*(1-progress*0.3);
spr.position.z = spr.userData.baseZ + Math.cos(spr.userData.phase)*0.3*(1-progress*0.3);
spr.material.opacity = 0.75 * (1-progress);
const sc = (1.8 + Math.sin(spr.userData.phase*2)*0.2) * (1-progress*0.4);
spr.scale.set(sc, sc*1.4, 1);

});
fireLight.intensity = 12 + Math.sin(t*15)*4 + Math.random()*2;

portalGroups.forEach(g => {
if(g.userData.spinning){
g.userData.spinT += 0.03;
g.userData.outerRing.rotation.z += 0.25;
const s = 1 + Math.sin(g.userData.spinT * 3) * 0.08;
g.scale.set(s,s,s);
if(g.userData.spinT > Math.PI*2){
g.userData.spinT = 0;
}
}
});
const f=1+Math.sin(t*6.7)*.03;
cyanMat.emissiveIntensity=2*f;
purpleMat.emissiveIntensity=0.3*f;
cyanTop.intensity=20*f;
purpleBot.intensity=20*f;
mainPl.intensity=30*f;
leftPl.intensity=30*f;
rightPl.intensity=30*f;rightPl.intensity=30*f;

// figureMixer.update() is intentionally NOT called here with a real delta —
// both actions are paused/frozen at time=0 and we only ever re-evaluate the
// pose manually (see figureMixer.update(0) calls above) when the blend
// weights change. This keeps the pose stable and prevents any drift.

composer.render();
};
renderer.setAnimationLoop(loop);

return ()=>{
renderer.setAnimationLoop(null);
clearInterval(clockInterval);
clearInterval(logoInterval);
window.removeEventListener("resize", onResize);
window.removeEventListener("mousedown",onDown);
window.removeEventListener("mousemove",onMove);
window.removeEventListener("mouseup",onUp);
window.removeEventListener("touchstart",onTouchStart);
window.removeEventListener("touchmove",onTouchMove);
window.removeEventListener("touchend",onTouchEnd);
if(figureMixer) figureMixer.stopAllAction();
if(figureModel) scene.remove(figureModel);
if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement);
renderer.dispose();
composer.dispose();
};
}, []);



return (
<div ref={mountRef} style={{
width:"100vw", height:"100vh", overflow:"hidden",
cursor:"grab", position:"fixed", top:0, left:0,
background:"#000005"
}}>
<button
onClick={()=>{
setMuted(m=>{
const newMuted = !m;
if(videoRef.current) videoRef.current.muted = newMuted;
return newMuted;
});
}}
style={{
position:"fixed", bottom:20, right:20, zIndex:100,
background:"rgba(0,0,0,0.6)", border:"1px solid rgba(0,200,255,0.5)",
color:"#00ccff", padding:"10px 18px", borderRadius:30,
cursor:"pointer", fontSize:18, backdropFilter:"blur(8px)",
}}
>
{muted ? "🔇" : "🔊"}
</button>
</div>
);
}

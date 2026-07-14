import React, { useEffect, useRef,  } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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

const W = window.innerWidth;
const H = window.innerHeight;

// ROOM DIMENSIONS
const BW=550, RH=160, RD=550, HW=275, HH=80, HD=275;

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000005);

// CAMERA + PIVOT
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const fov = W / H < 1 ? 60 : 35;
const camera = new THREE.PerspectiveCamera(fov, W/H, 0.1, 3000)
const camDist = isMobile ? 780 : 580;
const camY = isMobile ? -25 : -10;
const pivot = new THREE.Object3D();
pivot.position.set(0, camY, camDist); // pivot IS the camera's eye position now
scene.add(pivot);
pivot.add(camera);
camera.position.set(0, 0, 0); // zero offset — rotating pivot just turns the view, no swinging
camera.lookAt(0, -10, -50);

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
const bpL1 = new THREE.RectAreaLight(0xff00ff, 8, 30, 20);
bpL1.position.set(-55, -1, -HD+5);
bpL1.lookAt(-55, -1, 0);
scene.add(bpL1);
const bpL2 = new THREE.RectAreaLight(0x00ccff, 8, 30, 20);
bpL2.position.set(0, -6, -HD+5);
bpL2.lookAt(0, -6, 0);
scene.add(bpL2);
const bpL3 = new THREE.RectAreaLight(0xff00ff, 8, 30, 20);
bpL3.position.set(55, -1, -HD+5);
bpL3.lookAt(55, -1, 0);
scene.add(bpL3);

pl(0x4466aa, 4, 300, 0, HH, -HD-5);
pl(0x4466aa, 10, 600, -HW-80, 0, -HD/2);
pl(0x4466aa, 10, 600, HW+80, 0, -HD/2);
pl(0xaaccff, 15, 400, 0, 0, 50);

// ── PROCEDURAL ENVIRONMENT MAP for glass reflections ──
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const envCanvas = document.createElement('canvas');
envCanvas.width = 1024; envCanvas.height = 512;
const ec = envCanvas.getContext('2d')!;
const skyGrad = ec.createLinearGradient(0,0,0,512);
skyGrad.addColorStop(0, '#334455');
skyGrad.addColorStop(0.3, '#445566');
skyGrad.addColorStop(0.5, '#223344');
skyGrad.addColorStop(0.7, '#112233');
skyGrad.addColorStop(1, '#000511');
ec.fillStyle = skyGrad; ec.fillRect(0,0,1024,512);
ec.fillStyle = 'rgba(200,200,220,0.4)';
ec.beginPath(); ec.arc(700,180,25,0,Math.PI*2); ec.fill();
const envTexture = new THREE.CanvasTexture(envCanvas);
envTexture.mapping = THREE.EquirectangularReflectionMapping;
const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
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
const ceilMat = new THREE.MeshStandardMaterial({
map: ceilTex,
bumpMap: ceilTex,
bumpScale: 0.15,
roughness: 0.75,
metalness: 0.0,
emissive: new THREE.Color(0x553322),
emissiveIntensity: 0.25,
});

// ── GLASS MATERIAL ──
const glassMat = new THREE.MeshPhysicalMaterial({
color: new THREE.Color(0x4477aa),
transparent: true,
opacity: 1.0,
roughness: 0.03,
metalness: 0.0,
transmission: 0.9,
thickness: 0.5,
ior: 1.5,
reflectivity: 0.9,
clearcoat: 1.0,
clearcoatRoughness: 0.05,
envMap: envMap,
envMapIntensity: 1.4,
side: THREE.DoubleSide,
depthWrite: false,
});
const glassInnerMat = new THREE.MeshPhongMaterial({
color: new THREE.Color(0x335588),
emissive: new THREE.Color(0x112244),
emissiveIntensity: 0.4,
specular: new THREE.Color(0xffffff),
shininess: 1200,
transparent: true,
opacity: 0.3,
side: THREE.DoubleSide,
depthWrite: false,
});

// ── NEON TRIM MATERIALS ──
const cyanMat = new THREE.MeshStandardMaterial({color:0x00ccff, emissive:0x00aaff, emissiveIntensity:2});
const purpleMat = new THREE.MeshStandardMaterial({color:0xffaa88, emissive:0xff8844, emissiveIntensity:0.5});
const dimMat = new THREE.MeshStandardMaterial({color:0x9988bb, emissive:0x7766aa, emissiveIntensity:1});

// ── HELPERS ──
function addPlane(w:number,h:number,x:number,y:number,z:number,ry:number,mat:THREE.Material){
const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
m.position.set(x,y,z); m.rotation.y=ry;
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
videoScreen.position.set(0, 25, -HD + 2);
scene.add(videoScreen);

// ── GLASS WALLS — 2 layers ──
addPlane(BW, 700, 0, 25, -HD, 0, glassMat);
addPlane(BW, 700, 0, 25, -HD+1, 0, glassInnerMat);
const sideGlassMat = glassMat.clone();
sideGlassMat.transmission = 0.3;
addPlane(RD, 700, -HW, 25, 0, Math.PI/2, sideGlassMat);
addPlane(RD, 700, -HW+1,25, 0, Math.PI/2, glassInnerMat);
addPlane(RD, 700, HW, 25, 0, -Math.PI/2, sideGlassMat);
addPlane(RD, 700, HW-1,25, 0, -Math.PI/2, glassInnerMat);


// ── FLOOR ──
addBox(BW, 1, RD, 0, -300, 0, floorMat);

// ── CEILING ──
addBox(BW, 1, RD, 0, 300, 0, ceilMat);

// ── CYAN CEILING NEON ──
addBox(BW, 4, 4, 0, HH+50, -HD, dimMat);
addBox(BW, 3, 3, 0, HH+50, HD, dimMat);
addBox( 3, 3, RD, -HW, HH+50, 0, dimMat);
addBox(3, 3, RD, HW, HH+50, 0, dimMat);


// ── PURPLE FLOOR NEON ──
const frontFloorMat = new THREE.MeshStandardMaterial({color:0xfff8f0, emissive:0xffeedd, emissiveIntensity:0.15});
addBox(BW, 4, 4, 0, -HH+2, -HD, purpleMat);
addBox(BW, 1, 1, 0, -HH+2, HD, frontFloorMat);
addBox(4, 4, RD, -HW,-HH+2, 0, purpleMat);
addBox(4, 4, RD, HW,-HH+2, 0, purpleMat);


// ── SECONDARY DIM BORDER ──
addBox(BW, .5, .5, 0, -HH-.3, -HD, dimMat);
addBox(BW, 1.5, 1.5, 0, -HH+.2, HD, purpleMat);
addBox(BW, 9, 9, 0, -HH-5, HD, dimMat);
addBox(.5, .5, RD, -HW,-HH-.3, 0, dimMat);
addBox(.5, .5, RD, HW,-HH-.3, 0, dimMat);

// ── VERTICAL CORNERS ──
addBox(1.5, RH+47, 1.5, -HW+2, 24, -HD+2, dimMat); // back-left
addBox(1.5, RH+47, .6, HW-2, 24, -HD+2, dimMat); // back-right
addBox(1.5, RH+47, 1.5, -HW+3, 24, HD-3, cyanMat); // front-left
addBox(1.5, RH+47, 1.5, HW-3, 24, HD-3, cyanMat); // front-right

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
const FIGURE_POSITION = new THREE.Vector3(0, -HH - 46, 8);

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
bowlGroup.position.set(0, -HH + 3, 70);
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
opacity: 0.8,
blending: THREE.AdditiveBlending,
depthWrite: false,
}));
const s = 2 + Math.random()*2;
spr.scale.set(s, s*1.4, 1);
spr.position.set((Math.random()-0.5)*3, Math.random()*4, (Math.random()-0.5)*3);
spr.userData.baseY = spr.position.y;
spr.userData.speed = 0.7 + Math.random()*0.5;
spr.userData.phase = Math.random()*Math.PI*2;
spr.userData.baseX = spr.position.x;
spr.userData.baseZ = spr.position.z;
spr.userData.riseOffset = Math.random()*6;
bowlGroup.add(spr);
fireParticles.push(spr);
}

const fireLight = new THREE.PointLight(0xff6622, 15, 60);
fireLight.position.set(0, 4, 0);
bowlGroup.add(fireLight);

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
clockCtx.fillStyle = '#ffffff';
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
tickerCtx.fillStyle = 'rgba(0,220,255,1.0)';
tickerCtx.textAlign = 'left';
tickerCtx.fillText(`${c.city}`, cx + 10, 28);
tickerCtx.font = 'bold 30px monospace';
tickerCtx.fillStyle = '#ffffff';
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
new THREE.MeshBasicMaterial({ map: clockTex, transparent: true, depthWrite: false })
);
clockMesh.position.set(-HW+0, 112, -HD+150);
clockMesh.rotation.y = Math.PI/2;
scene.add(clockMesh);

// World time ticker (separate mesh)
const tickerMesh = new THREE.Mesh(
new THREE.PlaneGeometry(295, 30),
new THREE.MeshBasicMaterial({ map: tickerTex, transparent: true, depthWrite: false })
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
new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, depthWrite: false })
);
logoMesh.position.set(0, 115, -HD+0);
logoMesh.frustumCulled = false;
scene.add(logoMesh);


// ── PORTALS ──
const portalData = [
// Back wall portals — z = -HD+2
{ label:'PODCAST', x:-200, y:-10, z:-HD+2, ry:0, color:0x00ccff, eColor:0x0099cc, icon:'🎙️' },
{ label:'GALLERY', x:-120, y:40, z:-HD+2, ry:0, color:0xff44aa, eColor:0xcc2288, icon:'🖼️' },
{ label:'ABOUT US', x:0, y:94, z:-HD+1, ry:0, color:0xffaa00, eColor:0xcc8800, icon:'👁️' },
{ label:'INDIVIDUAL', x:120, y:40, z:-HD+2, ry:0, color:0x44ff88, eColor:0x22cc66, icon:'🧘' },
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
iconCtx.font = '140px serif';
iconCtx.textAlign = 'center';
iconCtx.textBaseline = 'middle';
iconCtx.fillText(p.icon, 128, 138);
const iconTex = new THREE.CanvasTexture(iconCanvas);
const iconMesh = new THREE.Mesh(
new THREE.PlaneGeometry(16, 16),
new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, depthWrite: false })
);
iconMesh.position.z = 0.5;
group.add(iconMesh);

// Label


const canvas = document.createElement('canvas');
canvas.width = 512; canvas.height = 128;
const ctx = canvas.getContext('2d')!;
ctx.clearRect(0,0,512,128);
ctx.fillStyle = '#'+p.color.toString(16).padStart(6,'0');
ctx.font = 'bold 52px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(p.label, 256, 64);
const labelTex = new THREE.CanvasTexture(canvas);
const labelMesh = new THREE.Mesh(
new THREE.PlaneGeometry(40, 10),
new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false })
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

let drag=false, prevX=0, rotY=0, targetRotY=0;
const ROT_LIMIT = isMobile ? 0.35: 0.25; // max look-around angle, in radians
const onDown=(e:MouseEvent)=>{drag=true;prevX=e.clientX;};
const onMove=(e:MouseEvent)=>{
if(!drag)return;
targetRotY=Math.max(-ROT_LIMIT,Math.min(ROT_LIMIT,targetRotY+(e.clientX-prevX)*0.0015));
prevX=e.clientX;
};
const onUp=()=>{drag=false;};
const onTouchStart=(e:TouchEvent)=>{drag=true;prevX=e.touches[0].clientX;};
const onTouchMove=(e:TouchEvent)=>{
if(!drag)return;
targetRotY=Math.max(-ROT_LIMIT,Math.min(ROT_LIMIT,targetRotY+(e.touches[0].clientX-prevX)*0.0015));
prevX=e.touches[0].clientX;
};

const onTouchEnd=()=>{drag=false;};
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

rotY += (targetRotY - rotY) * 0.05;

pivot.rotation.y = rotY;


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

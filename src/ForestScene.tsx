import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ForestScene() {
const mountRef = useRef<HTMLDivElement>(null);

useEffect(() => {
const mount = mountRef.current!;
const W = window.innerWidth;
const H = window.innerHeight;

// ── SCENE + FOG ──
// Fog gives the "deep forest" depth feel — distant trees fade into haze
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a3a2a); // dim green-grey canopy sky
scene.fog = new THREE.FogExp2(0x2a3a2a, 0.012); // exponential fog, thicker with distance

// ── CAMERA ──
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
const pivot = new THREE.Object3D();
pivot.position.set(0, 8, 30);
scene.add(pivot);
pivot.add(camera);
camera.position.set(0, 0, 0);
camera.lookAt(0, -3, -30);


// ── RENDERER ──
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 2 : 1.5));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
mount.appendChild(renderer.domElement);

// ── LOADING SCREEN ──
const loadingManager = new THREE.LoadingManager();
const loadingDiv = document.createElement('div');
loadingDiv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0a1508;color:#8fbf6f;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;font-size:20px;z-index:9999;';
loadingDiv.innerHTML = '<div>Entering the forest...</div><div id="loadpct" style="margin-top:10px;font-size:16px;opacity:0.7;">0%</div>';
document.body.appendChild(loadingDiv);
loadingManager.onProgress = (url, loaded, total) => {
const pct = Math.round((loaded / total) * 100);
const el = document.getElementById('loadpct');
if (el) el.textContent = pct + '%';
};
loadingManager.onLoad = () => {
loadingDiv.style.transition = 'opacity 0.6s';
loadingDiv.style.opacity = '0';
setTimeout(() => loadingDiv.remove(), 600);
};

const gltfLoader = new GLTFLoader(loadingManager);
const treeTextureLoader = new THREE.TextureLoader(loadingManager);

// ── GROUND — real forest floor texture ──
const groundColorTex = treeTextureLoader.load('/textures/forest-ground/textures/forrest_ground_01_diff_2k.jpg');
const groundNormalTex = treeTextureLoader.load('/textures/forest-ground/textures/forrest_ground_01_nor_gl_2k.jpg');
const groundRoughTex = treeTextureLoader.load('/textures/forest-ground/textures/forrest_ground_01_rough_2k.jpg');
const groundAOTex = treeTextureLoader.load('/textures/forest-ground/textures/forrest_ground_01_ao_2k.jpg');

[groundColorTex, groundNormalTex, groundRoughTex, groundAOTex].forEach(tex => {
tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(25, 25);
tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
});
groundColorTex.colorSpace = THREE.SRGBColorSpace;

const groundMat = new THREE.MeshStandardMaterial({
map: groundColorTex,
emissive: new THREE.Color(0x556644),
emissiveIntensity: 0.6,
roughness: 0.95,
metalness: 0.0,
});

const groundGeo = new THREE.PlaneGeometry(400, 400);
groundGeo.setAttribute('uv2', groundGeo.attributes.uv);
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ── TREES — real 3D models, placed sparingly ──
function loadAndPlaceTree(path: string, positions: [number, number, number][]) {
gltfLoader.load(path, (gltf) => {
positions.forEach(([x, z, rot]) => {
const instance = gltf.scene.clone(true);
instance.position.set(x, 0, z);
instance.rotation.y = rot;
instance.traverse((child) => {
if ((child as THREE.Mesh).isMesh) {
(child as THREE.Mesh).castShadow = true;
(child as THREE.Mesh).receiveShadow = true;
}
});
scene.add(instance);
});
});
}

loadAndPlaceTree('/models/trees/island-tree/island_tree_02_1k.gltf', [
[-30, -60, 0.4],
[35, -80, 2.1],
]);

loadAndPlaceTree('/models/trees/fir-sapling/fir_sapling_medium_1k.gltf', [
[-45, -100, 1.0],
[25, -50, 3.5],
[10, -110, 0.8],
]);




// ── LIGHTING — dappled forest sunlight ──
scene.add(new THREE.AmbientLight(0x4a5a3a, 0.8));

const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.4);
sunLight.position.set(20, 40, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
scene.add(sunLight);

// soft green fill light bouncing off foliage
const fillLight = new THREE.HemisphereLight(0x88aa66, 0x2a3a2a, 0.6);
scene.add(fillLight);

// ── 360° DRAG-TO-LOOK ──
let isDragging = false;
let lastX = 0, lastY = 0;
let yaw = 0, pitch = 0;
const PITCH_LIMIT = 0.5;

function startDrag(x: number, y: number) { isDragging = true; lastX = x; lastY = y; }
function updateDrag(x: number, y: number) {
if (!isDragging) return;
const dx = x - lastX, dy = y - lastY;
yaw -= dx * 0.003;
pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch - dy * 0.003));
lastX = x; lastY = y;
}
function endDrag() { isDragging = false; }

const onDown = (e: MouseEvent) => startDrag(e.clientX, e.clientY);
const onMove = (e: MouseEvent) => updateDrag(e.clientX, e.clientY);
const onUp = () => endDrag();
const onTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientX, e.touches[0].clientY);
const onTouchMove = (e: TouchEvent) => updateDrag(e.touches[0].clientX, e.touches[0].clientY);
const onTouchEnd = () => endDrag();

window.addEventListener("mousedown", onDown);
window.addEventListener("mousemove", onMove);
window.addEventListener("mouseup", onUp);
window.addEventListener("touchstart", onTouchStart, { passive: true });
window.addEventListener("touchmove", onTouchMove, { passive: true });
window.addEventListener("touchend", onTouchEnd);

// ── RENDER LOOP ──
const animate = () => {
pivot.rotation.y = yaw;
pivot.rotation.x = pitch;
renderer.render(scene, camera);
};
renderer.setAnimationLoop(animate);
// ── RESIZE ──
const onResize = () => {
const newW = window.innerWidth;
const newH = window.innerHeight;
camera.aspect = newW / newH;
camera.updateProjectionMatrix();
renderer.setSize(newW, newH);
};
window.addEventListener('resize', onResize);

return () => {
renderer.setAnimationLoop(null);
window.removeEventListener('resize', onResize);
window.removeEventListener("mousedown", onDown);
window.removeEventListener("mousemove", onMove);
window.removeEventListener("mouseup", onUp);
window.removeEventListener("touchstart", onTouchStart);
window.removeEventListener("touchmove", onTouchMove);
window.removeEventListener("touchend", onTouchEnd);
if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
renderer.dispose();
};
}, []);

return (
<div ref={mountRef} style={{
width: "100vw", height: "100vh", overflow: "hidden",
position: "fixed", top: 0, left: 0,
background: "#000"
}} />
);
}

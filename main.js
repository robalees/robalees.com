import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xece2d0);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.z = 8;

// Renderer setup
const canvas = document.getElementById("threeCanvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputEncoding = THREE.sRGBEncoding;

// Materials
const robotMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xf9627d,
  metalness: 0.9,
  roughness: 0.1,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
});

const eyeMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x83b692,
  emissive: 0xc5d86d,
  emissiveIntensity: 0.8,
  metalness: 0.5,
  roughness: 0.2,
});

// Model loading
const loader = new GLTFLoader();
let model;

function loadModel() {
  return new Promise((resolve, reject) => {
    loader.load(
      "/robot01.glb",
      (gltf) => {
        model = gltf.scene;
        model.rotation.y = Math.PI / -2.5;

        model.traverse((node) => {
          if (node.isMesh) {
            node.material = node.name.includes("Eye")
              ? eyeMaterial
              : robotMaterial;
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        scene.add(model);
        resolve(model);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        reject(error);
      }
    );
  });
}

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(6, 4, 2);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Floor plane
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -2;
plane.receiveShadow = true;
scene.add(plane);

// Simple animation
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    const time = Date.now() * 0.001;
    model.position.x = Math.sin(time * 0.5) * 0.2;
  }

  renderer.render(scene, camera);
}

// Simplified resize function
function resizeCanvas() {
  const container = canvas.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

// Environment Map Loading using HDR
function loadEnvironmentMap() {
  return new Promise((resolve, reject) => {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(
      "/symmetrical_garden_02_1k.hdr",
      function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        resolve();
      },
      undefined,
      reject
    );
  });
}

// Initialize function
async function init() {
  try {
    await loadEnvironmentMap();
    await loadModel();
    resizeCanvas();
    animate();
  } catch (error) {
    console.error("Failed to initialize scene:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Wait for stylesheets to load
  const styleSheets = document.styleSheets;
  if (styleSheets.length === 0) {
    // If no stylesheets are loaded yet, wait for load event
    window.addEventListener("load", init);
  } else {
    init();
  }
});

window.addEventListener("resize", resizeCanvas);

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
  powerPreference: "high-performance",
  pixelRatio: window.devicePixelRatio,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputEncoding = THREE.sRGBEncoding;

renderer.onError = function (error) {
  console.error("Renderer error:", error);
};

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
      // Add loading progress callback
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        updateLoadingProgress("model", percentComplete);
      },
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

// Animation
let animationFrameId;
function animate() {
  animationFrameId = requestAnimationFrame(animate);

  if (model) {
    const time = Date.now() * 0.001;
    model.position.x = Math.sin(time * 0.5) * 0.2;
  }

  renderer.render(scene, camera);
}

// Resize handling
const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    if (entry.target === canvas.parentElement) {
      resizeCanvas();
    }
  }
});

function resizeCanvas() {
  const container = canvas.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

// Environment Map Loading
function loadEnvironmentMap() {
  return new Promise((resolve, reject) => {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.setDataType(THREE.FloatType);
    rgbeLoader.load(
      "/symmetrical_garden_02_1k.hdr",
      function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.needsUpdate = true;
        texture.flipY = false;
        scene.environment = texture;
        resolve();
      },
      // Add loading progress callback
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        updateLoadingProgress("environment", percentComplete);
      },
      reject
    );
  });
}

// Loading UI
function showLoadingIndicator() {
  const loadingElement = document.createElement("div");
  loadingElement.id = "loading-indicator";
  loadingElement.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-progress">Loading... 0%</div>
  `;
  document.body.appendChild(loadingElement);
}

function hideLoadingIndicator() {
  const loadingElement = document.getElementById("loading-indicator");
  if (loadingElement) {
    loadingElement.remove();
  }
}

function updateLoadingProgress(type, progress) {
  const progressElement = document.querySelector(".loading-progress");
  if (progressElement) {
    progressElement.textContent = `Loading ${type}... ${Math.round(progress)}%`;
  }
}

// Cleanup function
function cleanup() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  if (model) {
    scene.remove(model);
    model.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (object.material.map) object.material.map.dispose();
        object.material.dispose();
      }
    });
  }

  if (scene.environment) {
    scene.environment.dispose();
  }

  renderer.dispose();
  resizeObserver.disconnect();
}

// Initialize function
async function init() {
  showLoadingIndicator();
  try {
    await loadEnvironmentMap();
    await loadModel();
    resizeCanvas();

    // Start observing resize
    resizeObserver.observe(canvas.parentElement);

    // Start animation
    animate();

    // Show canvas
    canvas.classList.add("loaded");
  } catch (error) {
    console.error("Failed to initialize scene:", error);
    // Show error to user
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.textContent =
      "Failed to load 3D scene. Please refresh the page.";
    document.body.appendChild(errorMessage);
  } finally {
    hideLoadingIndicator();
  }
}

// Event listeners
window.addEventListener("load", init);
window.addEventListener("unload", cleanup);

// Error handling for texture loading failures
THREE.DefaultLoadingManager.onError = function (url) {
  console.error("Error loading texture:", url);
};

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import gsap from "gsap";
import Stats from "three/examples/jsm/libs/stats.module";

// Performance monitoring
const stats = new Stats();
document.body.appendChild(stats.dom);
stats.dom.style.position = "absolute";
stats.dom.style.top = "0px";
stats.dom.style.left = "0px";

// Scene setup
const scene = new THREE.Scene();
// Change background color here (hex value)
scene.background = new THREE.Color(0xece2d0);

// Camera setup
// Parameters: FOV (75 for wider view), aspect ratio, near plane, far plane
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
// Adjust these values to change camera position
// camera.position.z = 8; // Distance from scene
// camera.position.y = 2; // Height
camera.lookAt(0, 0, 0);

// Renderer setup
const canvas = document.getElementById("threeCanvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.shadowMap.enabled = true;

// Post-processing setup (Bloom effect)
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Adjust these values to change the glow effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1, // Intensity: increase for stronger glow
  0.4, // Radius: increase for wider glow
  0.85 // Threshold: decrease to make more elements glow
);
composer.addPass(bloomPass);

// Materials - Adjust colors and properties for different appearances
const materials = {
  body: new THREE.MeshStandardMaterial({
    color: 0xf9627d, // Change color (hex value)
    metalness: 0.7, // 0-1: higher = more metallic
    roughness: 0.3, // 0-1: lower = more shiny
  }),
  bottom: new THREE.MeshStandardMaterial({
    color: 0xf9627d,
    metalness: 0.7,
    roughness: 0.3,
  }),
  eye: new THREE.MeshStandardMaterial({
    color: 0x83b692,
    emissive: 0xc5d86d, // Self-illuminating color
    emissiveIntensity: 0.8, // Brightness of self-illumination
  }),
  antenna: new THREE.MeshStandardMaterial({
    color: 0xf9627d,
    metalness: 0.7,
    roughness: 0.3,
  }),
};

// Model loading with error handling
const loader = new GLTFLoader();
let model;

function loadModel() {
  return new Promise((resolve, reject) => {
    loader.load(
      "/assets/robot01.glb", // Change path to your model file
      (gltf) => {
        model = gltf.scene;
        // Adjust initial position and scale of the model
        model.position.set(0, -0.5, 0);
        model.scale.set(1, 1, 1);

        model.traverse((node) => {
          if (node.isMesh) {
            // Apply materials based on mesh names
            if (node.name.includes("Body")) {
              node.material = materials.body;
            } else if (node.name.includes("Bottom")) {
              node.material = materials.bottom;
            } else if (node.name.includes("Eye")) {
              node.material = materials.eye;
            } else if (node.name.includes("Antenna")) {
              node.material = materials.antenna;
            }
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
// Lighting setup
// Ambient light - overall scene brightness
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Color, intensity
scene.add(ambientLight);

// Directional light - main light source
const directionalLight = new THREE.DirectionalLight(0xffffff, 3); // Color, intensity
// Adjust light position for different shadow angles
directionalLight.position.set(6, 4, 2);
directionalLight.target.position.set(0, 0, 0);
directionalLight.castShadow = true;
// Shadow quality settings
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
// Shadow camera settings - adjust these to change shadow area
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 20;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.camera.left = -10;
scene.add(directionalLight);
scene.add(directionalLight.target);

// Floor plane setup
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 }); // Adjust opacity for shadow intensity
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.set(0, -2, 0); // Adjust height of the floor
plane.receiveShadow = true;
scene.add(plane);

// Movement configuration
// Adjust these values to change how far the model can move
const movementBounds = {
  x: { min: -5, max: 5 }, // Left/right bounds
  y: { min: -1, max: 2 }, // Up/down bounds
  z: { min: -3, max: 3 }, // Forward/backward bounds
};

// Adjust these values to change movement speed
const movementSpeed = {
  x: 0.5, // Left/right speed
  y: 0.3, // Up/down speed
  z: 0.4, // Forward/backward speed
};

// Clock for animations
const clock = new THREE.Clock();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  stats.begin();

  if (model) {
    const time = clock.getElapsedTime();

    // Hovering movement - adjust multipliers for different movement patterns
    gsap.to(model.position, {
      x: Math.sin(time * movementSpeed.x) * 2, // Horizontal movement amplitude
      y: Math.sin(time * movementSpeed.y) * 1 - 0.01, // Vertical movement amplitude
      z: Math.cos(time * movementSpeed.z) * 1.5, // Depth movement amplitude
      duration: 0.1,
      ease: "none",
      overwrite: true,
    });

    // Keep model within defined boundaries
    model.position.x = THREE.MathUtils.clamp(
      model.position.x,
      movementBounds.x.min,
      movementBounds.x.max
    );
    model.position.y = THREE.MathUtils.clamp(
      model.position.y,
      movementBounds.y.min,
      movementBounds.y.max
    );
    model.position.z = THREE.MathUtils.clamp(
      model.position.z,
      movementBounds.z.min,
      movementBounds.z.max
    );

    // Rotation animation - adjust values for different rotation patterns
    gsap.to(model.rotation, {
      y: Math.sin(time * 0.75) * 4, // Rotation speed and amplitude
      duration: 0.1,
      ease: "none",
      overwrite: true,
    });
  }

  composer.render();
  stats.end();
}

// Responsive design handling
function resizeCanvas() {
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const pixelRatio = window.devicePixelRatio;

  canvas.style.width = `${containerWidth}px`;
  canvas.style.height = `${containerHeight}px`;
  canvas.width = containerWidth * pixelRatio;
  canvas.height = containerHeight * pixelRatio;

  // Responsive camera adjustments - modify these values for different screen sizes
  if (window.innerWidth <= 480) {
    camera.fov = 60;
    camera.position.z = 8;
  } else if (window.innerWidth <= 768) {
    camera.fov = 65;
    camera.position.z = 8;
  } else {
    camera.fov = 75;
    camera.position.z = 15;
  }

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight, false);
  renderer.setPixelRatio(pixelRatio);
  composer.setSize(containerWidth, containerHeight);
}

// Memory management and cleanup
function cleanupScene() {
  scene.traverse((object) => {
    if (object.geometry) {
      object.geometry.dispose();
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else {
        object.material.dispose();
      }
    }
  });

  Object.values(materials).forEach((material) => material.dispose());

  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  composer.renderTarget1.dispose();
  composer.renderTarget2.dispose();
}

// Event listeners
const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    resizeCanvas();
  }
});

window.addEventListener("resize", resizeCanvas);
resizeObserver.observe(canvas.parentElement);

// Hamburger menu functionality
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});

const navLinks = document.querySelectorAll(".nav-link");
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  });
});

// Initialize the scene
async function init() {
  try {
    await loadModel();
    resizeCanvas();
    animate();
  } catch (error) {
    console.error("Failed to initialize scene:", error);
  }
}

// Start the application
init();

// Cleanup on page unload
window.addEventListener("unload", cleanupScene);

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const SIZE = 64;
const GLB_PATH = '/05106a4a_94a9_4090_b462_1ea304_Golden_maple_leaf_emblem_on_dark_background_Hunyuan_3D_2e21eca5.glb';

function createParticles(): THREE.Points {
  const count = 80;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count); // for pulsing

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.55 + Math.random() * 0.45;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.userData.phases = phases;

  const mat = new THREE.PointsMaterial({
    color: 0xffaa33,
    size: 0.04,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

export default function Logo3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 2);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);

    // warm rim light for golden aura feel
    const rimLight = new THREE.PointLight(0xff9922, 2.0, 5);
    rimLight.position.set(-1, 0, 1);
    scene.add(rimLight);

    const particles = createParticles();
    scene.add(particles);

    let animId: number;
    let elapsed = 0;

    const loader = new GLTFLoader();
    loader.load(GLB_PATH, (gltf) => {
      const model = gltf.scene;

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry.computeBoundingBox();
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        model.scale.setScalar(1 / maxDim);
        model.position.sub(center.divideScalar(maxDim));
      }

      scene.add(model);

      const phases = particles.geometry.userData.phases as Float32Array;
      const mat = particles.material as THREE.PointsMaterial;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        elapsed += 0.016;

        model.rotation.y += 0.008;

        // slowly orbit particles in opposite direction for depth
        particles.rotation.y -= 0.004;
        particles.rotation.x += 0.002;

        // pulse particle opacity
        mat.opacity = 0.5 + 0.35 * Math.sin(elapsed * 1.5);

        // pulse rim light intensity
        rimLight.intensity = 1.5 + Math.sin(elapsed * 2.0) * 0.8;

        renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: `${SIZE}px`, height: 0, overflow: 'visible', flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        className="logo-3d-canvas"
        width={SIZE}
        height={SIZE}
        style={{ display: 'block', position: 'absolute', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
    </div>
  );
}

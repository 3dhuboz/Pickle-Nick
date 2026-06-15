import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const clay = new THREE.Color('#bc4b35');
const sand = new THREE.Color('#f5f0e6');
const turquoise = new THREE.Color('#26a69a');
const earth = new THREE.Color('#4e342e');

const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
  if (Array.isArray(material)) {
    material.forEach(m => m.dispose());
    return;
  }
  material.dispose();
};

const makeDiamondGeometry = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.16);
  shape.lineTo(0.14, 0);
  shape.lineTo(0, -0.16);
  shape.lineTo(-0.14, 0);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
};

const createSunMedallion = () => {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 48),
    new THREE.MeshStandardMaterial({ color: clay, roughness: 0.74, metalness: 0.04 })
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.025, 10, 64),
    new THREE.MeshStandardMaterial({ color: turquoise, roughness: 0.4, metalness: 0.18 })
  );
  const rayGeometry = new THREE.BoxGeometry(0.035, 0.28, 0.025);
  const rayMaterial = new THREE.MeshStandardMaterial({ color: earth, roughness: 0.68 });

  for (let i = 0; i < 18; i++) {
    const ray = new THREE.Mesh(rayGeometry, rayMaterial);
    const angle = (i / 18) * Math.PI * 2;
    ray.position.set(Math.sin(angle) * 0.72, Math.cos(angle) * 0.72, -0.02);
    ray.rotation.z = -angle;
    group.add(ray);
  }

  group.add(disc, ring);
  group.position.set(-3.15, 1.45, -1.25);
  group.rotation.z = -0.12;
  return group;
};

const createJar = (x: number, y: number, z: number, scale: number, fill: THREE.ColorRepresentation, lid: THREE.ColorRepresentation) => {
  const group = new THREE.Group();
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#eaf7f5',
    roughness: 0.06,
    metalness: 0,
    transmission: 0.22,
    thickness: 0.75,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });
  const brineMaterial = new THREE.MeshStandardMaterial({
    color: fill,
    roughness: 0.38,
    metalness: 0.02,
    transparent: true,
    opacity: 0.78,
  });
  const lidMaterial = new THREE.MeshStandardMaterial({ color: lid, roughness: 0.5, metalness: 0.15 });
  const paperMaterial = new THREE.MeshStandardMaterial({ color: '#fff7e5', roughness: 0.92, metalness: 0 });
  const markMaterial = new THREE.MeshStandardMaterial({ color: turquoise, roughness: 0.5, metalness: 0.02 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.43, 1.16, 36, 1, true), glassMaterial);
  const fillBody = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.39, 0.82, 36), brineMaterial);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.26, 36), glassMaterial);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 36), lidMaterial);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), paperMaterial);
  const labelMark = new THREE.Mesh(makeDiamondGeometry(), markMaterial);

  fillBody.position.y = -0.12;
  neck.position.y = 0.68;
  cap.position.y = 0.88;
  label.position.set(0, -0.06, 0.435);
  labelMark.position.set(0, -0.06, 0.44);
  labelMark.scale.setScalar(0.62);

  group.add(body, fillBody, neck, cap, label, labelMark);
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.userData.phase = Math.abs(x * 0.67 + z * 0.31);
  group.userData.baseY = y;
  return group;
};

const createPatternField = () => {
  const countX = 18;
  const countY = 7;
  const geometry = new THREE.PlaneGeometry(0.18, 0.18);
  const material = new THREE.MeshBasicMaterial({
    color: '#8d6e63',
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, countX * countY);
  const matrix = new THREE.Matrix4();
  let index = 0;

  for (let y = 0; y < countY; y++) {
    for (let x = 0; x < countX; x++) {
      const posX = (x - countX / 2) * 0.62 + (y % 2) * 0.31;
      const posY = (y - countY / 2) * 0.34;
      matrix.compose(
        new THREE.Vector3(posX, posY, -2.15),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 4)),
        new THREE.Vector3(1, 1, 1)
      );
      mesh.setMatrixAt(index++, matrix);
    }
  }

  mesh.position.y = 0.12;
  return mesh;
};

const backgroundVertexShader = `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin((p.x * 1.25) + uTime * 0.34) * 0.05;
    p.z += sin((p.y * 2.1) - uTime * 0.28) * 0.035;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const backgroundFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uSand;
  uniform vec3 uClay;
  uniform vec3 uTurquoise;

  void main() {
    float diagonalA = abs(sin((vUv.x + vUv.y + uTime * 0.018) * 38.0));
    float diagonalB = abs(sin((vUv.x - vUv.y - uTime * 0.012) * 38.0));
    float weave = smoothstep(0.92, 0.985, diagonalA * diagonalB);
    float band = smoothstep(0.1, 0.9, vUv.y);
    vec3 base = mix(uSand, uClay, weave * 0.16);
    vec3 color = mix(base, uTurquoise, weave * band * 0.12);
    gl_FragColor = vec4(color, 0.42);
  }
`;

const BrineDepthScene = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.46, 5.35);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.AmbientLight('#f5f0e6', 1.9);
    const keyLight = new THREE.DirectionalLight('#fff2d4', 3.2);
    keyLight.position.set(2.9, 3.8, 4.4);
    const rimLight = new THREE.PointLight('#26a69a', 2.4, 8);
    rimLight.position.set(-2.6, 0.8, 2.6);
    scene.add(ambient, keyLight, rimLight);

    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSand: { value: sand },
        uClay: { value: clay },
        uTurquoise: { value: turquoise },
      },
      vertexShader: backgroundVertexShader,
      fragmentShader: backgroundFragmentShader,
    });
    const shaderPlane = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 6.2, 40, 20), shaderMaterial);
    shaderPlane.position.set(0, 0.2, -2.65);
    scene.add(shaderPlane);

    const jars = [
      createJar(-1.7, -0.64, 0.1, 0.98, '#7c9f3d', '#1a1a1a'),
      createJar(-0.55, -0.82, 0.48, 1.16, '#d06a3d', '#bc4b35'),
      createJar(0.72, -0.72, 0.22, 1.04, '#e7b84e', '#00695c'),
      createJar(1.78, -0.58, -0.22, 0.88, '#8fae57', '#4e342e'),
    ];
    jars.forEach(jar => root.add(jar));
    root.add(createPatternField(), createSunMedallion());

    const pointer = new THREE.Vector2(0, 0);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startedAt = performance.now();
    let frame = 0;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointer.y = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };

    const render = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      shaderMaterial.uniforms.uTime.value = elapsed;
      root.rotation.y += (pointer.x * 0.13 - root.rotation.y) * 0.045;
      root.rotation.x += (-pointer.y * 0.055 - root.rotation.x) * 0.045;
      rimLight.position.x = -2.6 + Math.sin(elapsed * 0.5) * 0.42;

      jars.forEach(jar => {
        jar.position.y = jar.userData.baseY + Math.sin(elapsed * 0.78 + jar.userData.phase) * 0.055;
        jar.rotation.y = Math.sin(elapsed * 0.32 + jar.userData.phase) * 0.12;
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    resize();

    if (reducedMotion) {
      renderer.render(scene, camera);
    } else {
      frame = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) disposeMaterial(mesh.material);
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none opacity-90 mix-blend-multiply"
      aria-hidden="true"
    />
  );
};

export default BrineDepthScene;

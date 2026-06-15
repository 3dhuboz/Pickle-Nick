import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const palette = {
  parchment: new THREE.Color('#f5f0e6'),
  chilli: new THREE.Color('#bc4b35'),
  turmeric: new THREE.Color('#e0a72f'),
  brass: new THREE.Color('#b98934'),
  tamarind: new THREE.Color('#4e342e'),
  leaf: new THREE.Color('#00695c'),
  ink: new THREE.Color('#1a1a1a'),
};

const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
  if (Array.isArray(material)) {
    material.forEach(m => m.dispose());
    return;
  }
  material.dispose();
};

const makeDiamondGeometry = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.12);
  shape.lineTo(0.11, 0);
  shape.lineTo(0, -0.12);
  shape.lineTo(-0.11, 0);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
};

const createArchPanel = () => {
  const group = new THREE.Group();
  const archShape = new THREE.Shape();
  archShape.moveTo(-1.85, -1.45);
  archShape.lineTo(-1.85, 0.12);
  archShape.bezierCurveTo(-1.85, 1.42, 1.85, 1.42, 1.85, 0.12);
  archShape.lineTo(1.85, -1.45);
  archShape.lineTo(-1.85, -1.45);

  const panel = new THREE.Mesh(
    new THREE.ShapeGeometry(archShape, 36),
    new THREE.MeshBasicMaterial({
      color: palette.brass,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  const inner = new THREE.Mesh(
    new THREE.ShapeGeometry(archShape, 36),
    new THREE.MeshBasicMaterial({
      color: palette.parchment,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  inner.scale.set(0.86, 0.86, 1);
  inner.position.z = 0.01;

  group.add(panel, inner);
  group.position.set(0.2, -0.08, -1.9);
  return group;
};

const createJaliPattern = () => {
  const countX = 13;
  const countY = 8;
  const geometry = makeDiamondGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: palette.tamarind,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, countX * countY);
  const matrix = new THREE.Matrix4();
  let index = 0;

  for (let row = 0; row < countY; row++) {
    for (let col = 0; col < countX; col++) {
      const posX = (col - countX / 2) * 0.42 + (row % 2) * 0.2;
      const posY = (row - countY / 2) * 0.3;
      matrix.compose(
        new THREE.Vector3(posX, posY, -2.08),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 4)),
        new THREE.Vector3(1, 1, 1)
      );
      mesh.setMatrixAt(index++, matrix);
    }
  }

  mesh.position.set(0.15, 0, 0);
  return mesh;
};

const createShelf = () => {
  const group = new THREE.Group();
  const shelfTop = new THREE.Mesh(
    new THREE.BoxGeometry(4.15, 0.14, 0.42),
    new THREE.MeshStandardMaterial({ color: palette.tamarind, roughness: 0.72, metalness: 0.02 })
  );
  const brassEdge = new THREE.Mesh(
    new THREE.BoxGeometry(4.25, 0.045, 0.46),
    new THREE.MeshStandardMaterial({ color: palette.brass, roughness: 0.38, metalness: 0.28 })
  );
  shelfTop.position.set(0.15, -1.08, 0.12);
  brassEdge.position.set(0.15, -0.98, 0.14);
  group.add(shelfTop, brassEdge);
  return group;
};

const createJar = (
  x: number,
  y: number,
  z: number,
  scale: number,
  fill: THREE.ColorRepresentation,
  lid: THREE.ColorRepresentation
) => {
  const group = new THREE.Group();
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#f3fff8',
    roughness: 0.04,
    metalness: 0,
    transmission: 0.18,
    thickness: 0.55,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
  });
  const brineMaterial = new THREE.MeshStandardMaterial({
    color: fill,
    roughness: 0.42,
    metalness: 0.01,
    transparent: true,
    opacity: 0.74,
  });
  const lidMaterial = new THREE.MeshStandardMaterial({ color: lid, roughness: 0.46, metalness: 0.2 });
  const labelMaterial = new THREE.MeshStandardMaterial({ color: '#fff7e0', roughness: 0.92, metalness: 0 });
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: palette.chilli, roughness: 0.66, metalness: 0.02 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 1.08, 40, 1, true), glassMaterial);
  const fillBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.72, 40), brineMaterial);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.29, 0.23, 40), glassMaterial);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.31, 0.15, 40), lidMaterial);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), labelMaterial);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.32), stripeMaterial);

  fillBody.position.y = -0.16;
  neck.position.y = 0.62;
  cap.position.y = 0.81;
  label.position.set(0, -0.06, 0.405);
  stripe.position.set(-0.16, -0.06, 0.411);

  group.add(body, fillBody, neck, cap, label, stripe);
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.userData.phase = Math.abs(x * 0.71 + z * 0.28);
  group.userData.baseY = y;
  return group;
};

const createSpiceBowl = (x: number, z: number, color: THREE.ColorRepresentation) => {
  const group = new THREE.Group();
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: palette.brass, roughness: 0.34, metalness: 0.36 })
  );
  const spice = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 32, 10),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 })
  );
  bowl.scale.y = 0.34;
  spice.scale.y = 0.16;
  bowl.position.y = -0.92;
  spice.position.y = -0.83;
  group.add(bowl, spice);
  group.position.set(x, 0, z);
  return group;
};

const backgroundVertexShader = `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin((p.x * 1.1) + uTime * 0.18) * 0.025;
    p.z += sin((p.y * 1.7) - uTime * 0.16) * 0.02;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const backgroundFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uParchment;
  uniform vec3 uChilli;
  uniform vec3 uTurmeric;

  void main() {
    float latticeA = abs(sin((vUv.x + vUv.y + uTime * 0.006) * 30.0));
    float latticeB = abs(sin((vUv.x - vUv.y - uTime * 0.005) * 30.0));
    float jali = smoothstep(0.945, 0.99, latticeA * latticeB);
    float warmBand = smoothstep(0.08, 0.75, vUv.y);
    vec3 base = mix(uParchment, uTurmeric, 0.08 + warmBand * 0.06);
    vec3 color = mix(base, uChilli, jali * 0.14);
    gl_FragColor = vec4(color, 0.48);
  }
`;

const BrineDepthScene = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.26, 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.AmbientLight('#fff3d4', 1.9);
    const keyLight = new THREE.DirectionalLight('#ffe1a6', 3);
    keyLight.position.set(2.6, 3.4, 4.8);
    const rimLight = new THREE.PointLight('#bc4b35', 2.2, 8);
    rimLight.position.set(-1.8, 0.4, 2.2);
    scene.add(ambient, keyLight, rimLight);

    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uParchment: { value: palette.parchment },
        uChilli: { value: palette.chilli },
        uTurmeric: { value: palette.turmeric },
      },
      vertexShader: backgroundVertexShader,
      fragmentShader: backgroundFragmentShader,
    });
    const shaderPlane = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 5.7, 34, 18), shaderMaterial);
    shaderPlane.position.set(0, 0.08, -2.75);
    scene.add(shaderPlane);

    const jars = [
      createJar(-0.88, -0.45, 0.12, 0.92, '#7b9433', '#1a1a1a'),
      createJar(0.08, -0.54, 0.44, 1.08, '#c55332', '#bc4b35'),
      createJar(1.08, -0.49, 0.22, 0.98, '#dca83f', '#00695c'),
      createJar(1.92, -0.42, -0.14, 0.82, '#8fae57', '#4e342e'),
    ];

    root.add(createArchPanel(), createJaliPattern(), createShelf());
    jars.forEach(jar => root.add(jar));
    root.add(
      createSpiceBowl(-1.5, 0.26, '#d14f2e'),
      createSpiceBowl(2.35, 0.06, '#e0a72f')
    );

    const pointer = new THREE.Vector2(0, 0);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startedAt = performance.now();
    let frame = 0;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const isNarrow = width < 760;

      camera.aspect = width / height;
      camera.fov = isNarrow ? 42 : 35;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      root.position.set(isNarrow ? 0.02 : 1.52, isNarrow ? -0.36 : -0.08, 0);
      root.scale.setScalar(isNarrow ? 0.72 : 0.88);
      renderer.render(scene, camera);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointer.y = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };

    const render = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      shaderMaterial.uniforms.uTime.value = elapsed;
      root.rotation.y += (pointer.x * 0.045 - root.rotation.y) * 0.035;
      root.rotation.x += (-pointer.y * 0.025 - root.rotation.x) * 0.035;
      rimLight.position.x = -1.8 + Math.sin(elapsed * 0.38) * 0.22;

      jars.forEach(jar => {
        jar.position.y = jar.userData.baseY + Math.sin(elapsed * 0.46 + jar.userData.phase) * 0.025;
        jar.rotation.y = Math.sin(elapsed * 0.25 + jar.userData.phase) * 0.055;
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
      className="absolute inset-0 pointer-events-none opacity-70"
      aria-hidden="true"
    />
  );
};

export default BrineDepthScene;

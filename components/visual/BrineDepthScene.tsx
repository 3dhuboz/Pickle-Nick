import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const overlayVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const overlayFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uPointer;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.02;
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec2 p = vUv;
    vec2 drift = vec2(uTime * -0.025 + uPointer.x * 0.035, uTime * 0.038 + uPointer.y * 0.025);

    float smoke = fbm(vec2(p.x * 3.5, p.y * 2.25) + drift);
    float rightMask = smoothstep(0.18, 0.78, p.x) * smoothstep(0.02, 0.72, p.y);
    float upperMask = smoothstep(0.98, 0.34, p.y);
    float shrineGlow = smoothstep(0.42, 0.92, 1.0 - distance(p, vec2(0.72, 0.42)) * 1.42);

    float smokeAlpha = smoothstep(0.48, 0.88, smoke) * 0.095 * rightMask * upperMask;
    float glowAlpha = shrineGlow * (0.045 + sin(uTime * 0.7) * 0.012);
    vec3 brass = vec3(0.96, 0.72, 0.34);
    vec3 chilli = vec3(0.78, 0.22, 0.14);
    vec3 color = mix(chilli, brass, p.y * 0.72 + smoke * 0.28);

    gl_FragColor = vec4(color, smokeAlpha + glowAlpha);
  }
`;

const BrineDepthScene = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    mount.appendChild(renderer.domElement);

    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: overlayVertexShader,
      fragmentShader: overlayFragmentShader,
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
    scene.add(plane);

    const particleCount = 140;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i += 1) {
      const x = THREE.MathUtils.lerp(-0.35, 1.05, Math.random());
      const y = THREE.MathUtils.lerp(-1.05, 0.92, Math.random());
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;
      velocities[i] = THREE.MathUtils.lerp(0.018, 0.052, Math.random());
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: '#f4c56d',
      size: 0.009,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const pointer = shaderMaterial.uniforms.uPointer.value as THREE.Vector2;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startedAt = performance.now();
    let frame = 0;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointer.y = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * -2;
    };

    const render = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      shaderMaterial.uniforms.uTime.value = elapsed;

      const positionAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i += 1) {
        const index = i * 3;
        positions[index + 1] += velocities[i] * 0.004;
        positions[index] += Math.sin(elapsed * 0.22 + i) * 0.00045;
        if (positions[index + 1] > 1.08) {
          positions[index + 1] = -1.08;
          positions[index] = THREE.MathUtils.lerp(-0.35, 1.05, Math.random());
        }
      }
      positionAttribute.needsUpdate = true;

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
      particleGeometry.dispose();
      particleMaterial.dispose();
      shaderMaterial.dispose();
      plane.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
};

export default BrineDepthScene;

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float ripple(vec2 point, float frequency, float speed) {
    float distanceFromSource = length(point);
    float wave = sin(distanceFromSource * frequency - uTime * speed);
    return wave * exp(-distanceFromSource * 3.8);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vUv;
    vec2 source = vec2(0.68 + uPointer.x * 0.025, 0.48 + uPointer.y * 0.018);
    vec2 point = (uv - source) * vec2(aspect, 1.0);

    float firstWave = ripple(point, 54.0, 1.9);
    float secondWave = ripple(point + vec2(0.08, -0.03), 71.0, 2.35);
    float interference = max(0.0, firstWave * 0.58 + secondWave * 0.42);
    float focus = smoothstep(0.66, 0.12, length(point));
    float horizon = smoothstep(0.2, 0.78, uv.y) * smoothstep(0.98, 0.5, uv.y);
    float glint = pow(max(0.0, sin((uv.x * 1.6 + uv.y) * 34.0 + uTime * 0.8)), 18.0);

    vec3 brass = vec3(0.93, 0.58, 0.22);
    vec3 glass = vec3(0.76, 0.93, 0.88);
    vec3 color = mix(brass, glass, glint * 0.6);
    float alpha = (interference * 0.14 + glint * 0.055) * focus * horizon;

    gl_FragColor = vec4(color, alpha);
  }
`;

const BrineDepthScene = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(Math.max(width, 1), Math.max(height, 1), false);
      uniforms.uResolution.value.set(Math.max(width, 1), Math.max(height, 1));
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const handlePointerMove = (event: PointerEvent) => {
      uniforms.uPointer.value.set(
        (event.clientX / window.innerWidth - 0.5) * 2,
        (event.clientY / window.innerHeight - 0.5) * -2,
      );
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const startedAt = performance.now();
    let frameId = 0;

    const render = () => {
      uniforms.uTime.value = (performance.now() - startedAt) / 1000;
      renderer.render(scene, camera);
    };

    const tick = () => {
      render();
      frameId = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (reduceMotion) return;
      if (document.hidden) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!frameId) {
        frameId = requestAnimationFrame(tick);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    if (reduceMotion) {
      render();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="brine-depth-scene" aria-hidden="true" />;
};

export default BrineDepthScene;

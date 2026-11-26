"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";

import { PORTRAIT_CRT } from "@/lib/assets";

const IMAGE_SRC = PORTRAIT_CRT;

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Full-screen CRT pass over the grayscale cutout. The source already has an
 * alpha mask, so the shader can composite straight onto the black page: RGB
 * split, halftone dots in the highlights, scanlines, grain and a vignette.
 */
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uActive;
  uniform float uMotion;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;

    // CRT barrel curvature.
    vec2 curved = uv * 2.0 - 1.0;
    curved *= 1.0 + 0.016 * dot(curved, curved);
    uv = curved * 0.5 + 0.5;

    // Pointer: parallax plus a soft lens bulge around the cursor.
    vec2 delta = uv - uPointer;
    delta.x *= uResolution.x / max(uResolution.y, 1.0);
    float dist = length(delta);
    float near = smoothstep(0.32, 0.0, dist) * uActive;
    vec2 dir = dist > 0.0001 ? normalize(uv - uPointer) : vec2(0.0);
    uv += dir * near * 0.015 * uMotion;
    uv += (uPointer - 0.5) * 0.006 * uActive * uMotion;

    // Sparse horizontal tear.
    float tearSeed = hash(vec2(floor(uv.y * 90.0), floor(uTime * 6.0)));
    uv.x += (tearSeed - 0.5) * 0.008 * step(0.985, tearSeed) * uMotion;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec4 center = texture2D(uMap, uv);
    // Soften the cutout's matte edge so the cut-out line never reads as a rim.
    float mask = smoothstep(0.08, 0.55, center.a);

    // Chromatic split, wider near the cursor and towards the right edge.
    float split = (0.005 + 0.005 * near) * (0.55 + 0.45 * uv.x);
    float r = texture2D(uMap, uv + vec2(split, 0.0)).r;
    float g = center.g;
    float b = texture2D(uMap, uv - vec2(split, 0.0)).b;

    // Grade the luma but keep the per-channel differences, so the split
    // survives the monochrome conversion as red/cyan fringing.
    vec3 splitCol = vec3(r, g, b);
    float splitLuma = dot(splitCol, vec3(0.2126, 0.7152, 0.0722));
    float luma = clamp((splitLuma - 0.03) * 1.24, 0.0, 1.0);
    luma = pow(luma, 0.88);
    vec3 col = vec3(luma) + (splitCol - splitLuma) * 1.8;
    col += smoothstep(0.55, 1.0, luma) * 0.08;

    // Halftone dots: darker gaps over the whole frame.
    vec2 cell = fract(uv * uResolution / 3.2) - 0.5;
    float dotMask = smoothstep(0.5, 0.05, length(cell));
    col *= mix(0.58, 1.0, dotMask);

    // Scanlines and a slow rolling band.
    float scan =
      0.5 + 0.5 * sin(uv.y * uResolution.y / 3.0 - uTime * 4.0 * uMotion);
    col *= 0.74 + 0.26 * scan;
    float band = smoothstep(
      0.05,
      0.0,
      abs(fract(uv.y * 0.35 - uTime * 0.05) - 0.5)
    );
    col += band * 0.05 * uMotion;

    // Film grain.
    col += (hash(uv * uResolution + floor(uTime * 24.0 * uMotion)) - 0.5) * 0.05;

    // Vignette.
    float vignette = smoothstep(1.05, 0.3, length((uv - 0.5) * vec2(0.95, 1.1)));
    col *= mix(0.45, 1.0, vignette);

    gl_FragColor = vec4(col * mask, mask);
    #include <colorspace_fragment>
  }
`;

export default function CrtCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let disposed = false;
    let frame = 0;
    let renderer: WebGLRenderer | null = null;
    let geometry: PlaneGeometry | null = null;
    let material: ShaderMaterial | null = null;
    let texture: Texture | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const pointerTarget = new Vector2(0.5, 0.5);
    const pointerCurrent = new Vector2(0.5, 0.5);
    let activeTarget = 0;
    let activeCurrent = 0;

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = 1 - (event.clientY - rect.top) / rect.height;
      const inside = nx > -0.15 && nx < 1.15 && ny > -0.15 && ny < 1.15;
      activeTarget = inside ? 1 : 0;
      pointerTarget.set(
        Math.min(1.15, Math.max(-0.15, nx)),
        Math.min(1.15, Math.max(-0.15, ny)),
      );
    };

    const releasePointer = () => {
      activeTarget = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", releasePointer);
    window.addEventListener("blur", releasePointer);

    const start = async () => {
      try {
        const test =
          document.createElement("canvas").getContext("webgl2") ??
          document.createElement("canvas").getContext("webgl");
        if (!test) throw new Error("WebGL unavailable");

        const loader = new TextureLoader();
        texture = await loader.loadAsync(IMAGE_SRC);
        if (disposed) return;
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = false;

        renderer = new WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = SRGBColorSpace;

        material = new ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          uniforms: {
            uMap: { value: texture },
            uResolution: { value: new Vector2(1, 1) },
            uTime: { value: 0 },
            uPointer: { value: pointerCurrent },
            uActive: { value: 0 },
            uMotion: { value: 1 },
          },
          transparent: true,
          depthWrite: false,
          depthTest: false,
        });

        geometry = new PlaneGeometry(2, 2);
        const mesh = new Mesh(geometry, material);
        mesh.frustumCulled = false;

        const scene = new Scene();
        scene.add(mesh);

        const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const mountedAt = performance.now();

        const renderFrame = (now: number) => {
          if (!renderer || !material) return;
          const elapsed = (now - mountedAt) / 1000;
          const vibesOff = document.documentElement.dataset.vibes === "off";

          pointerCurrent.lerp(pointerTarget, 0.12);
          activeCurrent += (activeTarget - activeCurrent) * 0.1;

          material.uniforms.uTime.value = elapsed;
          material.uniforms.uMotion.value = vibesOff ? 0 : 1;
          material.uniforms.uPointer.value.copy(pointerCurrent);
          material.uniforms.uActive.value = activeCurrent;

          renderer.render(scene, camera);
        };

        const resize = () => {
          if (!renderer || !material) return;
          const width = host.clientWidth;
          const height = host.clientHeight;
          if (!width || !height) return;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.setSize(width, height, false);
          material.uniforms.uResolution.value.set(width, height);
          releasePointer();
          renderFrame(performance.now());
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const loop = (now: number) => {
          frame = window.requestAnimationFrame(loop);
          if (document.hidden) return;
          renderFrame(now);
        };
        frame = window.requestAnimationFrame(loop);

        setReady(true);
      } catch (error) {
        if (disposed) return;
        console.error("[crt]", error);
        setFailed(true);
      }
    };

    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", releasePointer);
      window.removeEventListener("blur", releasePointer);
      geometry?.dispose();
      material?.dispose();
      texture?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
  }, []);

  return (
    <div
      className="crt-portrait"
      ref={hostRef}
      data-ready={ready ? "true" : "false"}
    >
      <canvas ref={canvasRef} className="crt-portrait__canvas" />
      {failed && (
        <>
          <Image
            src={IMAGE_SRC}
            alt=""
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1180px) 62vw, 47vw"
            className="crt-portrait__static"
          />
          <span className="crt-portrait__glass" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

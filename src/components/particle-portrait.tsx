"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";
import {
  ENTERED_EVENT,
  getTier,
  hasEntered,
  subscribeTier,
  TIER_TARGETS,
  type QualityTier,
} from "@/lib/settings";

const IMAGE_SRC = "/images/portrait-sample.webp";

/**
 * The cutout is 1200x1607 and the person sits roughly between 15%-88% on the
 * horizontal axis. We only sample the top 60% (head to mid-chest) so the
 * crossed arms never dominate the home hero. 0.953 is that crop's aspect.
 */
const CROP = { x: 0.14, y: 0.02, width: 0.74, height: 0.58 } as const;
const SOURCE_ASPECT = 0.953;
const SAMPLE_WIDTH = 520;

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uReveal;
  uniform vec2 uPointer;
  uniform float uPointerRadius;
  uniform vec2 uFit;
  uniform float uMotion;

  attribute float aBright;
  attribute float aSeed;
  attribute float aU;

  varying float vAlpha;

  void main() {
    vec3 p = position;

    // Gentle idle drift so the cloud feels alive without being noisy.
    float idle = sin(uTime * 0.85 + aSeed * 6.2832 + p.y * 2.6);
    p.y += idle * 0.0045 * uMotion * (0.35 + aBright);
    p.x += cos(uTime * 0.7 + aSeed * 9.1) * 0.0026 * uMotion * (0.3 + aBright);

    // Pointer scatter, measured in the same plane units as the points.
    vec2 delta = p.xy - uPointer;
    float dist = length(delta);
    float force = smoothstep(uPointerRadius, 0.0, dist) * uMotion;
    vec2 dir = dist > 0.0001 ? delta / dist : vec2(0.0);
    p.xy += dir * force * (0.07 + 0.05 * aBright);

    // Reveal sweep: left to right, then a permanent dim-left / bright-right grade.
    float sweep = 1.0 - smoothstep(uReveal - 0.12, uReveal, aU);
    float grade = mix(0.3, 1.0, smoothstep(0.0, 1.0, aU));
    float rightSide = smoothstep(0.45, 1.0, aU);
    vAlpha = aBright * sweep * grade * mix(0.94, 1.14, rightSide);

    p.xy *= uFit;

    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize =
      uPixelRatio *
      (1.3 + aBright * 2.2) *
      (1.0 + force * 0.4) *
      mix(0.96, 1.16, rightSide);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    float edge = smoothstep(0.5, 0.1, dist);
    gl_FragColor = vec4(0.95, 0.96, 1.0, vAlpha * edge);
    #include <colorspace_fragment>
  }
`;

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadBitmap(src: string) {
  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Portrait request failed: ${response.status}`);
  const blob = await response.blob();

  if (typeof createImageBitmap === "function") {
    return createImageBitmap(blob);
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = new window.Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Source = ImageBitmap | HTMLImageElement;

type Prepared = {
  imageWidth: number;
  imageHeight: number;
  transparentRatio: number;
  low: number;
  high: number;
  pixels: Uint8ClampedArray;
  sampleWidth: number;
  sampleHeight: number;
  cropWidth: number;
  cropHeight: number;
};

type BuiltPoints = {
  quality: QualityTier;
  target: number;
  eligible: number;
  step: number;
  count: number;
  positions: Float32Array;
  brightness: Float32Array;
  seeds: Float32Array;
  horizontal: Float32Array;
};

/**
 * Read the cutout once: alpha audit, crop sampling and auto-levels. The result
 * is reused for every density tier so switching quality never re-decodes the
 * PNG or re-measures the histogram.
 */
function prepareCrop(source: Source): Prepared {
  const imageWidth = source.width;
  const imageHeight = source.height;
  const sx = Math.round(imageWidth * CROP.x);
  const sy = Math.round(imageHeight * CROP.y);
  const sw = Math.round(imageWidth * CROP.width);
  const sh = Math.round(imageHeight * CROP.height);

  // 1. Full-image alpha audit: the cutout should be ~54% fully transparent.
  const auditWidth = 160;
  const auditHeight = Math.max(1, Math.round((auditWidth * imageHeight) / imageWidth));
  const audit = document.createElement("canvas");
  audit.width = auditWidth;
  audit.height = auditHeight;
  const auditContext = audit.getContext("2d", { willReadFrequently: true });
  let transparentRatio = 0;
  if (auditContext) {
    auditContext.clearRect(0, 0, auditWidth, auditHeight);
    auditContext.drawImage(source, 0, 0, auditWidth, auditHeight);
    const auditPixels = auditContext.getImageData(0, 0, auditWidth, auditHeight).data;
    let transparent = 0;
    for (let i = 3; i < auditPixels.length; i += 4) {
      if (auditPixels[i] === 0) transparent += 1;
    }
    transparentRatio = transparent / (auditWidth * auditHeight);
  }

  // 2. Draw only the crop we display, then read its alpha + luminance.
  const sampleHeight = Math.max(1, Math.round((SAMPLE_WIDTH * sh) / sw));
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_WIDTH;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Unable to read the portrait pixels");

  context.clearRect(0, 0, SAMPLE_WIDTH, sampleHeight);
  context.drawImage(source, sx, sy, sw, sh, 0, 0, SAMPLE_WIDTH, sampleHeight);
  const pixels = context.getImageData(0, 0, SAMPLE_WIDTH, sampleHeight).data;

  // 3. Auto-levels: find the 2nd/98th luminance percentile inside the mask.
  const histogram = new Uint32Array(256);
  let maskedSamples = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const luminance =
      (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) /
      255;
    histogram[Math.min(255, Math.max(0, Math.round(luminance * 255)))] += 1;
    maskedSamples += 1;
  }

  let lowBin = 0;
  let highBin = 255;
  if (maskedSamples > 0) {
    let accumulated = 0;
    for (let bin = 0; bin < 256; bin += 1) {
      accumulated += histogram[bin];
      if (accumulated / maskedSamples >= 0.02) {
        lowBin = bin;
        break;
      }
    }
    accumulated = 0;
    for (let bin = 255; bin >= 0; bin -= 1) {
      accumulated += histogram[bin];
      if (accumulated / maskedSamples >= 0.02) {
        highBin = bin;
        break;
      }
    }
  }

  let low = lowBin / 255;
  let high = highBin / 255;
  if (high - low < 0.15) {
    low = 0;
    high = 1;
  }

  return {
    imageWidth,
    imageHeight,
    transparentRatio,
    low,
    high,
    pixels,
    sampleWidth: SAMPLE_WIDTH,
    sampleHeight,
    cropWidth: sw,
    cropHeight: sh,
  };
}

/**
 * One point per masked sample. Alpha is the mask: A=0 never makes a point.
 * The grid stride is derived from the measured masked area so the result lands
 * on the requested tier count.
 */
function buildPoints(prepared: Prepared, quality: QualityTier): BuiltPoints {
  const { pixels, low, high, sampleWidth, sampleHeight } = prepared;
  const target = TIER_TARGETS[quality];
  const random = mulberry32(0x5a40f17);
  const positions: number[] = [];
  const brightness: number[] = [];
  const seeds: number[] = [];
  const horizontal: number[] = [];

  const luminanceAt = (offset: number) =>
    (0.2126 * pixels[offset] +
      0.7152 * pixels[offset + 1] +
      0.0722 * pixels[offset + 2]) /
    255;

  // Count every eligible pixel once, then derive the stride that lands on the
  // tier's target count. The mask and gamma rules stay identical.
  let eligible = 0;
  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const offset = (y * sampleWidth + x) * 4;
      if (pixels[offset + 3] < 128) continue;
      const normalized = Math.min(
        1,
        Math.max(0, (luminanceAt(offset) - low) / (high - low)),
      );
      if (normalized < 0.12) continue;
      eligible += 1;
    }
  }

  const step = Math.min(4, Math.max(1, Math.sqrt(eligible / target)));
  const halfStep = step / 2;

  for (let y = halfStep; y < sampleHeight; y += step) {
    for (let x = halfStep; x < sampleWidth; x += step) {
      const px = Math.min(sampleWidth - 1, Math.round(x));
      const py = Math.min(sampleHeight - 1, Math.round(y));
      const offset = (py * sampleWidth + px) * 4;
      const alpha = pixels[offset + 3];
      if (alpha < 128) continue;

      const luminance = luminanceAt(offset);
      const normalized = Math.min(1, Math.max(0, (luminance - low) / (high - low)));
      if (normalized < 0.12) continue;

      const lifted = Math.pow(normalized, 0.6);
      const jitterX = (random() - 0.5) * step;
      const jitterY = (random() - 0.5) * step;
      const u = Math.min(1, Math.max(0, (px + jitterX) / sampleWidth));
      const v = Math.min(1, Math.max(0, (py + jitterY) / sampleHeight));

      positions.push((u - 0.5) * 2 * SOURCE_ASPECT, (0.5 - v) * 2, 0);
      brightness.push(0.3 + lifted * 0.7);
      seeds.push(random());
      horizontal.push(u);
    }
  }

  return {
    quality,
    target,
    eligible,
    step,
    count: brightness.length,
    positions: new Float32Array(positions),
    brightness: new Float32Array(brightness),
    seeds: new Float32Array(seeds),
    horizontal: new Float32Array(horizontal),
  };
}

export default function ParticlePortrait() {
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
    let geometry: BufferGeometry | null = null;
    let material: ShaderMaterial | null = null;
    let source: Source | null = null;
    let prepared: Prepared | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let activeTier: QualityTier = getTier();
    let revealStart: number | null = hasEntered() ? performance.now() : null;
    const builtCache = new Map<QualityTier, BuiltPoints>();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pointerTarget = new Vector2(10, 10);
    const pointerCurrent = new Vector2(10, 10);

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointerTarget.set(nx * (rect.width / rect.height), ny);
    };

    // Park the scatter off-canvas when the pointer leaves, so the portrait
    // never keeps a stale dent after the cursor is gone.
    const releasePointer = () => pointerTarget.set(10, 10);
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) releasePointer();
    };

    const onEntered = () => {
      if (revealStart === null) revealStart = performance.now();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("blur", releasePointer);
    window.addEventListener(ENTERED_EVENT, onEntered);

    const applyTier = (next: QualityTier) => {
      if (!prepared || !geometry) return;
      let data = builtCache.get(next);
      if (!data) {
        data = buildPoints(prepared, next);
        builtCache.set(next, data);
      }
      geometry.setAttribute("position", new BufferAttribute(data.positions, 3));
      geometry.setAttribute("aBright", new BufferAttribute(data.brightness, 1));
      geometry.setAttribute("aSeed", new BufferAttribute(data.seeds, 1));
      geometry.setAttribute("aU", new BufferAttribute(data.horizontal, 1));

      if (process.env.NODE_ENV === "development") {
        console.info(
          `[portrait] ${next} tier · ${data.count} points (target ${data.target}) · step ${data.step.toFixed(2)} · alpha mask ${(prepared.transparentRatio * 100).toFixed(1)}% fully transparent · levels ${prepared.low.toFixed(2)}–${prepared.high.toFixed(2)} · gamma 0.6`,
        );
      }
    };

    const unsubscribeTier = subscribeTier((next) => {
      activeTier = next;
      applyTier(next);
    });

    const start = async () => {
      try {
        const test = document.createElement("canvas").getContext("webgl2") ??
          document.createElement("canvas").getContext("webgl");
        if (!test) throw new Error("WebGL unavailable");

        source = await loadBitmap(IMAGE_SRC);
        if (disposed) {
          if ("close" in source) source.close();
          return;
        }

        prepared = prepareCrop(source);
        if (disposed) return;

        if (process.env.NODE_ENV === "development" && prepared.transparentRatio < 0.3) {
          console.warn(
            "[portrait] The cutout looks opaque; alpha may not be a real mask.",
          );
        }

        geometry = new BufferGeometry();
        applyTier(activeTier);

        material = new ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
            uReveal: { value: reducedMotion ? 1.2 : -0.08 },
            uPointer: { value: pointerCurrent },
            uPointerRadius: { value: 0.4 },
            uFit: { value: new Vector2(1, 1) },
            uMotion: { value: reducedMotion ? 0 : 1 },
          },
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: AdditiveBlending,
        });

        renderer = new WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = SRGBColorSpace;

        const scene = new Scene();
        const camera = new OrthographicCamera(-SOURCE_ASPECT, SOURCE_ASPECT, 1, -1, 0.1, 10);
        camera.position.z = 2;

        const points = new Points(geometry, material);
        points.frustumCulled = false;
        scene.add(points);

        const renderFrame = (now: number) => {
          if (!renderer || !material) return;
          const elapsed = (now - mountedAt) / 1000;
          const vibesOff = document.documentElement.dataset.vibes === "off";
          const motion = reducedMotion || vibesOff ? 0 : 1;

          pointerCurrent.lerp(pointerTarget, 0.14);

          let reveal = 1.2;
          if (!reducedMotion && !vibesOff) {
            reveal =
              revealStart === null
                ? -0.08
                : -0.08 +
                  (1 - Math.pow(1 - Math.min(1, (now - revealStart) / 1500), 3)) *
                    1.2;
          }

          material.uniforms.uTime.value = elapsed;
          material.uniforms.uReveal.value = reveal;
          material.uniforms.uMotion.value = motion;
          material.uniforms.uPointer.value.copy(pointerCurrent);

          renderer.render(scene, camera);
        };

        const mountedAt = performance.now();

        const resize = () => {
          if (!renderer || !material) return;
          const width = host.clientWidth;
          const height = host.clientHeight;
          if (!width || !height) return;
          const aspect = width / height;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.setSize(width, height, false);
          camera.left = -aspect;
          camera.right = aspect;
          camera.top = 1;
          camera.bottom = -1;
          camera.updateProjectionMatrix();
          material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
          const scale = Math.min(1, aspect / SOURCE_ASPECT);
          material.uniforms.uFit.value.set(scale, scale);
          releasePointer();
          renderFrame(performance.now());
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        if (reducedMotion) {
          renderFrame(performance.now());
        } else {
          const loop = (now: number) => {
            frame = window.requestAnimationFrame(loop);
            if (document.hidden) return;
            renderFrame(now);
          };
          frame = window.requestAnimationFrame(loop);
        }

        setReady(true);
      } catch (error) {
        if (disposed) return;
        console.error("[portrait]", error);
        setFailed(true);
      }
    };

    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      unsubscribeTier();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", releasePointer);
      window.removeEventListener(ENTERED_EVENT, onEntered);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      if (source && "close" in source) source.close();
    };
  }, []);

  return (
    <div
      className="particle-portrait"
      ref={hostRef}
      data-ready={ready ? "true" : "false"}
      data-failed={failed ? "true" : "false"}
    >
      <canvas ref={canvasRef} className="particle-portrait__canvas" />
      {failed && (
        <Image
          src="/images/portrait-cutout.png"
          alt=""
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1180px) 62vw, 38vw"
          className="particle-portrait__fallback"
        />
      )}
    </div>
  );
}

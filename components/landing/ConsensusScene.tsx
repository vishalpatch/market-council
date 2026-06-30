"use client";

import { useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// One flat, solid gold — no layering.
const GOLD = new THREE.Color("#c8a45d");

const SPLIT = 0.8; // scroll fraction before ribbons hook inward to flank the CTA
const GUT_SEG = 120;
const CONV_SEG = 48;

// Layout dials (fractions):
const GUTTER_X = 0.9; // how far toward the edge the vertical run sits (× halfW)
const TOP_Y = 0.74; // where the ribbon starts, below the nav bar (× halfH)
const BAND_W = 0.05; // ribbon thickness (× halfH)
const BUTTON_Y = -0.28; // vertical level of the "Get Started" button at full scroll (× halfH)
const FLANK_X = 0.3; // horizontal distance of each tip from center (× halfH)

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * One ribbon for a side (-1 left, +1 right), in world units at z = 0.
 * vertical: a perfectly straight vertical run down the margin (starts below the nav).
 * horizontal: a straight inward run at the button's height → sharp 90° corner.
 *
 * The vertical is extended half a band-width past the elbow (to buttonY - w/2) so it
 * fully fills the corner square; the horizontal then overlaps into it for a seamless joint.
 */
function buildRibbon(side: number, halfW: number, halfH: number) {
  const x = side * halfW * GUTTER_X;
  const topY = halfH * TOP_Y;
  const buttonY = halfH * BUTTON_Y;
  const flankX = side * halfH * FLANK_X;
  const half = (halfH * BAND_W) / 2;

  const vertical = new THREE.LineCurve3(
    new THREE.Vector3(x, topY, 0),
    new THREE.Vector3(x, buttonY - half, 0)
  );
  const horizontal = new THREE.LineCurve3(
    new THREE.Vector3(x, buttonY, 0),
    new THREE.Vector3(flankX, buttonY, 0)
  );
  return { vertical, horizontal };
}

/** Flat ribbon-band geometry: width extruded perpendicular to the curve in XY. */
function makeBand(curve: THREE.Curve<THREE.Vector3>, segs: number, width: number) {
  const positions = new Float32Array((segs + 1) * 2 * 3);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const nx = -tan.y;
    const ny = tan.x;
    const len = Math.hypot(nx, ny) || 1;
    const ox = (nx / len) * (width / 2);
    const oy = (ny / len) * (width / 2);
    const vi = i * 6;
    positions[vi] = p.x + ox;
    positions[vi + 1] = p.y + oy;
    positions[vi + 2] = 0;
    positions[vi + 3] = p.x - ox;
    positions[vi + 4] = p.y - oy;
    positions[vi + 5] = 0;
  }
  const indices: number[] = [];
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  return geo;
}

function setBandRange(geo: THREE.BufferGeometry, f: number) {
  const total = geo.index ? geo.index.count : 0;
  geo.setDrawRange(0, Math.floor((total * f) / 6) * 6);
}

function Scene({ progressRef }: { progressRef: { current: number } }) {
  const { viewport } = useThree();

  const halfW = viewport.width / 2;
  const halfH = viewport.height / 2;

  const ribbons = useMemo(() => {
    return [-1, 1].map((side) => {
      const { vertical, horizontal } = buildRibbon(side, halfW, halfH);
      return {
        gut: makeBand(vertical, GUT_SEG, halfH * BAND_W),
        conv: makeBand(horizontal, CONV_SEG, halfH * BAND_W),
      };
    });
  }, [halfW, halfH]);

  // One flat solid gold material, uniform brightness, no layering.
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: GOLD, toneMapped: false }),
    []
  );

  useFrame(() => {
    const p = clamp(progressRef.current, 0, 1);
    const d1 = clamp(p / SPLIT, 0, 1);
    const d2 = clamp((p - SPLIT) / (1 - SPLIT), 0, 1);
    ribbons.forEach((r) => {
      setBandRange(r.gut, d1);
      setBandRange(r.conv, d2);
    });
  });

  return (
    <group>
      {ribbons.map((r, ri) => (
        <group key={ri}>
          <mesh geometry={r.gut} material={mat} />
          <mesh geometry={r.conv} material={mat} />
        </group>
      ))}
    </group>
  );
}

export default function ConsensusScene({
  progressRef,
}: {
  progressRef: { current: number };
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
    >
      <Scene progressRef={progressRef} />
    </Canvas>
  );
}

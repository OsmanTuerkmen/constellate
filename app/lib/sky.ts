/** The precomputed star map (public/world/sky.json, format constellate-sky/1, built by scripts/build-sky.mjs). */
export interface Sky {
  ids: string[];
  labels: string[];
  /** 0 disease with edges · 1 disease without mapped neighbour · 2 core gene · 3 background gene · 4 symptom */
  kind: number[];
  degree: number[];
  cluster: number[];
  /** flat x, y, z per star in 1/10 units of a sky with radius ~100 */
  pos: number[];
  /** flat [source, target, code] */
  edges: number[];
  clusters: { id: number; size: number; hub: number }[];
}

const RADIUS = 140; // a little more than the outermost star, so the sky fits the canvas
const FOCAL = 320;

/**
 * Screen positions after turning the sky by `angle` around its vertical axis, with a gentle perspective.
 * Returns [x0, y0, x1, y1, …] in canvas pixels; the sky is centred and fills the shorter side.
 */
export function project(sky: Sky, angle: number, width: number, height: number): Float32Array {
  const n = sky.ids.length;
  const out = new Float32Array(2 * n);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const fit = Math.min(width, height) / (2 * RADIUS);
  for (let i = 0; i < n; i++) {
    const x = sky.pos[3 * i] / 10;
    const y = sky.pos[3 * i + 1] / 10;
    const z = sky.pos[3 * i + 2] / 10;
    const rx = x * cos + z * sin;
    const rz = -x * sin + z * cos;
    const scale = FOCAL / (FOCAL + rz);
    out[2 * i] = width / 2 + rx * scale * fit;
    out[2 * i + 1] = height / 2 + y * scale * fit;
  }
  return out;
}

/** Depth after the same turn (larger = further away), for dimming the back of the sky. */
export function depth(sky: Sky, angle: number, i: number): number {
  return (-(sky.pos[3 * i] / 10) * Math.sin(angle) + (sky.pos[3 * i + 2] / 10) * Math.cos(angle)) / RADIUS;
}

/** Star indices for node ids (search hits light up). */
export function matchStars(sky: Sky, ids: string[]): number[] {
  if (!ids.length) return [];
  const wanted = new Set(ids);
  const out: number[] = [];
  sky.ids.forEach((id, i) => {
    if (wanted.has(id)) out.push(i);
  });
  return out;
}

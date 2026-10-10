"use client";

import { useEffect, useRef, useState } from "react";
import { depth, matchStars, project, type Sky } from "@/lib/sky";

const SPEED = 0.02; // radians per second: one turn in about five minutes

function readColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim() || "#888";
  return { disease: v("--n-neighbour"), gene: v("--n-gene"), symptom: v("--n-phenotype"), focus: v("--focus"), line: v("--line-strong"), dust: v("--ink-2") };
}

/** The whole dataset as a slowly turning star field; search hits light up in gold. Decoration: hidden from screen readers. */
export default function SkyCanvas({ highlight }: { highlight: string[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sky, setSky] = useState<Sky | null>(null);
  const lit = useRef<number[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/world/sky.json")
      .then((r) => (r.ok ? (r.json() as Promise<Sky>) : null))
      .then((s) => alive && s && setSky(s))
      .catch(() => undefined); // no sky: the gradient background stays
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    lit.current = sky ? matchStars(sky, highlight) : [];
  }, [sky, highlight]);

  useEffect(() => {
    if (!sky || !canvas.current || !wrap.current) return;
    const el = canvas.current;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let colors = readColors();
    const themeObserver = new MutationObserver(() => (colors = readColors()));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = wrap.current!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(wrap.current);

    // the sky is a little larger than the screen, so it reads as a field rather than a ball
    const scaleUp = 1.35;
    let angle = 0.6;
    let last = performance.now();
    let frame = 0;

    const draw = () => {
      const w = width * scaleUp;
      const h = height * scaleUp;
      const pts = project(sky, angle, w, h);
      const ox = (width - w) / 2;
      const oy = (height - h) / 2;
      ctx.clearRect(0, 0, width, height);

      // constellation lines between connected core nodes, very faint
      ctx.strokeStyle = colors.line;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let k = 0; k < sky.edges.length; k += 3) {
        const a = sky.edges[k];
        const b = sky.edges[k + 1];
        ctx.moveTo(pts[2 * a] + ox, pts[2 * a + 1] + oy);
        ctx.lineTo(pts[2 * b] + ox, pts[2 * b + 1] + oy);
      }
      ctx.stroke();

      for (let i = 0; i < sky.ids.length; i++) {
        const kind = sky.kind[i];
        const d = depth(sky, angle, i); // -1 near … +1 far
        const near = 1 - (d + 1) / 2;
        let r = 0.7;
        let color = colors.symptom;
        let alpha = 0.25 + 0.35 * near;
        if (kind === 0) {
          r = 1.1 + Math.min(Math.log2(1 + sky.degree[i]) * 0.35, 2);
          color = colors.disease;
          alpha = 0.45 + 0.5 * near;
        } else if (kind === 1) {
          color = colors.dust;
          alpha = 0.2 + 0.2 * near;
        } else if (kind === 2) {
          r = 1.2;
          color = colors.gene;
          alpha = 0.45 + 0.45 * near;
        } else if (kind === 3) {
          color = colors.gene;
          alpha = 0.15 + 0.2 * near;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pts[2 * i] + ox, pts[2 * i + 1] + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const i of lit.current) {
        const x = pts[2 * i] + ox;
        const y = pts[2 * i + 1] + oy;
        ctx.globalAlpha = 1;
        ctx.shadowColor = colors.focus;
        ctx.shadowBlur = 16;
        ctx.fillStyle = colors.focus;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = colors.focus;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!document.hidden) {
        angle += dt * SPEED;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    if (still) {
      draw();
      // highlights still need a redraw when the query changes
      const redraw = window.setInterval(draw, 250);
      return () => {
        window.clearInterval(redraw);
        sizeObserver.disconnect();
        themeObserver.disconnect();
      };
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, [sky]);

  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden" data-testid="sky" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--n-neighbour)_10%,transparent),transparent_70%)]" />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

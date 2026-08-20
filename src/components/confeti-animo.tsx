import { useEffect, useRef } from "react";

const COLORES = [
  "#2f5d4a",
  "#8a4b22",
  "#eab308",
  "#e11d48",
  "#1d4ed8",
  "#7c3aed",
  "#0891b2",
];

type Pieza = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
};

export function ConfetiAnimo({
  titulo,
  texto,
  detalle,
  onCerrar,
}: {
  titulo: string;
  texto: string;
  detalle?: string;
  onCerrar: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reducir =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducir) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let ancho = 0;
    let alto = 0;
    const piezas: Pieza[] = [];
    let raf = 0;
    let vivo = true;

    function medir() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = window.innerWidth;
      alto = window.innerHeight;
      canvas!.width = Math.floor(ancho * dpr);
      canvas!.height = Math.floor(alto * dpr);
      canvas!.style.width = `${ancho}px`;
      canvas!.style.height = `${alto}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function sembrar() {
      piezas.length = 0;
      const n = Math.min(110, Math.floor(ancho / 8));
      for (let i = 0; i < n; i++) {
        piezas.push({
          x: Math.random() * ancho,
          y: -20 - Math.random() * alto * 0.4,
          vx: -2.2 + Math.random() * 4.4,
          vy: 3 + Math.random() * 5,
          rot: Math.random() * Math.PI,
          vr: -0.25 + Math.random() * 0.5,
          w: 5 + Math.random() * 7,
          h: 8 + Math.random() * 10,
          color: COLORES[i % COLORES.length]!,
        });
      }
    }

    function tick() {
      if (!vivo || !ctx) return;
      ctx.clearRect(0, 0, ancho, alto);
      for (const p of piezas) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf = window.requestAnimationFrame(tick);
    }

    medir();
    sembrar();
    tick();
    window.addEventListener("resize", medir);
    return () => {
      vivo = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", medir);
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(onCerrar, 2800);
    return () => window.clearTimeout(id);
  }, [titulo, texto]);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-ink/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="animo-titulo"
      onClick={onCerrar}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="relative w-full max-w-sm rounded-xl border border-line bg-surface px-6 py-8 text-center shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="animo-titulo"
          className="font-display text-3xl font-semibold"
        >
          {titulo}
        </p>
        {detalle && (
          <p className="mt-2 text-sm font-medium text-accent">{detalle}</p>
        )}
        <p className="mt-3 text-sm text-muted">{texto}</p>
        <button
          type="button"
          onClick={onCerrar}
          className="mt-6 h-11 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
        >
          Seguir
        </button>
      </div>
    </div>
  );
}

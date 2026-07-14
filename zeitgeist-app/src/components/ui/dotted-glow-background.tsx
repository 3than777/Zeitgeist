"use client";

import React, { useEffect, useRef, useState } from "react";

type DottedGlowBackgroundProps = {
  className?: string;
  /** distance between dot centers in pixels */
  gap?: number;
  /** base radius of each dot in CSS px */
  radius?: number;
  /** dot color (will pulse by alpha) */
  color?: string;
  /** optional dot color for dark mode */
  darkColor?: string;
  /** shadow/glow color for bright dots */
  glowColor?: string;
  /** optional glow color for dark mode */
  darkGlowColor?: string;
  /** optional CSS variable name for light dot color (e.g. --color-zinc-900) */
  colorLightVar?: string;
  /** optional CSS variable name for dark dot color (e.g. --color-zinc-100) */
  colorDarkVar?: string;
  /** optional CSS variable name for light glow color */
  glowColorLightVar?: string;
  /** optional CSS variable name for dark glow color */
  glowColorDarkVar?: string;
  /** global opacity for the whole layer */
  opacity?: number;
  /** background radial fade opacity (0 = transparent background) */
  backgroundOpacity?: number;
  /** minimum per-dot speed in rad/s */
  speedMin?: number;
  /** maximum per-dot speed in rad/s */
  speedMax?: number;
  /** global speed multiplier for all dots */
  speedScale?: number;
};

/**
 * Canvas-based dotted background that randomly glows and dims.
 * - Uses a stable grid of dots.
 * - Each dot gets its own phase + speed producing organic shimmering.
 * - Handles high-DPI and resizes via ResizeObserver.
 * - Dots are blitted from prerendered sprites (per brightness level) instead
 *   of per-dot arc fills with shadowBlur, and the loop pauses off-screen.
 */
export function DottedGlowBackground({
  className,
  gap = 12,
  radius = 2,
  color = "rgba(0,0,0,0.7)",
  darkColor,
  glowColor = "rgba(0, 170, 255, 0.85)",
  darkGlowColor,
  colorLightVar,
  colorDarkVar,
  glowColorLightVar,
  glowColorDarkVar,
  opacity = 0.6,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.3,
  speedScale = 1,
}: DottedGlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [resolvedColor, setResolvedColor] = useState<string>(color);
  const [resolvedGlowColor, setResolvedGlowColor] = useState<string>(glowColor);

  // Resolve CSS variable value from the container or root
  const resolveCssVariable = (
    el: Element,
    variableName?: string,
  ): string | null => {
    if (!variableName) return null;
    const normalized = variableName.startsWith("--")
      ? variableName
      : `--${variableName}`;
    const fromEl = getComputedStyle(el as Element)
      .getPropertyValue(normalized)
      .trim();
    if (fromEl) return fromEl;
    const root = document.documentElement;
    const fromRoot = getComputedStyle(root).getPropertyValue(normalized).trim();
    return fromRoot || null;
  };

  const detectDarkMode = (): boolean => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  };

  // Keep resolved colors in sync with theme changes and prop updates
  useEffect(() => {
    const container = containerRef.current ?? document.documentElement;

    const compute = () => {
      const isDark = detectDarkMode();

      let nextColor: string = color;
      let nextGlow: string = glowColor;

      if (isDark) {
        const varDot = resolveCssVariable(container, colorDarkVar);
        const varGlow = resolveCssVariable(container, glowColorDarkVar);
        nextColor = varDot || darkColor || nextColor;
        nextGlow = varGlow || darkGlowColor || nextGlow;
      } else {
        const varDot = resolveCssVariable(container, colorLightVar);
        const varGlow = resolveCssVariable(container, glowColorLightVar);
        nextColor = varDot || nextColor;
        nextGlow = varGlow || nextGlow;
      }

      setResolvedColor(nextColor);
      setResolvedGlowColor(nextGlow);
    };

    compute();

    const mql = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    const handleMql = () => compute();
    mql?.addEventListener?.("change", handleMql);

    const mo = new MutationObserver(() => compute());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      mql?.removeEventListener?.("change", handleMql);
      mo.disconnect();
    };
  }, [
    color,
    darkColor,
    glowColor,
    darkGlowColor,
    colorLightVar,
    colorDarkVar,
    glowColorLightVar,
    glowColorDarkVar,
  ]);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let stopped = false;
    let visible = true;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    let viewWidth = 0;
    let viewHeight = 0;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      viewWidth = width;
      viewHeight = height;
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${Math.floor(width)}px`;
      el.style.height = `${Math.floor(height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(() => {
      resize();
      regenDots();
    });
    ro.observe(container);
    resize();

    // Prerender one sprite per quantized brightness level so the frame loop
    // is pure drawImage calls — per-dot shadowBlur is far too slow.
    const SPRITE_LEVELS = 32;
    const spritePad = 8; // room for the glow blur
    const spriteSize = (radius + spritePad) * 2;
    const sprites: HTMLCanvasElement[] = [];

    const buildSprites = () => {
      sprites.length = 0;
      for (let i = 0; i < SPRITE_LEVELS; i++) {
        const lin = i / (SPRITE_LEVELS - 1);
        const a = 0.25 + 0.55 * lin; // 0.25..0.8 linearly
        const sprite = document.createElement("canvas");
        sprite.width = Math.max(1, Math.ceil(spriteSize * dpr));
        sprite.height = sprite.width;
        const sctx = sprite.getContext("2d");
        if (!sctx) continue;
        sctx.scale(dpr, dpr);
        if (a > 0.6) {
          const glow = (a - 0.6) / 0.4; // 0..1
          sctx.shadowColor = resolvedGlowColor;
          sctx.shadowBlur = 6 * glow * dpr;
        }
        sctx.globalAlpha = a * opacity;
        sctx.fillStyle = resolvedColor;
        sctx.beginPath();
        sctx.arc(spriteSize / 2, spriteSize / 2, radius, 0, Math.PI * 2);
        sctx.fill();
        sprites.push(sprite);
      }
    };

    buildSprites();

    // Precompute dot metadata for a medium-sized grid and regenerate on resize
    let dots: { x: number; y: number; phase: number; speed: number }[] = [];

    const regenDots = () => {
      dots = [];
      const cols = Math.ceil(viewWidth / gap) + 2;
      const rows = Math.ceil(viewHeight / gap) + 2;
      const min = Math.min(speedMin, speedMax);
      const max = Math.max(speedMin, speedMax);
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5); // offset every other row
          const y = j * gap;
          // Randomize phase and speed slightly per dot
          const phase = Math.random() * Math.PI * 2;
          const span = Math.max(max - min, 0);
          const speed = min + Math.random() * span; // configurable rad/s
          dots.push({ x, y, phase, speed });
        }
      }
    };

    regenDots();

    const draw = (now: number) => {
      if (stopped || !visible) {
        running = false;
        return;
      }

      ctx.clearRect(0, 0, viewWidth, viewHeight);

      // optional subtle background fade for depth (defaults to 0 = transparent)
      if (backgroundOpacity > 0) {
        const grad = ctx.createRadialGradient(
          viewWidth * 0.5,
          viewHeight * 0.4,
          Math.min(viewWidth, viewHeight) * 0.1,
          viewWidth * 0.5,
          viewHeight * 0.5,
          Math.max(viewWidth, viewHeight) * 0.7,
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(
          1,
          `rgba(0,0,0,${Math.min(Math.max(backgroundOpacity, 0), 1)})`,
        );
        ctx.globalAlpha = opacity;
        ctx.fillStyle = grad as unknown as CanvasGradient;
        ctx.fillRect(0, 0, viewWidth, viewHeight);
        ctx.globalAlpha = 1;
      }

      // animate dots (brightness is baked into the sprites)
      const time = (now / 1000) * Math.max(speedScale, 0);
      const half = spriteSize / 2;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // Linear triangle wave 0..1..0 for linear glow/dim
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod; // 0..1..0
        const idx = Math.min(SPRITE_LEVELS - 1, (lin * SPRITE_LEVELS) | 0);
        const sprite = sprites[idx];
        if (!sprite) continue;
        ctx.drawImage(sprite, d.x - half, d.y - half, spriteSize, spriteSize);
      }

      raf = requestAnimationFrame(draw);
    };

    const startLoop = () => {
      if (running || stopped || !visible) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };

    // Nothing renders while the section is scrolled out of the viewport.
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) {
        startLoop();
      }
    });
    io.observe(container);

    const handleResize = () => {
      resize();
      regenDots();
    };

    window.addEventListener("resize", handleResize);
    startLoop();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      io.disconnect();
    };
  }, [
    gap,
    radius,
    resolvedColor,
    resolvedGlowColor,
    opacity,
    backgroundOpacity,
    speedMin,
    speedMax,
    speedScale,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default DottedGlowBackground;

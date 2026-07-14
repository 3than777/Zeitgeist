"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

interface ShootingStar {
  x: number;
  y: number;
  angle: number;
  scale: number;
  speed: number;
  distance: number;
  el: SVGRectElement;
}

interface ShootingStarsProps {
  minSpeed?: number;
  maxSpeed?: number;
  minDelay?: number;
  maxDelay?: number;
  starColor?: string;
  trailColor?: string;
  starWidth?: number;
  starHeight?: number;
  className?: string;
}

const getRandomStartPoint = () => {
  const side = Math.floor(Math.random() * 4);
  const offset = Math.random() * window.innerWidth;

  switch (side) {
    case 0:
      return { x: offset, y: 0, angle: 45 };
    case 1:
      return { x: window.innerWidth, y: offset, angle: 135 };
    case 2:
      return { x: offset, y: window.innerHeight, angle: 225 };
    case 3:
      return { x: 0, y: offset, angle: 315 };
    default:
      return { x: 0, y: 0, angle: 45 };
  }
};

export const ShootingStars: React.FC<ShootingStarsProps> = ({
  minSpeed = 15,
  maxSpeed = 45,
  minDelay = 300,
  maxDelay = 900,
  starColor = "#9E00FF",
  trailColor = "#2EB9DF",
  starWidth = 10,
  starHeight = 1,
  className,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Stars are animated imperatively on the SVG so a moving star never
  // triggers a React re-render.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const stars: ShootingStar[] = [];
    let rafId: number | null = null;
    let spawnTimeout: ReturnType<typeof setTimeout> | null = null;
    let visible = true;
    let stopped = false;

    const startLoop = () => {
      if (rafId === null && visible && stars.length > 0) {
        rafId = requestAnimationFrame(moveStars);
      }
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const moveStars = () => {
      rafId = null;
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.x += star.speed * Math.cos((star.angle * Math.PI) / 180);
        star.y += star.speed * Math.sin((star.angle * Math.PI) / 180);
        star.distance += star.speed;
        star.scale = 1 + star.distance / 80;

        if (
          star.x < -50 ||
          star.x > window.innerWidth + 50 ||
          star.y < -50 ||
          star.y > window.innerHeight + 50
        ) {
          star.el.remove();
          stars.splice(i, 1);
          continue;
        }

        const width = starWidth * star.scale;
        star.el.setAttribute("x", String(star.x));
        star.el.setAttribute("y", String(star.y));
        star.el.setAttribute("width", String(width));
        star.el.setAttribute(
          "transform",
          `rotate(${star.angle}, ${star.x + width / 2}, ${
            star.y + starHeight / 2
          })`,
        );
      }
      startLoop();
    };

    const createStar = () => {
      if (stopped) return;
      if (visible) {
        const { x, y, angle } = getRandomStartPoint();
        const el = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        el.setAttribute("fill", "url(#gradient)");
        el.setAttribute("height", String(starHeight));
        svg.appendChild(el);
        stars.push({
          x,
          y,
          angle,
          scale: 1,
          speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
          distance: 0,
          el,
        });
        startLoop();
      }

      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      spawnTimeout = setTimeout(createStar, randomDelay);
    };

    // No new stars and no movement while the sky is scrolled off-screen.
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) {
        startLoop();
      } else {
        stopLoop();
      }
    });
    io.observe(svg);

    createStar();

    return () => {
      stopped = true;
      if (spawnTimeout) clearTimeout(spawnTimeout);
      stopLoop();
      io.disconnect();
      for (const star of stars) star.el.remove();
      stars.length = 0;
    };
  }, [minSpeed, maxSpeed, minDelay, maxDelay, starWidth, starHeight]);

  return (
    <svg
      ref={svgRef}
      className={cn("w-full h-full absolute inset-0", className)}
    >
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop
            offset="100%"
            style={{ stopColor: starColor, stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
    </svg>
  );
};

"use client";
import React from "react";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { PixelatedCanvas } from "@/components/ui/pixelated-canvas";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
export function ShootingStarsAndStarsBackgroundDemo() {
  return (
    <div className="h-[40rem] rounded-md flex flex-col items-center justify-center relative w-full overflow-hidden">
      <PixelatedCanvas
        src="/hero-night-sky.jpg"
        width={2560}
        height={640}
        cellSize={3}
        dotScale={0.9}
        shape="square"
        backgroundColor="#000000"
        dropoutStrength={0.25}
        interactive
        distortionStrength={6}
        distortionRadius={60}
        distortionMode="repel"
        followSpeed={0.15}
        jitterStrength={6}
        jitterSpeed={3}
        sampleAverage
        tintColor="#FFFFFF"
        tintStrength={0}
        responsive
        objectFit="cover"
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto min-w-full"
      />
      <div className="absolute inset-0 z-5 pointer-events-none">
        <ShootingStars />
        <StarsBackground />
      </div>
      <div className="relative z-10 text-4xl md:text-7xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-white pointer-events-none">
        <div className="inline-block">
          Zeitgeist: The{" "}
          <ContainerTextFlip words={["Better", "Smarter", "Advanced", "Modern"]} />
        </div>
        <br />
        <div className="inline-block">Finance Software</div>
      </div>
      <div className="relative z-10 mt-8 flex justify-center pointer-events-auto">
        <HoverBorderGradient
          containerClassName="rounded-full"
          as="button"
          className="text-white"
        >
          Get Started
        </HoverBorderGradient>
      </div>
    </div>
  );
}
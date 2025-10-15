"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 3,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  }
> & React.HTMLAttributes<HTMLElement>) {
  const [hovered, setHovered] = useState<boolean>(false);

  return React.createElement(
    Tag,
    {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      className: cn(
        "relative rounded-full p-[2px] overflow-hidden bg-transparent",
        containerClassName
      ),
      ...props,
    },
    React.createElement(motion.div, {
      className: "absolute inset-0 rounded-full",
      style: {
        background: "conic-gradient(from 0deg, #3275F8, #00d4ff, #3275F8, #00d4ff, #3275F8)",
        opacity: hovered ? 1 : 0,
      },
      animate: hovered ? {
        rotate: [0, clockwise ? 360 : -360],
      } : {},
      transition: hovered ? {
        duration: duration,
        repeat: Infinity,
        ease: "linear",
        repeatType: "loop",
      } : {
        duration: 0.3,
        ease: "easeOut",
      },
      initial: { rotate: 0 },
    }),
    React.createElement(
      "div",
      {
        className: cn(
          "relative z-10 rounded-full px-6 py-3 text-white flex items-center justify-center bg-black",
          hovered ? "" : "border border-white/20",
          className
        ),
      },
      children
    )
  );
}
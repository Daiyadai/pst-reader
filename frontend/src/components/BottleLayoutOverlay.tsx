"use client";

/**
 * Reusable visual template: a 4:3 dashed frame containing two outlined bottles
 * (left = purple "before", right = green "after") side by side.
 *
 * Two presentations driven by `variant`:
 *   - "template": solid card showing the ideal layout. Used in the upload
 *                 drop-zone before a file is selected.
 *   - "overlay":  semi-transparent floating layer used on top of the cropper
 *                 so users can align their bottles to the dashed positions.
 */

interface Props {
  variant: "template" | "overlay";
  className?: string;
}

export default function BottleLayoutOverlay({ variant, className = "" }: Props) {
  const isOverlay = variant === "overlay";

  // Color choices match PhotoGuidelines.tsx for consistency.
  const purple = "#a78bfa";
  const green = "#86efac";
  const stroke = isOverlay ? "#ffffff" : "#94a3b8";
  const strokeOpacity = isOverlay ? 0.85 : 1;
  const fillOpacity = isOverlay ? 0.25 : 0.7;

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid meet"
      className={`w-full h-full ${className}`}
      role="img"
      aria-hidden="true"
    >
      {/* 4:3 dashed frame */}
      <rect
        x="6"
        y="6"
        width="388"
        height="288"
        rx="10"
        fill="none"
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={isOverlay ? 2.5 : 2}
        strokeDasharray="10 7"
      />

      {/* Left bottle (purple) */}
      <BottleOutline
        x={108}
        cy={150}
        height={210}
        width={50}
        liquidFill={purple}
        liquidOpacity={fillOpacity}
        outlineStroke={stroke}
        outlineOpacity={strokeOpacity}
      />

      {/* Right bottle (green) */}
      <BottleOutline
        x={242}
        cy={150}
        height={210}
        width={50}
        liquidFill={green}
        liquidOpacity={fillOpacity}
        outlineStroke={stroke}
        outlineOpacity={strokeOpacity}
      />

      {/* Surface line */}
      <line
        x1="40"
        y1="270"
        x2="360"
        y2="270"
        stroke={stroke}
        strokeOpacity={strokeOpacity * 0.5}
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
    </svg>
  );
}

function BottleOutline({
  x,
  cy,
  width,
  height,
  liquidFill,
  liquidOpacity,
  outlineStroke,
  outlineOpacity,
}: {
  x: number;       // left edge
  cy: number;      // vertical center of bottle
  width: number;
  height: number;
  liquidFill: string;
  liquidOpacity: number;
  outlineStroke: string;
  outlineOpacity: number;
}) {
  const top = cy - height / 2;
  const bottom = cy + height / 2;
  const liquidTop = top + height * 0.32; // fill ~68% from top of bottle
  return (
    <g>
      {/* Bottle body (rectangle with rounded bottom) */}
      <rect
        x={x}
        y={top}
        width={width}
        height={height}
        rx={6}
        fill="none"
        stroke={outlineStroke}
        strokeOpacity={outlineOpacity}
        strokeWidth="2"
        strokeDasharray="6 5"
      />
      {/* Liquid */}
      <rect
        x={x + 3}
        y={liquidTop}
        width={width - 6}
        height={bottom - liquidTop - 4}
        rx={3}
        fill={liquidFill}
        opacity={liquidOpacity}
      />
      {/* Cap */}
      <rect
        x={x + width * 0.15}
        y={top - 8}
        width={width * 0.7}
        height={10}
        rx={2}
        fill="none"
        stroke={outlineStroke}
        strokeOpacity={outlineOpacity}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </g>
  );
}

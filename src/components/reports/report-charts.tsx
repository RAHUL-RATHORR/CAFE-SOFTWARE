"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReportChartPoint } from "@/types/report";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "#0ea5e9",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
];

type ChartProps = {
  points: ReportChartPoint[];
  className?: string;
  height?: number;
};

export function ReportBarChart({ points, className, height = 220 }: ChartProps) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <div className="flex h-full items-end gap-2">
        {points.map((point, index) => (
          <div key={`${point.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(point.value / max) * 100}%` }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              className="w-full max-w-10 rounded-t-lg"
              style={{ background: COLORS[index % COLORS.length], minHeight: point.value > 0 ? 4 : 0 }}
              title={`${point.label}: ${point.value}`}
            />
            <span className="w-full truncate text-center text-[10px] text-muted-foreground">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportLineChart({ points, className, height = 220 }: ChartProps) {
  const width = 400;
  const chartHeight = height - 24;
  const max = Math.max(...points.map((point) => point.value), 1);
  const coords = points.map((point, index) => {
    const x =
      points.length <= 1
        ? width / 2
        : (index / (points.length - 1)) * (width - 16) + 8;
    const y = chartHeight - (point.value / max) * (chartHeight - 16) - 8;
    return { x, y, ...point };
  });
  const path = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Line chart"
    >
      <motion.path
        d={path || `M 0 ${chartHeight}`}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      {coords.map((point, index) => (
        <motion.circle
          key={`${point.label}-${index}`}
          cx={point.x}
          cy={point.y}
          r="3.5"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 * index }}
        />
      ))}
    </svg>
  );
}

export function ReportAreaChart({ points, className, height = 220 }: ChartProps) {
  const width = 400;
  const chartHeight = height - 24;
  const max = Math.max(...points.map((point) => point.value), 1);
  const coords = points.map((point, index) => {
    const x =
      points.length <= 1
        ? width / 2
        : (index / (points.length - 1)) * (width - 16) + 8;
    const y = chartHeight - (point.value / max) * (chartHeight - 16) - 8;
    return { x, y };
  });
  const line = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const area =
    coords.length > 0
      ? `${line} L ${coords[coords.length - 1]!.x} ${chartHeight} L ${coords[0]!.x} ${chartHeight} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Area chart"
    >
      <motion.path
        d={area}
        fill="hsl(var(--primary) / 0.18)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <path
        d={line || `M 0 ${chartHeight}`}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />
    </svg>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function ReportPieChart({
  points,
  className,
  donut = false,
}: ChartProps & { donut?: boolean }) {
  const total = points.reduce((sum, point) => sum + point.value, 0) || 1;
  let angle = 0;
  const slices = points.map((point, index) => {
    const sweep = (point.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return {
      ...point,
      start,
      end: Math.min(end, 359.9),
      color: COLORS[index % COLORS.length],
    };
  });

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <svg viewBox="0 0 160 160" className="mx-auto size-40" role="img">
        {slices.map((slice, index) => (
          <motion.path
            key={`${slice.label}-${index}`}
            d={`${describeArc(80, 80, 60, slice.start, slice.end)} L 80 80 Z`}
            fill={slice.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
        {donut ? (
          <circle cx="80" cy="80" r="32" className="fill-card" />
        ) : null}
      </svg>
      <ul className="space-y-1.5 text-xs">
        {slices.map((slice, index) => (
          <li key={`${slice.label}-${index}`} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: slice.color }}
            />
            <span className="text-muted-foreground">{slice.label}</span>
            <span className="ml-auto font-medium tabular-nums">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportDonutChart(props: ChartProps) {
  return <ReportPieChart {...props} donut />;
}

export function ReportChart({
  type,
  points,
  className,
}: {
  type: "line" | "bar" | "area" | "pie" | "donut";
  points: ReportChartPoint[];
  className?: string;
}) {
  if (!points.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No chart data for this range.
      </p>
    );
  }

  if (type === "line") return <ReportLineChart points={points} className={className} />;
  if (type === "area") return <ReportAreaChart points={points} className={className} />;
  if (type === "pie") return <ReportPieChart points={points} className={className} />;
  if (type === "donut") return <ReportDonutChart points={points} className={className} />;
  return <ReportBarChart points={points} className={className} />;
}

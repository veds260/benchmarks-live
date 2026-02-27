"use client";

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-bg-tertiary rounded" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // Determine color based on trend
  const trend = data[data.length - 1] - data[0];
  const strokeColor = color || (trend >= 0 ? "#06D6A0" : "#EF6461");

  return (
    <svg width={width} height={height} className="inline-block">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

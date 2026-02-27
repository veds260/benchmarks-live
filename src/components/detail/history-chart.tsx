"use client";

import { useEffect, useRef } from "react";
import { ScoreHistory } from "@/lib/types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export function HistoryChart({ history }: { history: ScoreHistory[] }) {
  const chartRef = useRef(null);
  const sorted = [...history].reverse();

  const labels = sorted.map((h) => {
    const d = new Date(h.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Composite",
        data: sorted.map((h) => h.score_composite),
        borderColor: "#06D6A0",
        backgroundColor: "rgba(6, 214, 160, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: "Quality",
        data: sorted.map((h) => h.score_quality),
        borderColor: "#48BFE3",
        backgroundColor: "transparent",
        tension: 0.3,
        pointRadius: 0,
        borderDash: [5, 5],
      },
      {
        label: "Popularity",
        data: sorted.map((h) => h.score_popularity),
        borderColor: "#8E95A3",
        backgroundColor: "transparent",
        tension: 0.3,
        pointRadius: 0,
        borderDash: [5, 5],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#8E95A3",
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: "#151820",
        titleColor: "#E8ECF1",
        bodyColor: "#8E95A3",
        borderColor: "#1E2230",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(30, 34, 48, 0.5)" },
        ticks: { color: "#4B5263", font: { size: 10 } },
      },
      y: {
        grid: { color: "rgba(30, 34, 48, 0.5)" },
        ticks: { color: "#4B5263", font: { size: 10 } },
        min: 0,
        max: 100,
      },
    },
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-6 text-center text-text-muted">
        No history data available yet.
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-text-primary mb-3">
        Score History
      </h3>
      <div style={{ height: "280px" }}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

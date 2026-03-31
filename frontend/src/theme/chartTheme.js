import { useMemo } from "react";
import { useAppTheme } from "./ThemeProvider";

export const CHART_SERIES = {
  primary: "#2f788a",
  secondary: "#4fa3b1",
  tertiary: "#9bd4de",
  accent: "#406ea2",
  success: "#16a34a",
  danger: "#dc2626",
  neutral: "#6b7280",
  deep: "#1b3c53",
};

export const CHART_PALETTE = [
  CHART_SERIES.primary,
  CHART_SERIES.secondary,
  CHART_SERIES.tertiary,
  CHART_SERIES.accent,
];

export function useChartTheme() {
  const { isDark } = useAppTheme();

  return useMemo(
    () =>
      isDark
        ? {
            grid: "rgba(148, 163, 184, 0.16)",
            axis: "#cbd5e1",
            axisLine: "rgba(148, 163, 184, 0.28)",
            legend: "#e2e8f0",
            tooltipStyle: {
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px",
              boxShadow: "0 18px 40px -22px rgba(2, 6, 23, 0.85)",
            },
            tooltipLabelStyle: {
              color: "#f8fafc",
              fontWeight: 600,
            },
            tooltipItemStyle: {
              color: "#cbd5e1",
            },
            tooltipCursor: {
              fill: "rgba(148, 163, 184, 0.08)",
            },
            brush: {
              fill: "rgba(30, 41, 59, 0.88)",
              stroke: "#334155",
              travellerStroke: "#94a3b8",
            },
            areaOpacity: 0.26,
          }
        : {
            grid: "#e5e7eb",
            axis: "#6b7280",
            axisLine: "#d1d5db",
            legend: "#374151",
            tooltipStyle: {
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              boxShadow: "0 18px 40px -24px rgba(15, 23, 42, 0.18)",
            },
            tooltipLabelStyle: {
              color: "#111827",
              fontWeight: 600,
            },
            tooltipItemStyle: {
              color: "#374151",
            },
            tooltipCursor: {
              fill: "rgba(15, 23, 42, 0.04)",
            },
            brush: {
              fill: "#f3f4f6",
              stroke: "#cbd5e1",
              travellerStroke: "#94a3b8",
            },
            areaOpacity: 0.18,
          },
    [isDark],
  );
}

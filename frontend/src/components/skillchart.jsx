// SkillChart.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_SERIES, useChartTheme } from '../theme/chartTheme';

const SkillChart = ({ data, skillName }) => {
const chartTheme = useChartTheme();

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-md px-4 py-2 shadow-md text-sm backdrop-blur-sm"
        style={chartTheme.tooltipStyle}
      >
        <p className="mb-1 font-semibold" style={{ color: CHART_SERIES.primary }}>
          {label}
        </p>
        <p style={{ color: chartTheme.tooltipItemStyle.color }}>
          Level: <span className="font-bold" style={{ color: chartTheme.tooltipLabelStyle.color }}>{payload[0].value}</span>
        </p>
      </div>
    );
  }

  return null;
};

  return (
    <div className="w-full h-[85%]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis
            dataKey="week"
            stroke={chartTheme.axis}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.axisLine }}
            tickLine={{ stroke: chartTheme.axisLine }}
          />
          <YAxis
            stroke={chartTheme.axis}
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickLine={false}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.axisLine }}
            />
          <Tooltip content={<CustomTooltip />} />

          
          <Line
            type="monotone"
            dataKey="level"
            stroke={CHART_SERIES.primary}
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillChart;

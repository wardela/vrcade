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

const SkillChart = ({ data, skillName }) => {

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gradient-to-br from-[#03102f] via-black to-[#03102f]  border-[#5ce1e6] rounded-md px-4 py-2 shadow-md text-sm text-white backdrop-blur-sm">
        <p className="mb-1 text-[#5ce1e6] font-semibold">{label}</p>
        <p>Level: <span className="font-bold text-white">{payload[0].value}</span></p>
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
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="week" stroke="#ccc" />
          <YAxis
            stroke="#ccc"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickLine={false}
            />
          <Tooltip content={<CustomTooltip />} />

          
          <Line
            type="monotone"
            dataKey="level"
            stroke="#5ce1e6"
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillChart;

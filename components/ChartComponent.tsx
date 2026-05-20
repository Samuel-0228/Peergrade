import React from 'react';
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { ChartType, QuestionAnalysis } from '../types';
import { COLORS } from '../constants';

type ChartVariant = 'distribution' | 'comparison' | 'trend';

interface ChartComponentProps {
  analysis: QuestionAnalysis;
  variant?: ChartVariant;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-none border border-neutral-800 bg-black px-4 py-3 text-xs shadow-none">
      <p className="mb-2 font-bold uppercase tracking-widest text-white">{data.name}</p>
      <div className="flex justify-between gap-4">
        <span className="text-neutral-500 uppercase tracking-widest">Volume</span>
        <span className="font-mono text-white">{data.value}</span>
      </div>
      <div className="flex justify-between gap-4 mt-1">
        <span className="text-neutral-500 uppercase tracking-widest">Share</span>
        <span className="font-mono text-white">{data.percentage}%</span>
      </div>
    </div>
  );
};

const ChartComponent: React.FC<ChartComponentProps> = ({ analysis, variant = 'distribution' }) => {
  const sortedData = [...analysis.data].sort((a, b) => Number(b.percentage) - Number(a.percentage));
  const chartData = sortedData.map((entry, index) => ({
    ...entry,
    shortName: entry.name.length > 18 ? `${entry.name.slice(0, 18)}...` : entry.name,
    rank: `P${index + 1}`,
    percentValue: Number(entry.percentage),
  }));
  const isPie = analysis.chartType === ChartType.PIE;

  return (
    <div className="flex h-full flex-col font-sans">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'trend' ? (
            <LineChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="#262626" vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="rank"
                tick={{ fill: '#a3a3a3', fontSize: 10, textAnchor: 'middle', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#a3a3a3', fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="step"
                dataKey="percentValue"
                stroke="#ffffff"
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{ r: 4, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
              />
            </LineChart>
          ) : variant === 'comparison' || !isPie ? (
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#262626" horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="shortName"
                type="category"
                width={108}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#e5e5e5', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#171717' }} />
              <Bar dataKey="value" radius={[0, 0, 0, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={1}
                dataKey="value"
                stroke="#000000"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`pie-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 border-t border-neutral-800 pt-4 sm:grid-cols-2">
        {chartData.map((entry, index) => (
          <div key={`legend-${entry.name}-${index}`} className="flex items-center gap-3 rounded-none border border-neutral-800 bg-neutral-950 px-3 py-2 transition-colors hover:bg-neutral-900">
            <div className="h-2 w-2 rounded-none" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white uppercase tracking-tight">{entry.name}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{entry.value} responses</p>
            </div>
            <span className="font-mono text-xs font-bold text-white">{entry.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartComponent;

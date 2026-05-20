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
    <div className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2.5 text-xs shadow-2xl shadow-black/30">
      <p className="mb-1 font-medium text-slate-100">{data.name}</p>
      <p className="text-slate-400">
        Volume <span className="font-mono text-indigo-300">{data.value}</span>
      </p>
      <p className="text-slate-400">
        Share <span className="font-mono text-indigo-300">{data.percentage}%</span>
      </p>
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
    <div className="flex h-full flex-col">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'trend' ? (
            <LineChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey="rank"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="percentValue"
                stroke="#818cf8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#818cf8', stroke: '#0b0f14', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#c7d2fe' }}
              />
            </LineChart>
          ) : variant === 'comparison' || !isPie ? (
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="shortName"
                type="category"
                width={108}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
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
                innerRadius={68}
                outerRadius={92}
                paddingAngle={2}
                dataKey="value"
                stroke="rgba(11,15,20,0.95)"
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

      <div className="mt-5 grid grid-cols-1 gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
        {chartData.map((entry, index) => (
          <div key={`legend-${entry.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-300">{entry.name}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{entry.value} responses</p>
            </div>
            <span className="font-mono-academic text-xs font-semibold text-indigo-300">{entry.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartComponent;

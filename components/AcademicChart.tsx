import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { DataPoint } from '../types';
import { COLORS } from '../constants';

interface AcademicChartProps {
  type: 'pie' | 'bar';
  data: DataPoint[];
  title: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) {
    return null;
  }
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2.5 text-xs shadow-2xl shadow-black/30">
      <p className="mb-1 font-medium text-slate-100">{data.label}</p>
      <p className="text-slate-400">
        Volume <span className="font-mono text-indigo-300">{data.count}</span>
      </p>
      <p className="text-slate-400">
        Share <span className="font-mono text-indigo-300">{data.percentage}%</span>
      </p>
    </div>
  );
};

const AcademicChart: React.FC<AcademicChartProps> = ({ type, data, title }) => {
  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-xl p-6 shadow-lg backdrop-blur-md flex flex-col h-full transition-all hover:border-white/10">
      <h3 className="text-sm font-semibold text-slate-100 mb-6 uppercase tracking-wider">{title}</h3>
      
      <div className="flex-grow min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={92}
                paddingAngle={2}
                dataKey="count"
                nameKey="label"
                stroke="rgba(11,15,20,0.95)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="label" 
                width={108} 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#cbd5e1' }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                {data.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-white/10 pt-4">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
            <span 
              className="w-2.5 h-2.5 rounded-sm shrink-0" 
              style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-300">{item.label}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.count} responses</p>
            </div>
            <span className="font-mono-academic text-xs font-semibold text-indigo-300">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicChart;

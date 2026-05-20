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
    <div className="rounded-none border border-neutral-800 bg-black px-4 py-3 text-xs shadow-none">
      <p className="mb-2 font-bold uppercase tracking-widest text-white">{data.label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-neutral-500 uppercase tracking-widest">Volume</span>
        <span className="font-mono text-white">{data.count}</span>
      </div>
      <div className="flex justify-between gap-4 mt-1">
        <span className="text-neutral-500 uppercase tracking-widest">Share</span>
        <span className="font-mono text-white">{data.percentage}%</span>
      </div>
    </div>
  );
};

const AcademicChart: React.FC<AcademicChartProps> = ({ type, data, title }) => {
  return (
    <div className="bg-black border border-neutral-800 rounded-none p-6 flex flex-col h-full transition-colors hover:bg-neutral-950 font-sans">
      <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">{title}</h3>
      
      <div className="flex-grow min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={1}
                dataKey="count"
                nameKey="label"
                stroke="#000000"
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
              <CartesianGrid stroke="#262626" horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="label" 
                width={108} 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 600, fill: '#e5e5e5' }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#171717' }} />
              <Bar dataKey="count" radius={[0, 0, 0, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-neutral-800 pt-4">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-none border border-neutral-800 bg-neutral-950 px-3 py-2 transition-colors hover:bg-neutral-900">
            <span 
              className="w-2 h-2 rounded-none shrink-0" 
              style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white uppercase tracking-tight">{item.label}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{item.count} responses</p>
            </div>
            <span className="font-mono text-xs font-bold text-white">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicChart;


import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { DataPoint } from '../types';

interface AcademicChartProps {
  type: 'pie' | 'bar';
  data: DataPoint[];
  title: string;
}

const COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

const AcademicChart: React.FC<AcademicChartProps> = ({ type, data, title }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col h-full">
      <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider">{title}</h3>
      
      <div className="flex-grow min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="label"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          ) : (
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="label" 
                width={120} 
                tick={{ fontSize: 11, fill: '#64748b' }} 
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#1e293b" radius={[0, 4, 4, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center text-[10px] text-slate-500 uppercase font-medium">
            <span 
              className="w-2 h-2 rounded-full mr-2" 
              style={{ backgroundColor: type === 'pie' ? COLORS[idx % COLORS.length] : '#1e293b' }} 
            />
            <span className="truncate flex-grow">{item.label}</span>
            <span className="ml-1 text-slate-900">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicChart;

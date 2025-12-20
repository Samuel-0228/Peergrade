
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { ChartType, QuestionAnalysis } from '../types';
import { COLORS } from '../constants';

interface ChartComponentProps {
  analysis: QuestionAnalysis;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="font-bold text-slate-200 mb-1">{data.name}</p>
        <p className="text-slate-400">Count: <span className="text-indigo-400 font-mono">{data.value}</span></p>
        <p className="text-slate-400">Ratio: <span className="text-indigo-400 font-mono">{data.percentage}%</span></p>
      </div>
    );
  }
  return null;
};

const ChartComponent: React.FC<ChartComponentProps> = ({ analysis }) => {
  const isPie = analysis.chartType === ChartType.PIE;

  return (
    <div className="flex flex-col w-full">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {isPie ? (
            <PieChart>
              <Pie
                data={analysis.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="#0a0a0c"
                strokeWidth={2}
              >
                {analysis.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={analysis.data} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                stroke="#64748b" 
                fontSize={9} 
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {analysis.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend for Pie Charts */}
      {isPie && (
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-800/50 pt-4">
          {analysis.data.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2 group">
              <div 
                className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-sm" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-[10px] font-mono-academic text-slate-400 truncate group-hover:text-slate-200 transition-colors">
                {entry.name}
              </span>
              <span className="text-[10px] font-mono-academic font-bold text-indigo-500 ml-auto">
                {entry.percentage}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartComponent;


import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { MOCK_ADMISSIONS } from '../constants';

const Dashboard: React.FC = () => {
  const data = useMemo(() => MOCK_ADMISSIONS, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 border border-blue-500/30 text-xs">
          <p className="font-bold text-blue-400 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-gray-300">
              {entry.name}: <span className="text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Institutional Admissions Repository</h2>
          <p className="text-gray-500 mt-1 max-w-2xl">
            A comprehensive overview of departmental applicant distributions, grade percentiles, and selection trends. 
            All visualizations represent aggregate longitudinal data.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-mono uppercase tracking-widest text-blue-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Live Data Feed
          </div>
          <div className="text-gray-600">Cycle 2024-25</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 hover:border-blue-500/50 transition-all cursor-default group">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-tighter">Aggregate Applicants</span>
          <span className="text-4xl font-bold tracking-tighter group-hover:text-blue-400 transition-colors">10,600</span>
          <div className="h-1 w-full bg-white/5 mt-4 overflow-hidden rounded-full">
            <div className="h-full bg-blue-500 w-[65%]"></div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 hover:border-emerald-500/50 transition-all cursor-default group">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-tighter">Median Grade Threshold</span>
          <span className="text-4xl font-bold tracking-tighter group-hover:text-emerald-400 transition-colors">91.4%</span>
          <div className="h-1 w-full bg-white/5 mt-4 overflow-hidden rounded-full">
            <div className="h-full bg-emerald-500 w-[91%]"></div>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-32 hover:border-purple-500/50 transition-all cursor-default group">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-tighter">Global Selectivity</span>
          <span className="text-4xl font-bold tracking-tighter group-hover:text-purple-400 transition-colors">19.2%</span>
          <div className="h-1 w-full bg-white/5 mt-4 overflow-hidden rounded-full">
            <div className="h-full bg-purple-500 w-[19%]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Volume vs Accept Rate */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Volume & Selectivity Analysis</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="department" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="applicants" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applicants" />
                <Bar yAxisId="right" dataKey="acceptanceRate" fill="#a855f7" radius={[4, 4, 0, 0]} name="Acceptance Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Grade Threshold Distribution */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Competitiveness Heatmap</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="averageGrade" name="Avg Grade" unit="%" stroke="#666" fontSize={10} domain={[80, 100]} />
                <YAxis type="number" dataKey="firstChoiceDemand" name="1st Choice" unit="%" stroke="#666" fontSize={10} />
                <ZAxis type="number" dataKey="applicants" range={[50, 400]} name="Size" />
                <Tooltip content={<CustomTooltip />} />
                <Scatter name="Departments" data={data}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.averageGrade > 90 ? '#34d399' : '#3b82f6'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar: Department Profile */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Multidimensional Program Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {data.slice(0, 3).map((dept, i) => (
                <div key={dept.department} className="flex flex-col items-center">
                  <span className="text-xs font-mono mb-2 text-gray-500 uppercase">{dept.department}</span>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Grades', A: dept.averageGrade },
                        { subject: 'Volume', A: (dept.applicants / 3200) * 100 },
                        { subject: 'Select', A: 100 - dept.acceptanceRate },
                        { subject: 'Choice', A: dept.firstChoiceDemand },
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 8 }} />
                        <Radar name={dept.department} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

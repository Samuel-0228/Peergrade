
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { MOCK_ADMISSIONS } from '../constants';
import { DataService } from '../services/dataService';
import { AdmissionData } from '../types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AdmissionData[]>(MOCK_ADMISSIONS);
  const [isLive, setIsLive] = useState(false);
  const dataService = useMemo(() => new DataService(), []);

  useEffect(() => {
    const savedUrl = localStorage.getItem('admission_sheet_url');
    if (savedUrl) {
      const autoSync = async () => {
        try {
          const remoteData = await dataService.fetchExternalAdmissions(savedUrl);
          setData(remoteData);
          setIsLive(true);
        } catch (e) {
          console.warn("Auto-sync failed, using baseline.");
        }
      };
      autoSync();
    }
  }, [dataService]);

  const stats = useMemo(() => {
    const totalApps = data.reduce((acc, curr) => acc + curr.applicants, 0);
    const avgGrade = data.reduce((acc, curr) => acc + curr.averageGrade, 0) / (data.length || 1);
    const avgSelectivity = data.reduce((acc, curr) => acc + curr.acceptanceRate, 0) / (data.length || 1);
    return { totalApps, avgGrade, avgSelectivity };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-4 border border-blue-500/30 text-[10px] font-mono uppercase tracking-widest">
          <p className="font-bold text-blue-500 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="opacity-70">
              {entry.name}: <span className="text-blue-400">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Institutional Repository</h2>
          <p className="text-gray-500 text-xs tracking-widest font-mono uppercase">
            Aggregate Dataset // Source: {isLive ? 'External Cloud Sync' : 'Internal Baseline'}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-mono uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Real-Time Stream Active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-8 rounded flex flex-col justify-between group cursor-default">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Aggregate Vol.</span>
          <span className="text-5xl font-black tracking-tighter group-hover:text-blue-500 transition-colors">
            {stats.totalApps.toLocaleString()}
          </span>
          <div className="h-0.5 w-full bg-white/5 mt-6 overflow-hidden">
            <div className="h-full bg-blue-500 w-[70%]"></div>
          </div>
        </div>
        <div className="glass-panel p-8 rounded flex flex-col justify-between group cursor-default">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Median Grade %</span>
          <span className="text-5xl font-black tracking-tighter group-hover:text-blue-500 transition-colors">
            {stats.avgGrade.toFixed(1)}
          </span>
          <div className="h-0.5 w-full bg-white/5 mt-6 overflow-hidden">
            <div className="h-full bg-blue-500 w-[91%]"></div>
          </div>
        </div>
        <div className="glass-panel p-8 rounded flex flex-col justify-between group cursor-default">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Selectivity Ratio</span>
          <span className="text-5xl font-black tracking-tighter group-hover:text-blue-500 transition-colors">
            {stats.avgSelectivity.toFixed(1)}%
          </span>
          <div className="h-0.5 w-full bg-white/5 mt-6 overflow-hidden">
            <div className="h-full bg-blue-500 w-[19%]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-panel p-8 rounded-xl">
          <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-[0.2em] mb-10">Program Magnitude & Thresholds</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="department" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={9} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="applicants" fill="#3b82f6" name="Applicants" barSize={32} />
                <Bar yAxisId="right" dataKey="acceptanceRate" fill="rgba(255,255,255,0.1)" name="Acceptance" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-xl">
          <h3 className="text-xs font-mono font-semibold text-gray-500 uppercase tracking-[0.2em] mb-10">Selectivity Correlation</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" dataKey="averageGrade" name="Avg Grade" unit="%" stroke="rgba(255,255,255,0.3)" fontSize={9} domain={[80, 100]} />
                <YAxis type="number" dataKey="firstChoiceDemand" name="1st Choice" unit="%" stroke="rgba(255,255,255,0.3)" fontSize={9} />
                <ZAxis type="number" dataKey="applicants" range={[100, 800]} name="Size" />
                <Tooltip content={<CustomTooltip />} />
                <Scatter name="Departments" data={data}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.averageGrade > 90 ? '#3b82f6' : 'rgba(255,255,255,0.2)'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

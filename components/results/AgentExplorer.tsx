
import React, { useState, useMemo } from 'react';
import { AgentDecision } from '../../types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, BarChart, Bar } from 'recharts';

interface AgentExplorerProps {
  agents: AgentDecision[];
}

type AgentKey = keyof Omit<AgentDecision, 'id' | 'voted' | 'affect'>;

const AGENT_ATTRIBUTE_LABELS: Record<AgentKey, string> = {
    education_normalized: 'Education (Normalized)',
    age: 'Age',
    urbanicity: 'Urbanicity',
    civic_duty: 'Civic Duty',
    habit_strength: 'Habit Strength',
    social_pressure_sensitivity: 'Social Pressure Sensitivity',
    risk_aversion: 'Risk Aversion',
    partisan_identity_strength: 'Partisan Strength',
    overconfidence: 'Overconfidence',
    personality_match_candidate: 'Candidate Match',
    issue_salience: 'Issue Salience',
    voteProb: 'Vote Probability',
};

const getHistogramData = (agents: AgentDecision[], key: AgentKey, bins: number = 20) => {
    if (agents.length === 0) return [];
    
    // For boolean/binary fields like urbanicity, use 2 bins specifically
    const isBinary = key === 'urbanicity';
    const effectiveBins = isBinary ? 2 : bins;

    const values = agents.map(a => a[key] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) < 0.000001 ? 1 : max - min;
    const step = range / effectiveBins;

    const data = Array.from({ length: effectiveBins }, (_, i) => {
        const start = min + i * step;
        const end = min + (i + 1) * step;
        let name = `${start.toFixed(2)}`;
        
        if (key === 'age') {
            name = `${start.toFixed(0)}-${end.toFixed(0)}`;
        } else if (isBinary) {
             name = start < 0.5 ? 'Rural (0)' : 'Urban (1)';
        }

        return {
            name,
            rangeStart: start,
            rangeEnd: end,
            Voted: 0,
            Abstained: 0,
            Total: 0,
        };
    });

    agents.forEach(agent => {
        const val = agent[key] as number;
        let binIndex = Math.floor((val - min) / step);
        if (binIndex >= effectiveBins) binIndex = effectiveBins - 1;
        if (binIndex < 0) binIndex = 0;

        if (agent.voted) {
            data[binIndex].Voted++;
        } else {
            data[binIndex].Abstained++;
        }
        data[binIndex].Total++;
    });

    return data;
};

const AgentExplorer: React.FC<AgentExplorerProps> = ({ agents }) => {
  const agentKeys = Object.keys(AGENT_ATTRIBUTE_LABELS) as AgentKey[];
  const [viewMode, setViewMode] = useState<'scatter' | 'histogram'>('scatter');

  // Scatter State
  const [xAxisKey, setXAxisKey] = useState<AgentKey>('age');
  const [yAxisKey, setYAxisKey] = useState<AgentKey>('social_pressure_sensitivity');
  const [zAxisKey, setZAxisKey] = useState<AgentKey>('habit_strength');

  // Histogram State
  const [histKey, setHistKey] = useState<AgentKey>('age');

  const chartData = useMemo(() => agents.map(agent => ({
    x: agent[xAxisKey],
    y: agent[yAxisKey],
    z: agent[zAxisKey],
    voted: agent.voted ? 1 : 0,
  })), [agents, xAxisKey, yAxisKey, zAxisKey]);
  
  const histData = useMemo(() => getHistogramData(agents, histKey), [agents, histKey]);

  const Select: React.FC<{id: string, value: string, onChange: (val: AgentKey) => void}> = ({ id, value, onChange }) => (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value as AgentKey)}
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-3 pr-8 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all appearance-none cursor-pointer"
      >
        {agentKeys.map(key => <option key={key} value={key}>{AGENT_ATTRIBUTE_LABELS[key]}</option>)}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  const getTickFormatter = (key: AgentKey) => (value: number) => {
      if (key === 'age') return value.toFixed(0);
      return value.toFixed(2);
  };
  
  const ViewToggle = () => (
      <div className="flex justify-center mb-8 p-1 bg-slate-900/80 border border-slate-800/50 rounded-xl w-fit mx-auto">
          <button 
            onClick={() => setViewMode('scatter')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'scatter' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
              Scatter Plot
          </button>
           <button 
            onClick={() => setViewMode('histogram')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'histogram' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
              Distribution
          </button>
      </div>
  );

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-8 text-center">
        <h3 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Agent Population Analysis</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">Explore individual agent characteristics and their correlation with voting behavior.</p>
      </div>
      
      <ViewToggle />

      {viewMode === 'scatter' ? (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-900/40 rounded-2xl border border-slate-800/50">
                <div className="space-y-1.5">
                    <label htmlFor="x-axis" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">X-Axis</label>
                    <Select id="x-axis" value={xAxisKey} onChange={setXAxisKey} />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="y-axis" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Y-Axis</label>
                    <Select id="y-axis" value={yAxisKey} onChange={setYAxisKey} />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="z-axis" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Size Factor</label>
                    <Select id="z-axis" value={zAxisKey} onChange={setZAxisKey} />
                </div>
            </div>
            <div className="w-full h-[450px] bg-slate-900/20 rounded-2xl border border-slate-800/30 p-4">
                <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.1} vertical={false} />
                    <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={AGENT_ATTRIBUTE_LABELS[xAxisKey]} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                    axisLine={false} tickLine={false}
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={getTickFormatter(xAxisKey)}
                    />
                    <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={AGENT_ATTRIBUTE_LABELS[yAxisKey]} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    axisLine={false} tickLine={false}
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={getTickFormatter(yAxisKey)}
                    />
                    <ZAxis dataKey="z" name={AGENT_ATTRIBUTE_LABELS[zAxisKey]} range={[20, 150]} />
                    <Tooltip
                        cursor={{ stroke: '#334155', strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '0.75rem', backdropFilter: 'blur(8px)' }}
                        itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                        labelStyle={{ display: 'none' }}
                        formatter={(value: number, name: string) => [name === 'Age' ? value.toFixed(0) : value.toFixed(2), name]}
                    />
                    <Legend 
                        verticalAlign="top" 
                        align="right" 
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{value}</span>}
                    />
                    <Scatter name="Voted" data={chartData.filter(d => d.voted)} fill="#0ea5e9" opacity={0.5} shape="circle" />
                    <Scatter name="Abstained" data={chartData.filter(d => !d.voted)} fill="#f43f5e" opacity={0.5} shape="circle" />
                </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800/50">
                <label htmlFor="hist-key" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 mb-2 block">Attribute Distribution</label>
                <Select id="hist-key" value={histKey} onChange={setHistKey} />
                <p className="text-[10px] text-slate-500 mt-3 font-medium tracking-wide">
                    Visualizing population density for <span className="text-sky-400">{AGENT_ATTRIBUTE_LABELS[histKey]}</span> segmented by voting outcome.
                </p>
            </div>
            <div className="w-full h-[450px] bg-slate-900/20 rounded-2xl border border-slate-800/30 p-4">
                <ResponsiveContainer>
                    <BarChart data={histData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.1} vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                            axisLine={false} 
                            tickLine={false}
                        />
                        <YAxis 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                            axisLine={false} 
                            tickLine={false}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '0.75rem', backdropFilter: 'blur(8px)' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Legend 
                            verticalAlign="top" 
                            align="right" 
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{value}</span>}
                        />
                        <Bar dataKey="Voted" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Abstained" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}
    </div>
  );
};

export default AgentExplorer;

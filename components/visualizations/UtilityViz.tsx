import React from 'react';
import { UtilityVizData } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface UtilityVizProps {
  data: UtilityVizData;
}

const UtilityViz: React.FC<UtilityVizProps> = ({ data }) => {
  const chartData = data.components.map(c => ({...c, color: c.value >= 0 ? '#0ea5e9' : '#f43f5e' }));
  
  return (
    <div className="space-y-4">
       <div className="h-64 w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8' }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                        formatter={(value: number) => value.toFixed(2)}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Bar dataKey="value">
                        <LabelList dataKey="value" position="right" formatter={(v:number) => v.toFixed(2)} fill="#e2e8f0" fontSize={12} />
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="text-center bg-slate-900/50 p-3 rounded-lg">
            <p className="text-sm text-slate-400">Final Utility Score → Vote Probability</p>
            <p className="text-xl font-semibold text-white">
                <span className={data.finalUtility > 0 ? 'text-sky-400' : 'text-red-400'}>{data.finalUtility.toFixed(2)}</span>
                <span className="text-slate-400 mx-2">→</span>
                <span className="text-sky-400">{(data.voteProb * 100).toFixed(1)}%</span>
            </p>
        </div>
    </div>
  );
};

export default UtilityViz;
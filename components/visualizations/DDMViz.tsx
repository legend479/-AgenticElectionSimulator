
import React, { useState, useEffect } from 'react';
import { DDMVizData } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DDMVizProps {
  data: DDMVizData;
}

const DDMViz: React.FC<DDMVizProps> = ({ data }) => {
    const { mu, a, z, sigma } = data.params;
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress(0);
        let frameId: number;
        const startTime = Date.now();
        const duration = 1500; // ms

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const currentProgress = Math.min(elapsed / duration, 1);
            setProgress(currentProgress);
            if (currentProgress < 1) {
                frameId = requestAnimationFrame(animate);
            }
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [data]);

    return (
        <div className="space-y-4">
             <div className="h-72 w-full">
                <ResponsiveContainer>
                    <LineChart margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                        <XAxis 
                            type="number" 
                            dataKey="t" 
                            domain={[0, 'dataMax']} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }} 
                            axisLine={false} 
                            tickLine={false} 
                            label={{ value: "Time", position: "insideBottom", dy: 20, fill: '#94a3b8' }}
                            tickFormatter={(val) => val.toFixed(1)}
                        />
                        <YAxis 
                            type="number" 
                            domain={[0, Math.ceil(a)]} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }} 
                            axisLine={false} 
                            tickLine={false} 
                            label={{ value: "Evidence", angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
                            tickFormatter={(val) => val.toFixed(2)}
                        />
                        
                        <ReferenceLine y={a} label={{ value: "Vote", position: 'insideTopLeft', fill: '#0ea5e9' }} stroke="#0ea5e9" strokeDasharray="4 4" />
                        <ReferenceLine y={z} label={{ value: "Start Bias (z)", position: 'right', fill: '#94a3b8' }} stroke="#94a3b8" strokeDasharray="2 2" />
                        <ReferenceLine y={0} label={{ value: "Abstain", position: 'insideBottomLeft', fill: '#f43f5e' }} stroke="#f43f5e" strokeDasharray="4 4" />

                        {data.paths.map((path, i) => {
                            const pathLength = Math.floor(path.length * progress);
                            return (
                                <Line key={i} type="monotone" data={path.slice(0, pathLength)} dataKey="x" stroke={i === 0 ? "#eab308" : "#64748b"} strokeWidth={i === 0 ? 2 : 1} dot={false} isAnimationActive={false}/>
                            )
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-900/50 p-2 rounded-lg"><p className="text-xs text-slate-400">Drift Rate (μ)</p><p className="text-lg font-semibold text-white">{mu.toFixed(2)}</p></div>
                <div className="bg-slate-900/50 p-2 rounded-lg"><p className="text-xs text-slate-400">Threshold (a)</p><p className="text-lg font-semibold text-white">{a.toFixed(2)}</p></div>
                <div className="bg-slate-900/50 p-2 rounded-lg"><p className="text-xs text-slate-400">Start Bias (z)</p><p className="text-lg font-semibold text-white">{z.toFixed(2)}</p></div>
                <div className="bg-slate-900/50 p-2 rounded-lg"><p className="text-xs text-slate-400">Noise (σ)</p><p className="text-lg font-semibold text-white">{sigma.toFixed(2)}</p></div>
            </div>
        </div>
    );
};

export default DDMViz;

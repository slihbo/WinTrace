import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  Zap, Sparkles, Clock, LayoutGrid, Play, X
} from 'lucide-react';
import { DailyStats, AppCategory, AppUsage } from '../types';
import { formatDuration, setCategory } from '../services/api';
import { t } from '../utils/i18n';

interface DashboardProps {
  data: DailyStats;
  onOpenRecap: () => void;
  onRefresh?: () => void;
}

const BAR_COLOR = '#3f3f46';
const BAR_ACTIVE_COLOR = '#e4e4e7';

const Dashboard: React.FC<DashboardProps> = ({ data, onOpenRecap, onRefresh }) => {
  const topApps = data.apps.slice(0, 4);
  const [selectedApp, setSelectedApp] = useState<AppUsage | null>(null);

  const handleCategorySelect = async (category: string) => {
    if (selectedApp) {
      await setCategory(selectedApp.id, category);
      setSelectedApp(null);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] text-textMain overflow-y-auto selection:bg-white/20 relative">

      {/* Category Selection Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-reveal">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-white font-semibold text-lg">{t.selectCategory}</h3>
                <p className="text-zinc-400 text-sm truncate max-w-[200px]">{selectedApp.name}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.values(AppCategory).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`p-3 rounded-xl text-left text-sm font-medium transition-all hover:scale-[1.02] border ${selectedApp.category === cat ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'}`}
                >
                  {(t as any)[cat] || cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full p-6 space-y-12 pb-40 pt-24">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-extralight tracking-tight text-white">
            {t.hello}, <span className="font-semibold">{t.user}</span>
          </h1>
          <p className="text-textMuted text-lg font-light tracking-wide opacity-60 uppercase">{data.date}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm flex flex-col justify-between h-40 transition-colors hover:bg-zinc-900/60">
            <div className="flex items-center justify-between text-textMuted">
              <span className="text-xs font-semibold uppercase tracking-wider">{t.activeTime}</span>
              <Clock size={16} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light text-white tracking-tighter">{formatDuration(data.totalDurationSeconds).split(' ')[0]}</span>
              <span className="text-xl text-white/40">{formatDuration(data.totalDurationSeconds).split(' ')[1]}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm flex flex-col justify-between h-40 transition-colors hover:bg-zinc-900/60">
            <div className="flex items-center justify-between text-textMuted">
              <span className="text-xs font-semibold uppercase tracking-wider">{t.favoriteApp}</span>
              <LayoutGrid size={16} />
            </div>
            <div>
              <span className="text-2xl font-medium text-white line-clamp-2 leading-tight">{data.apps[0]?.name || '-'}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm flex flex-col justify-between h-40 transition-colors hover:bg-zinc-900/60">
            <div className="flex items-center justify-between text-textMuted">
              <span className="text-xs font-semibold uppercase tracking-wider">{t.appsCount}</span>
              <Zap size={16} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-light text-white tracking-tighter">{data.apps.length}</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-light text-white/80 px-2">{t.focusDistribution}</h3>

          {/* 2-Column Grid for Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Bar Chart - Top Apps */}
            <div className="h-64 bg-zinc-900/20 rounded-3xl border border-white/5 p-6 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topApps} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }}
                    dy={10}
                    interval={0}
                    tickFormatter={(val) => val.length > 12 ? `${val.slice(0, 10)}..` : val}
                  />
                  <RechartsTooltip
                    animationDuration={0}
                    isAnimationActive={false}
                    cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-black/80 border border-white/10 p-3 rounded-xl text-xs text-white shadow-2xl backdrop-blur-md">
                            <span className="font-bold block mb-1">{payload[0].payload.name}</span>
                            <span className="text-zinc-400">{formatDuration(payload[0].value as number)}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="durationSeconds" radius={[6, 6, 6, 6]} barSize={48}>
                    {topApps.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? BAR_ACTIVE_COLOR : BAR_COLOR}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Category Distribution */}
            <div className="h-64 bg-zinc-900/40 rounded-3xl border border-white/5 p-6 relative overflow-hidden flex items-center justify-center">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

              {(() => {
                // Calculate category totals
                const categoryTotals: Record<string, number> = {};
                data.apps.forEach(app => {
                  const category = app.category;
                  categoryTotals[category] = (categoryTotals[category] || 0) + app.durationSeconds;
                });

                // Convert to array and sort
                const categoryData = Object.entries(categoryTotals)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value);

                // Pastel colors matching the reference image
                const COLORS = ['#f87171', '#93c5fd', '#86efac', '#a78bfa', '#fde047', '#fca5a5'];

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            className="transition-all duration-300 hover:opacity-80"
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        animationDuration={0}
                        isAnimationActive={false}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const categoryName = (t as any)[data.name] || data.name;
                            const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                            const percentage = ((data.value / total) * 100).toFixed(0);
                            return (
                              <div className="bg-black/80 border border-white/10 p-3 rounded-xl text-xs text-white shadow-2xl backdrop-blur-md">
                                <span className="font-bold block mb-1">{categoryName}</span>
                                <span className="text-zinc-400">{formatDuration(data.value)}</span>
                                <span className="text-zinc-500 block mt-1">%{percentage}</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

          </div>
        </div>

        {/* App List */}
        <div className="space-y-4">
          <h3 className="text-xl font-light text-white/80 px-2">{t.detailedFlow}</h3>
          <div className="space-y-2">
            {data.apps.map((app, i) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="w-full group flex items-center justify-between py-4 px-4 hover:bg-white/5 rounded-2xl transition-all duration-300 cursor-pointer border border-transparent hover:border-white/5 text-left outline-none focus:bg-white/5"
              >
                <div className="flex items-center gap-5">
                  <span className="text-zinc-600 font-mono text-xs w-4 group-hover:text-white transition-colors">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white font-medium text-sm group-hover:translate-x-1 transition-transform">{app.name}</span>
                    <span className="text-xs text-zinc-500 group-hover:text-indigo-300 transition-colors">
                      {(t as any)[app.category] || app.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-400 font-medium text-sm tabular-nums group-hover:text-white transition-colors">{formatDuration(app.durationSeconds)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Bottom Entry Point */}
      <div className="fixed bottom-8 left-0 right-0 z-20 flex justify-center px-6 pointer-events-none">
        <button
          onClick={onOpenRecap}
          className="pointer-events-auto relative group w-full max-w-lg overflow-hidden rounded-[2rem] p-[1px] transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-black/50"
        >
          {/* Animated Gradient Border */}
          <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#333333_50%,#ffffff_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center justify-between bg-zinc-950/90 backdrop-blur-xl rounded-[2rem] px-8 py-5 border border-white/10 group-hover:border-transparent transition-colors">

            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-lg opacity-40 animate-pulse"></div>
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-white">
                  <Play size={22} fill="currentColor" className="ml-1 group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-white font-bold text-lg tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                  {t.viewFullRecap}
                </span>
                <span className="text-zinc-500 text-xs font-medium tracking-wide uppercase group-hover:text-zinc-400">{t.recapReady}</span>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </button>
      </div>

    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { X, Award, Zap, Clock, Sun, Calendar, Coffee, BarChart2, Crown, Trophy } from 'lucide-react';
import { YearlyStats, AppCategory } from '../types';
import { formatDuration } from '../services/api';
import { t, getDayName, getMonthName } from '../utils/i18n';

interface RecapViewProps {
  data: YearlyStats;
  onClose: () => void;
}

// Background configurations for each slide
const SLIDE_THEMES = [
  "from-black via-zinc-900 to-black", // Intro
  "from-blue-900/40 via-black to-black", // Time

  "from-emerald-900/40 via-black to-black", // Weekend

  "from-purple-900/40 via-black to-black", // Top App
  "from-pink-900/40 via-black to-black", // Category
];

const RecapView: React.FC<RecapViewProps> = ({ data, onClose }) => {
  const [slide, setSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0); // Key to force re-render animations

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(s => s + 1);
      setAnimKey(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (slide > 0) {
      setSlide(s => s - 1);
      setAnimKey(prev => prev + 1);
    }
  };

  // Helper for monthly chart max value
  const maxMonthlyHours = Math.max(...data.monthlyUsage.map(m => m.hours));

  const slides = [
    // Slide 0: Intro
    <div key="intro" className="flex flex-col items-center justify-center text-center h-full relative z-10 px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />

      <div className="stagger-1 animate-slide-up opacity-0">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl mb-8 shadow-2xl">
          <BarChart2 size={32} className="text-white" />
        </div>
      </div>

      <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white mb-6 stagger-2 animate-scale-reveal opacity-0 leading-[0.9]">
        {t.totalUsage}
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{t.recapTitle}</span>
      </h1>

      <p className="text-xl font-light text-zinc-400 stagger-3 animate-fade-in opacity-0">
        {t.introTitle}
      </p>
    </div>,

    // Slide 1: Total Time with Monthly Breakdown
    <div key="time" className="flex flex-col items-center justify-center text-center h-full relative z-10 px-6">
      <div className="stagger-1 animate-float opacity-0 mb-8">
        <Clock size={60} className="text-blue-400 drop-shadow-[0_0_30px_rgba(96,165,250,0.5)]" />
      </div>

      <div className="relative mb-12">
        <h2 className="text-9xl font-bold text-white leading-none tracking-tighter stagger-2 animate-zoom-in opacity-0 tabular-nums">
          {data.totalHours}
        </h2>
        <p className="text-2xl font-medium text-blue-200 tracking-widest uppercase stagger-3 animate-fade-in opacity-0">
          {t.totalTimeTitle}
        </p>
      </div>

      {/* Monthly Chart */}
      <div className="w-full max-w-2xl h-40 flex items-end justify-between gap-2 px-4 stagger-4 animate-slide-up opacity-0">
        {data.monthlyUsage.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="w-full relative bg-white/5 rounded-t-lg overflow-hidden h-32 flex items-end">
              <div
                className="w-full bg-blue-500/80 group-hover:bg-blue-400 transition-all duration-1000 ease-out"
                style={{ height: `${(m.hours / maxMonthlyHours) * 100}%`, animation: `grow-chart 1s ease-out forwards ${0.5 + (i * 0.05)}s` }}
              ></div>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{getMonthName(m.month, true)}</span>
          </div>
        ))}
      </div>
    </div>,

    // Slide 2: Work/Life
    <div key="balance" className="flex flex-col items-center justify-center text-center h-full relative z-10 px-6">
      <h2 className="text-5xl font-bold text-white mb-16 stagger-1 animate-slide-up opacity-0 tracking-tight">
        {t.productivityScore}?
      </h2>

      <div className="flex items-end justify-center gap-6 h-64 w-full max-w-lg">
        {/* Weekday */}
        <div className="flex-1 flex flex-col justify-end group stagger-2 animate-grow-bar opacity-0" style={{ '--bar-height': '100%' } as React.CSSProperties}>
          <span className="mb-4 text-3xl font-bold text-white">{(100 - data.weekendPercentage)}%</span>
          <div className="w-full bg-zinc-800 rounded-2xl relative overflow-hidden h-full">
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-200 transition-all duration-[2000ms] ease-out h-[var(--percent)] rounded-2xl" style={{ '--percent': `${100 - data.weekendPercentage}%` } as React.CSSProperties}></div>
          </div>
          <span className="mt-4 text-sm font-bold uppercase tracking-widest text-zinc-500">{t.weekday}</span>
        </div>

        {/* Weekend */}
        <div className="flex-1 flex flex-col justify-end group stagger-3 animate-grow-bar opacity-0" style={{ '--bar-height': '100%' } as React.CSSProperties}>
          <span className="mb-4 text-3xl font-bold text-emerald-400">{data.weekendPercentage}%</span>
          <div className="w-full bg-zinc-800 rounded-2xl relative overflow-hidden h-full">
            <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-[2000ms] ease-out h-[var(--percent)] rounded-2xl" style={{ '--percent': `${data.weekendPercentage}%` } as React.CSSProperties}></div>
          </div>
          <span className="mt-4 text-sm font-bold uppercase tracking-widest text-emerald-600">{t.weekend}</span>
        </div>
      </div>
    </div>,

    // Slide 3: Daily Averages
    <div key="daily" className="flex flex-col items-center justify-center text-center h-full relative z-10 px-6 w-full max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-white mb-12 stagger-1 animate-slide-up opacity-0">
        {t.dailyAverages}
      </h2>

      <div className="w-full flex items-end justify-between gap-2 h-64 stagger-2 animate-slide-up opacity-0">
        {data.dailyAverages && data.dailyAverages.map((d, i) => {
          const shortDay = getDayName(d.day, true);
          const maxVal = Math.max(...data.dailyAverages.map(x => x.hours)) || 1;
          const pct = (d.hours / maxVal) * 100;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
              <div className="text-white font-bold text-lg mb-1">{d.hours}s</div>
              <div className="w-full bg-zinc-800 rounded-lg overflow-hidden flex items-end h-full relative group min-h-[4px]">
                <div
                  className="w-full bg-indigo-500 rounded-t-lg transition-all duration-1000 ease-out group-hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  style={{
                    height: '0%',
                    animation: `bar-grow-dynamic 1s cubic-bezier(0.16, 1, 0.3, 1) forwards ${0.3 + (i * 0.1)}s`,
                    '--target-height': `${pct}%`
                  } as React.CSSProperties}
                ></div>
              </div>
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-2 truncate w-full">{shortDay}</div>
            </div>
          );
        })}
      </div>
    </div>,



    // Slide 5: Top 5 Apps List
    <div key="app" className="flex flex-col items-center justify-center h-full relative z-10 px-6 w-full max-w-2xl mx-auto">

      <div className="text-center mb-8 stagger-1 animate-slide-up opacity-0">
        <h2 className="text-4xl font-bold text-white">{t.topAppsTitle}</h2>
        <p className="text-purple-300/80 mt-2">{t.topAppsSubtitle}</p>
      </div>

      <div className="w-full space-y-3">
        {data.apps.length > 0 ? (
          <>
            {/* Rank 1 */}
            <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 p-4 rounded-2xl flex items-center gap-4 stagger-2 animate-scale-reveal opacity-0 transform hover:scale-[1.02] transition-transform shadow-xl">
              <div className="flex-shrink-0 w-16 h-16 bg-black rounded-xl flex items-center justify-center relative border border-white/10">
                <div className="absolute -top-2 -left-2 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                  <Crown size={24} fill="currentColor" />
                </div>
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white truncate">{data.apps[0]?.name}</h3>
                <p className="text-purple-200 text-sm">{formatDuration(data.apps[0]?.durationSeconds)}</p>
              </div>
              <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-full"></div>
              </div>
            </div>

            {/* Ranks 2-5 */}
            {data.apps.slice(1, 5).map((app, index) => (
              <div key={app.id}
                className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors"
                style={{ animationDelay: `${600 + (index * 150)}ms` } as React.CSSProperties}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 font-bold border border-white/5 bg-black/20 stagger-3 animate-slide-up opacity-0`}>
                  {index + 2}
                </div>
                <div className="flex-1 min-w-0 stagger-3 animate-slide-up opacity-0">
                  <h3 className="text-white font-medium truncate">{app.name}</h3>
                </div>
                <div className="text-right stagger-3 animate-slide-up opacity-0">
                  <p className="text-zinc-400 text-sm font-medium tabular-nums">{formatDuration(app.durationSeconds)}</p>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center text-zinc-500 italic p-8 stagger-2 animate-fade-in opacity-0">
            {t.noData}
          </div>
        )}
      </div>
    </div>,

    // Slide 6: Category Breakdown
    <div key="cat" className="flex flex-col items-center justify-center text-center h-full relative z-10 px-6 w-full max-w-xl mx-auto">
      <p className="text-pink-300 text-xl font-light mb-8 stagger-1 animate-fade-in opacity-0 italic font-serif">
        {t.digitalIdentity}
      </p>

      <h2 className="text-5xl font-black text-white mb-12 stagger-2 animate-scale-reveal opacity-0 tracking-tighter">
        {t.categoriesTitle}
      </h2>

      <div className="w-full space-y-6 stagger-3 animate-slide-up opacity-0">
        {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
          data.categoryBreakdown.map((cat, i) => {
            const colors = [
              'bg-pink-500',
              'bg-purple-500',
              'bg-indigo-500',
              'bg-blue-500',
              'bg-cyan-500'
            ];
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-bold tracking-wide uppercase">
                  <span className="text-white">{(t as any)[cat.category] || cat.category}</span>
                  <span className="text-white/60">%{cat.percentage}</span>
                </div>
                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors[i % colors.length]} shadow-[0_0_20px_rgba(236,72,153,0.3)]`}
                    style={{ width: '0%', animation: `fill-bar 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards ${1 + (i * 0.2)}s`, '--target-width': `${cat.percentage}%` } as React.CSSProperties}
                  ></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-zinc-500 italic">{t.noData}</div>
        )}
      </div>
    </div>
  ];

  // Auto-advance logic
  useEffect(() => {
    const timer = setTimeout(() => {
      handleNext();
    }, 10000); // Increased duration slightly for more detailed slides
    return () => clearTimeout(timer);
  }, [slide]);

  return (
    <div className={`fixed inset-0 z-50 transition-colors duration-1000 ease-in-out bg-gradient-to-br ${SLIDE_THEMES[slide] || "from-black to-zinc-900"}`}>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Custom Drag Region for Recap View */}
      <div className="absolute top-0 left-0 right-0 h-8 z-[60] pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-auto"
          onMouseDown={() => window.pywebview?.api.start_drag()}
        />
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-6 z-[60] p-2 bg-black/20 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all pointer-events-auto"
      >
        <X size={24} />
      </button>

      {/* Progress Bars - Story Style */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1.5 p-3 pt-6 sm:pt-4 pointer-events-none">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all duration-300 ease-linear ${idx < slide ? 'w-full' : idx === slide ? 'animate-progress-fill w-full' : 'w-0'
                }`}
              style={{ animationDuration: '10000ms', animationPlayState: idx === slide ? 'running' : 'paused' }}
            />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div
        className="w-full h-full relative"
        onClick={handleNext}
      >
        {/* Navigation Hotspots */}
        <div className="absolute left-0 top-0 bottom-0 w-1/4 z-20" onClick={handlePrev} />
        <div className="absolute right-0 top-0 bottom-0 w-3/4 z-20" onClick={(e) => { e.stopPropagation(); handleNext(); }} />

        {/* Slide Render with Key for Animation Reset */}
        <div key={animKey} className="w-full h-full">
          {slides[slide]}
        </div>
      </div>

      {/* Styles for complex animations */}
      <style>{`
        .stagger-1 { animation-delay: 100ms; }
        .stagger-2 { animation-delay: 300ms; }
        .stagger-3 { animation-delay: 600ms; }
        .stagger-4 { animation-delay: 900ms; }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes scale-reveal {
          from { opacity: 0; transform: scale(0.9); filter: blur(10px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .animate-scale-reveal { animation: scale-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-zoom-in { animation: zoom-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }

        @keyframes progress-fill {
          from { transform: translateX(-100%); }
          to { transform: translateX(0%); }
        }
        .animate-progress-fill {
          animation: progress-slide 10s linear forwards;
          transform-origin: left;
        }
        @keyframes progress-slide {
          from { width: 0%; }
          to { width: 100%; }
        }

        @keyframes grow-bar {
          from { height: 0%; opacity: 0; }
          to { height: 100%; opacity: 1; }
        }
        .animate-grow-bar { animation: grow-bar 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fill-bar {
            from { width: 0%; }
            to { width: var(--target-width); }
        }

        @keyframes bar-grow-dynamic {
          from { height: 0%; }
          to { height: var(--target-height); }
        }

        .animate-spin-slow { animation: spin 12s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
};

export default RecapView;
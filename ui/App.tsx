import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import RecapView from './components/RecapView';
import { fetchDailyStats, fetchYearlyRecap } from './services/api';
import { DailyStats, YearlyStats, ViewMode } from './types';
import { ChevronLeft, ChevronRight, CalendarRange, Check, X, Calendar, Loader2 } from 'lucide-react';
import { t } from './utils/i18n';

const App: React.FC = () => {
  const [data, setData] = useState<DailyStats | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isLoading, setIsLoading] = useState(true);

  // Custom Date Range State
  const [customRange, setCustomRange] = useState<{ start: Date, end: Date } | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');

  // UI State
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [yearlyData, setYearlyData] = useState<YearlyStats | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Fetch Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const stats = await fetchDailyStats(currentDate, viewMode, customRange || undefined);
      setData(stats);
    } catch (error) {
      console.error("Veri çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadData();
    }, 60000);

    // Listen for pywebview ready event
    window.addEventListener('pywebviewready', loadData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pywebviewready', loadData);
    };
  }, [currentDate, viewMode, customRange]);

  const handleOpenRecap = async () => {
    if (!yearlyData) {
      try {
        const stats = await fetchYearlyRecap();
        setYearlyData(stats);
        setIsRecapOpen(true);
      } catch (error) {
        console.error("Yıllık veri alınamadı:", error);
      }
    } else {
      setIsRecapOpen(true);
    }
  };

  // Preload yearly data on mount
  useEffect(() => {
    const loadYearly = async () => {
      try {
        const stats = await fetchYearlyRecap();
        setYearlyData(stats);
      } catch (error) {
        console.error("Yıllık veri çekilemedi:", error);
      }
    };

    // Retry if pywebview isn't ready
    if (!window.pywebview) {
      window.addEventListener('pywebviewready', loadYearly);
    } else {
      loadYearly();
    }
    return () => window.removeEventListener('pywebviewready', loadYearly);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeDate = (amount: number) => {
    if (viewMode === 'custom') return;

    const newDate = new Date(currentDate);
    if (viewMode === 'yearly') {
      newDate.setFullYear(newDate.getFullYear() + amount);
    } else if (viewMode === 'monthly') {
      newDate.setMonth(newDate.getMonth() + amount);
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + (amount * 7));
    } else {
      newDate.setDate(newDate.getDate() + amount);
    }
    setCurrentDate(newDate);
  };

  // Helper for Local Date String (YYYY-MM-DD)
  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const d1 = getLocalDateString(date);
    const d2 = getLocalDateString(new Date());
    return d1 === d2;
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === 'custom') {
      const now = new Date();
      setTempEnd(now.toISOString().split('T')[0]);
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      setTempStart(weekAgo.toISOString().split('T')[0]);
      setIsCustomModalOpen(true);
      setIsDatePickerOpen(false);
      return;
    }

    setViewMode(mode);
    setIsDatePickerOpen(false);
    setCurrentDate(new Date());
  };

  const applyCustomRange = () => {
    if (tempStart && tempEnd) {
      const start = new Date(tempStart);
      const end = new Date(tempEnd);

      if (start > end) {
        alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
        return;
      }

      setCustomRange({ start, end });
      setViewMode('custom');
      setIsCustomModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans relative">

      {/* Custom Title Bar / Drag Region */}
      <div className="absolute top-0 left-0 right-0 h-8 z-50 flex items-center justify-between px-2 py-1 select-none pointer-events-none">
        {/* Drag Region */}
        <div
          className="absolute inset-0 pointer-events-auto"
          onMouseDown={() => window.pywebview?.api.start_drag()}
        />

        {/* Logo/Title (Optional) */}
        <span className="relative z-10 text-[10px] uppercase tracking-widest text-zinc-600 font-bold ml-2">WinTrace</span>

        {/* Window Controls */}
        <div className="relative z-10 flex gap-2 pointer-events-auto">
          <button onClick={() => window.pywebview?.api.minimize_window()} className="p-1 text-zinc-500 hover:text-white transition-colors">
            <svg width="10" height="10" viewBox="0 0 10 2" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="2" rx="1" fill="currentColor" /></svg>
          </button>
          <button onClick={() => window.pywebview?.api.close_window()} className="p-1 text-zinc-500 hover:text-red-500 transition-colors">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* Navigation - Only visible when Recap is closed */}
      {!isRecapOpen && (
        <div className="absolute top-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto relative">

            {/* Date Navigator */}
            <div className="flex items-center bg-zinc-900/80 rounded-full p-1 border border-white/5 backdrop-blur-md shadow-2xl">
              <button
                onClick={() => changeDate(-1)}
                disabled={viewMode === 'custom' || isLoading}
                className={`p-2 rounded-full transition-colors ${viewMode === 'custom' ? 'text-zinc-700 cursor-not-allowed' : 'hover:bg-white/10 text-textMuted hover:text-white'}`}
              >
                <ChevronLeft size={16} />
              </button>

              <div
                className="flex items-center gap-2 px-6 w-40 justify-center cursor-pointer hover:bg-white/5 rounded-full transition-colors h-full relative group"
                onClick={() => {
                  const input = document.getElementById('hidden-date-picker') as HTMLInputElement;
                  if (input) input.showPicker();
                }}
              >
                <span className="font-medium text-xs uppercase tracking-wide text-white/90 truncate group-hover:text-white transition-colors">
                  {data ? data.date : t.loadingShort}
                </span>
                <input
                  id="hidden-date-picker"
                  type="date"
                  max={getLocalDateString(new Date())}
                  className="absolute opacity-0 pointer-events-none w-0 h-0 bottom-0 left-1/2"
                  onChange={(e) => {
                    if (e.target.value) {
                      setCurrentDate(new Date(e.target.value));
                      setViewMode('daily');
                    }
                  }}
                />
              </div>

              <button
                onClick={() => changeDate(1)}
                disabled={isToday(currentDate) || viewMode === 'custom' || isLoading}
                className={`p-2 rounded-full transition-colors ${isToday(currentDate) || viewMode === 'custom' ? 'text-white/5 cursor-not-allowed' : 'hover:bg-white/10 text-textMuted hover:text-white'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View Mode Picker */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                disabled={isLoading}
                className={`p-3 rounded-full border border-white/5 backdrop-blur-md shadow-2xl transition-all duration-200 ${isDatePickerOpen ? 'bg-white text-black border-white' : 'bg-zinc-900/80 text-textMuted hover:text-white hover:bg-zinc-800'}`}
              >
                <CalendarRange size={16} />
              </button>

              {isDatePickerOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                  <div className="p-1.5 flex flex-col gap-0.5">
                    {['daily', 'weekly', 'monthly', 'yearly'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleViewModeChange(mode as ViewMode)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left hover:bg-zinc-800 transition-colors group"
                      >
                        <span className={viewMode === mode ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-200'}>
                          {mode === 'daily' ? t.daily : mode === 'weekly' ? t.weekly : mode === 'monthly' ? t.monthly : t.yearly}
                        </span>
                        {viewMode === mode && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                    <div className="h-px bg-white/5 my-1 mx-2"></div>
                    <button
                      onClick={() => handleViewModeChange('custom')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left hover:bg-zinc-800 transition-colors group"
                    >
                      <span className={viewMode === 'custom' ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-200'}>{t.custom}</span>
                      {viewMode === 'custom' && <Check size={14} className="text-white" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustomModalOpen(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCustomModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium">{t.customRange}</h3>
                <p className="text-zinc-400 text-xs">{t.selectDates}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 ml-1">{t.startDate}</label>
                <input type="date" value={tempStart} onChange={(e) => setTempStart(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors text-sm [color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 ml-1">{t.endDate}</label>
                <input type="date" value={tempEnd} onChange={(e) => setTempEnd(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors text-sm [color-scheme:dark]" />
              </div>
              <button onClick={applyCustomRange} className="w-full bg-white text-black font-medium py-3 rounded-xl mt-2 hover:bg-zinc-200 transition-colors">{t.apply}</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-zinc-500">
            <Loader2 size={32} className="animate-spin text-white" />
            <p className="text-sm font-medium animate-pulse">{t.loading}</p>
          </div>
        ) : isRecapOpen && yearlyData ? (
          <RecapView data={yearlyData} onClose={() => setIsRecapOpen(false)} />
        ) : data ? (
          <Dashboard data={data} onOpenRecap={handleOpenRecap} onRefresh={loadData} />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-zinc-500">{t.noData}</div>
        )}
      </main>
    </div>
  );
};

export default App;
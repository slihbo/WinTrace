import { DailyStats, YearlyStats, ViewMode } from '../types';

// Declare the pywebview global object
declare global {
    interface Window {
        pywebview: {
            api: {
                get_daily_stats: (date: string, viewMode: string, customRange?: { start: string, end: string }) => Promise<DailyStats>;
                get_yearly_recap: () => Promise<YearlyStats>;
                minimize_window: () => void;
                close_window: () => void;
                start_drag: () => void;
                set_category: (appId: string, category: string) => Promise<boolean>;
            };
        };
    }
}

/**
 * Helper to format duration (same as mockService)
 */
export const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

/**
 * Fetch Daily Stats from Python Backend
 */
export const fetchDailyStats = async (
    date: Date,
    viewMode: ViewMode,
    customRange?: { start: Date, end: Date }
): Promise<DailyStats> => {

    if (window.pywebview) {
        try {
            // Convert Dates to Local ISO strings for Python (YYYY-MM-DD)
            // Python expects ISO format, but we simply want the date part in local time
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];

            const customRangeStr = customRange ? {
                start: customRange.start.toISOString().split('T')[0], // Assuming these are set correctly
                end: customRange.end.toISOString().split('T')[0]
            } : undefined;

            return await window.pywebview.api.get_daily_stats(dateStr, viewMode, customRangeStr);
        } catch (error) {
            console.error("Python API Error:", error);
            throw error;
        }
    } else {
        // Fallback for browser development (Mock Data or Error)
        console.warn("Pywebview not DETECTED. Returning empty data.");
        return {
            date: date.toLocaleDateString(),
            viewMode: viewMode,
            totalDurationSeconds: 0,
            productivityScore: 0,
            apps: []
        };
    }
};

/**
 * Fetch Yearly Recap from Python Backend
 */
export const fetchYearlyRecap = async (): Promise<YearlyStats> => {
    if (window.pywebview) {
        try {
            return await window.pywebview.api.get_yearly_recap();
        } catch (error) {
            console.error("Python API Error:", error);
            throw error;
        }
    } else {
        console.warn("Pywebview not DETECTED. Returning empty recap.");
        return {
            year: new Date().getFullYear(),
            totalHours: 0,
            peakHour: "-",
            weekendPercentage: 0,

            mostProductiveDay: 0,
            topApp: {
                id: "0",
                name: "-",
                category: "Other" as any,
                durationSeconds: 0,
                lastActive: "",
                isProductive: false
            },
            topCategory: "-",
            monthlyUsage: Array(12).fill({ month: "-", hours: 0 }),
            dailyAverages: Array(7).fill({ day: 0, hours: 0 }),
            apps: []
        };
    }
};

export const setCategory = async (appId: string, category: string): Promise<boolean> => {
    if (window.pywebview) {
        return await window.pywebview.api.set_category(appId, category);
    }
    console.log(`Mock set category: ${appId} -> ${category}`);
    return true;
};

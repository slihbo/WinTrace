export enum AppCategory {
  PRODUCTIVITY = 'Productivity',
  DEVELOPMENT = 'Development',
  COMMUNICATION = 'Communication',
  ENTERTAINMENT = 'Entertainment', // Kept for backward compatibility if needed, though Games is preferred
  GAMES = 'Games',
  BROWSING = 'Browsing',
  SYSTEM = 'System',
  DESIGN_MEDIA = 'DesignMedia',
  CLOUD = 'Cloud',
  OTHER = 'Other'
}

export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface AppUsage {
  id: string;
  name: string;
  iconUrl?: string;
  category: AppCategory;
  durationSeconds: number; // Duration active in the selected period
  lastActive: string; // ISO String
  isProductive: boolean;
}

export interface DailyStats {
  date: string;
  viewMode: ViewMode;
  totalDurationSeconds: number;
  productivityScore: number; // 0-100
  apps: AppUsage[];
}

export interface MonthlyUsage {
  month: number; // 1-12
  hours: number;
}

export interface YearlyStats {
  year: number;
  totalHours: number;
  peakHour: string; // e.g., "14:00"
  weekendPercentage: number; // 0-100
  mostProductiveDay: number; // 0-6 (Mon-Sun)
  topApp: AppUsage;
  topCategory: string;
  categoryBreakdown: { category: string; percentage: number }[];
  monthlyUsage: MonthlyUsage[]; // Array of 12 months
  dailyAverages: { day: number; hours: number }[]; // day: 0-6
  apps: AppUsage[];
}
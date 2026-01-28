import { DailyStats, YearlyStats, ViewMode } from '../types';

// ============================================================================
// ENTEGRASYON NOTU:
// Bu dosya artık rastgele veri üretmiyor. Kendi yazdığın backend yazılımına
// buradan istek atmalısın.
// ============================================================================

/**
 * Süreyi biçimlendirmek için yardımcı fonksiyon (UI tarafından kullanılır)
 */
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

/**
 * Backend'den Günlük/Haftalık/Aylık verileri çeken fonksiyon.
 * @param date Seçilen tarih
 * @param viewMode Görünüm modu (daily, weekly, monthly, custom...)
 * @param customRange Eğer 'custom' seçildiyse başlangıç-bitiş tarihleri
 */
export const fetchDailyStats = async (
  date: Date, 
  viewMode: ViewMode, 
  customRange?: { start: Date, end: Date }
): Promise<DailyStats> => {
  
  // TODO: BURAYA KENDİ API ÇAĞRINI EKLE
  // Örnek:
  // const response = await fetch(`http://localhost:5000/api/stats?date=${date.toISOString()}&mode=${viewMode}`);
  // return await response.json();

  console.log("Backend'e istek atılıyor...", { date, viewMode, customRange });

  // Backend bağlanana kadar uygulama patlamasın diye BOŞ veri dönüyoruz.
  // Kendi programınla birleştirdiğinde burayı silip gerçek veriyi return etmelisin.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        date: date.toLocaleDateString(),
        viewMode: viewMode,
        totalDurationSeconds: 0,
        productivityScore: 0,
        apps: [] // Uygulama listesi boş
      });
    }, 500); // 500ms yapay gecikme (loading'i görmek için)
  });
};

/**
 * Backend'den Yıllık Özet (Recap) verilerini çeken fonksiyon.
 */
export const fetchYearlyRecap = async (): Promise<YearlyStats> => {
  
  // TODO: BURAYA KENDİ API ÇAĞRINI EKLE
  // Örnek:
  // const response = await fetch('http://localhost:5000/api/yearly-recap');
  // return await response.json();

  console.log("Yıllık özet isteği atılıyor...");

  // Backend bağlanana kadar uygulama patlamasın diye BOŞ veri dönüyoruz.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        year: new Date().getFullYear(),
        totalHours: 0,
        peakHour: "-",
        weekendPercentage: 0,
        longestSessionHours: 0,
        mostProductiveDay: "-",
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
        apps: []
      });
    }, 500);
  });
};
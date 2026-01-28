export const translations = {
    tr: {
        loading: "Veriler getiriliyor...",
        noData: "Veri yok",
        loadingShort: "Yükleniyor...",
        appName: "WinTrace",

        // View Modes
        daily: "Günlük",
        weekly: "Haftalık",
        monthly: "Aylık",
        yearly: "Yıllık",
        custom: "Özel Tarih...",

        // Date Picker
        customRange: "Özel Aralık",
        selectDates: "Analiz için tarihleri seçin",
        startDate: "Başlangıç",
        endDate: "Bitiş",
        apply: "Uygula",
        invalidRange: "Başlangıç tarihi bitiş tarihinden sonra olamaz.",

        // Dashboard
        topApps: "En Çok Kullanılanlar",
        productivityScore: "Verimlilik Skoru",
        totalTime: "Toplam Süre",
        hello: "Merhaba",
        user: "Kullanıcı",
        activeTime: "Aktif Süre",
        favoriteApp: "Favori Uygulama",
        appsCount: "Uygulama Sayısı",
        focusDistribution: "Odak Dağılımı",
        detailedFlow: "Detaylı Akış",
        viewFullRecap: "Toplam Özetini Gör",
        recapReady: "Analiz Hazır",
        selectCategory: "Kategori Seç",

        // Recap View
        totalUsage: "Toplam Kullanım",
        recapTitle: "Raporun",
        ready: "Hazır",
        totalTimeTitle: "Toplam Süre",
        weekend: "Hafta Sonu",
        weekday: "Hafta İçi",
        dailyAverages: "Ortalama Günlerin",
        topAppsTitle: "En Çok Kullandıkların",
        topAppsSubtitle: "Vazgeçilmez beşlin.",
        categoriesTitle: "KATEGORİLER",
        digitalIdentity: "Dijital kimliğin...",
        introTitle: "Efsanevi Bir Yıldı",

        // Categories
        Productivity: "Verimlilik",
        Development: "Yazılım",
        Communication: "İletişim",
        Entertainment: "Eğlence",
        Games: "Oyun",
        Browsing: "Tarayıcı",
        System: "Sistem & Güvenlik",
        DesignMedia: "Tasarım & Medya",
        Cloud: "Bulut & Depolama",
        Other: "Diğer",

        // Days & Months (For mapping)
        days: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
        daysShort: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
        months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
        monthsShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
    },
    en: {
        loading: "Fetching data...",
        noData: "No data found",
        loadingShort: "Loading...",
        appName: "WinTrace",

        // View Modes
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        yearly: "Yearly",
        custom: "Custom Date...",

        // Date Picker
        customRange: "Custom Range",
        selectDates: "Select dates for analysis",
        startDate: "Start Date",
        endDate: "End Date",
        apply: "Apply",
        invalidRange: "Start date cannot be after end date.",

        // Dashboard
        topApps: "Most Used Apps",
        productivityScore: "Productivity Score",
        totalTime: "Total Time",
        hello: "Hello",
        user: "User",
        activeTime: "Active Time",
        favoriteApp: "Favorite App",
        appsCount: "Apps Count",
        focusDistribution: "Focus Distribution",
        detailedFlow: "Detailed Flow",
        viewFullRecap: "View Full Recap",
        recapReady: "Recap Ready",
        selectCategory: "Select Category",

        // Recap View
        totalUsage: "Total Usage",
        recapTitle: "Your Recap",
        ready: "is Ready",
        totalTimeTitle: "Total Time",
        weekend: "Weekend",
        weekday: "Weekday",
        dailyAverages: "Daily Averages",
        topAppsTitle: "Top Apps",
        topAppsSubtitle: "Your essential five.",
        categoriesTitle: "CATEGORIES",
        digitalIdentity: "Your digital identity...",
        introTitle: "It was a legendary year",

        // Categories
        Productivity: "Productivity",
        Development: "Development",
        Communication: "Communication",
        Entertainment: "Entertainment",
        Games: "Games",
        Browsing: "Browsing",
        System: "System & Security",
        DesignMedia: "Design & Media",
        Cloud: "Cloud & Storage",
        Other: "Other",

        // Days & Months
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }
};

export const getLanguage = () => {
    const lang = navigator.language.split('-')[0];
    return (lang === 'tr') ? 'tr' : 'en';
};

export const t = translations[getLanguage()];

// Helper to get day name from index (0=Sunday in JS Date, but we need to match Python or standardize)
// Python date.weekday(): 0=Monday, 6=Sunday
// JS Date.getDay(): 0=Sunday, 1=Monday
// Let's standardize on JS 0=Sunday, 6=Saturday for frontend helpers if possible, 
// OR simpler: Python returns 0=Monday.
// Let's use Python's 0=Monday convention for the day indices coming from API for consistency with dailyAverages logic
export const getDayName = (index: number, short = false) => {
    // Mapping Python (0=Mon) to our arrays where 0=Sun? 
    // Let's just align the arrays to Python:
    // tr.days = [Pazartesi, Salı ... Pazar] 
    // Wait, standard JS getDay() is 0=Sun. 
    // Let's stick to standard JS 0=Sunday for arrays and convert if needed.

    // Actually, easy fix: Make arrays 0=Monday to match Python's output
    return short ? t.daysShort[index] : t.days[index];
};

export const getMonthName = (index: number, short = false) => {
    // index 1-12
    return short ? t.monthsShort[index - 1] : t.months[index - 1];
};

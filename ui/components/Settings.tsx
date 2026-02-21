import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Download, Upload, Globe, Monitor, Clock, Zap, Bell, Database } from 'lucide-react';
import { t } from '../utils/i18n';

interface SettingsData {
    language: string;
    autoStart: boolean;
    idleThreshold: number;
    trackingInterval: number;
    breakReminder: boolean;
    breakInterval: number;
    storageBackend: string;
}

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const defaultSettings: SettingsData = {
    language: 'auto',
    autoStart: true,
    idleThreshold: 180,
    trackingInterval: 1,
    breakReminder: true,
    breakInterval: 45,
    storageBackend: 'json',
};

export default function Settings({ isOpen, onClose }: SettingsProps) {
    const [settings, setSettings] = useState<SettingsData>(defaultSettings);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            if (window.pywebview?.api) {
                const s = await window.pywebview.api.get_settings();
                if (s) setSettings(s);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    };

    const saveSettings = async (newSettings: Partial<SettingsData>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        setSaving(true);
        try {
            if (window.pywebview?.api) {
                await window.pywebview.api.update_settings(updated);
            }
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
        setTimeout(() => setSaving(false), 500);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            if (window.pywebview?.api) {
                const data = await window.pywebview.api.export_data(exportFormat);
                if (data) {
                    const blob = new Blob([data], {
                        type: exportFormat === 'csv' ? 'text/csv' : 'application/json'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `wintrace_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            }
        } catch (e) {
            console.error('Export failed:', e);
        }
        setExporting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <SettingsIcon size={20} className="text-white/70" />
                        <h2 className="text-lg font-semibold text-white">{t.settings || 'Ayarlar'}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={18} className="text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* Language */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Globe size={16} />
                            {t.settingsLanguage || 'Dil'}
                        </label>
                        <select
                            value={settings.language}
                            onChange={(e) => saveSettings({ language: e.target.value })}
                            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        >
                            <option value="auto">{t.settingsAutoDetect || 'Otomatik Algıla'}</option>
                            <option value="tr">Türkçe</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    {/* Auto Start */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Monitor size={16} />
                            {t.settingsAutoStart || 'Bilgisayar açılışında başlat'}
                        </label>
                        <button
                            onClick={() => saveSettings({ autoStart: !settings.autoStart })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.autoStart ? 'bg-emerald-500' : 'bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.autoStart ? 'translate-x-[22px]' : 'translate-x-0.5'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Idle Threshold */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Clock size={16} />
                            {t.settingsIdleThreshold || 'Boşta kalma süresi'}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={60}
                                max={600}
                                step={30}
                                value={settings.idleThreshold}
                                onChange={(e) => saveSettings({ idleThreshold: parseInt(e.target.value) })}
                                className="flex-1 accent-white"
                            />
                            <span className="text-sm text-white/60 w-16 text-right">
                                {Math.floor(settings.idleThreshold / 60)} {t.settingsMinutes || 'dk'}
                            </span>
                        </div>
                        <p className="text-xs text-white/40">
                            {t.settingsIdleDesc || 'Bu süre boyunca mouse/klavye kullanılmazsa takip duraklar'}
                        </p>
                    </div>

                    {/* Tracking Interval */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Zap size={16} />
                            {t.settingsTrackingInterval || 'Takip aralığı'}
                        </label>
                        <select
                            value={settings.trackingInterval}
                            onChange={(e) => saveSettings({ trackingInterval: parseInt(e.target.value) })}
                            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        >
                            <option value={1}>1 {t.settingsSeconds || 'saniye'}</option>
                            <option value={3}>3 {t.settingsSeconds || 'saniye'}</option>
                            <option value={5}>5 {t.settingsSeconds || 'saniye'}</option>
                            <option value={10}>10 {t.settingsSeconds || 'saniye'}</option>
                        </select>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5" />

                    {/* Break Reminder */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Bell size={16} />
                            {t.settingsBreakReminder || 'Mola hatırlatıcı'}
                        </label>
                        <button
                            onClick={() => saveSettings({ breakReminder: !(settings as any).breakReminder })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${(settings as any).breakReminder ? 'bg-emerald-500' : 'bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(settings as any).breakReminder ? 'translate-x-[22px]' : 'translate-x-0.5'
                                    }`}
                            />
                        </button>
                    </div>

                    {(settings as any).breakReminder && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={15}
                                    max={120}
                                    step={5}
                                    value={(settings as any).breakInterval || 45}
                                    onChange={(e) => saveSettings({ breakInterval: parseInt(e.target.value) } as any)}
                                    className="flex-1 accent-white"
                                />
                                <span className="text-sm text-white/60 w-16 text-right">
                                    {(settings as any).breakInterval || 45} {t.settingsMinutes || 'dk'}
                                </span>
                            </div>
                            <p className="text-xs text-white/40">
                                {t.settingsBreakDesc || 'Kesintisiz çalışma sonrası mola hatırlatması'}
                            </p>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-white/5" />

                    {/* Storage Backend */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Database size={16} />
                            {t.settingsStorageBackend || 'Veri depolama'}
                        </label>
                        <select
                            value={(settings as any).storageBackend || 'json'}
                            onChange={(e) => saveSettings({ storageBackend: e.target.value } as any)}
                            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                        >
                            <option value="json">JSON</option>
                            <option value="sqlite">SQLite</option>
                        </select>
                        <p className="text-xs text-white/40">
                            {t.settingsStorageDesc || 'Yeniden başlatma gerektirir. SQLite büyük veri setleri için daha hızlıdır.'}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5" />

                    {/* Data Export */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Download size={16} />
                            {t.settingsExportData || 'Verileri Dışa Aktar'}
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                                className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                            >
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                            </select>
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="px-4 py-2.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
                            >
                                {exporting ? '...' : (t.settingsExport || 'Dışa Aktar')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 flex justify-center">
                    <span className={`text-xs transition-opacity duration-300 ${saving ? 'text-emerald-400 opacity-100' : 'text-white/30 opacity-0'}`}>
                        {t.settingsSaved || '✓ Kaydedildi'}
                    </span>
                </div>
            </div>
        </div>
    );
}

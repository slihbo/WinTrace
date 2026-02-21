import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Download, Upload, Globe, Monitor, Clock, Zap, Bell, Database } from 'lucide-react';
import { t } from '../utils/i18n';

interface SettingsData {
    language: string;
    autoStart: boolean;
    idleThreshold: number;
    idleDetectionEnabled: boolean;
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
    idleDetectionEnabled: true,
    trackingInterval: 3,
    breakReminder: true,
    breakInterval: 45,
    storageBackend: 'sqlite',
};

export default function Settings({ isOpen, onClose }: SettingsProps) {
    const [settings, setSettings] = useState<SettingsData>(defaultSettings);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

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
                const success = await window.pywebview.api.export_data_dialog(exportFormat);
                if (success) {
                    alert(t.settingsSaved || '✓ Kaydedildi');
                }
            }
        } catch (e) {
            console.error('Export failed:', e);
        }
        setExporting(false);
    };

    const handleImport = async () => {
        if (!confirm('Mevcut verilerin üzerine ekleme yapılacak. Devam etmek istiyor musunuz?')) return;

        setImporting(true);
        try {
            if (window.pywebview?.api) {
                const success = await window.pywebview.api.import_data_dialog();
                if (success) {
                    alert(t.settingsImportSuccess || 'Veriler başarıyla içe aktarıldı');
                    window.location.reload(); // Reload to show new data
                } else {
                    alert(t.settingsImportError || 'İçe aktarma hatası veya iptal edildi');
                }
            }
        } catch (e) {
            console.error('Import failed:', e);
            alert(t.settingsImportError || 'İçe aktarma hatası');
        }
        setImporting(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onMouseDown={(e) => e.stopPropagation()}
        >
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

                    {/* Idle Detection Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Clock size={16} />
                            {t.settingsIdleDetection || 'Boşta kalma tespiti'}
                        </label>
                        <button
                            onClick={() => saveSettings({ idleDetectionEnabled: !settings.idleDetectionEnabled })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.idleDetectionEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                                }`}
                        >
                            <div
                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.idleDetectionEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Idle Threshold */}
                    {settings.idleDetectionEnabled && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-6">
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
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="flex-1 accent-white"
                                />
                                <span className="text-sm text-white/60 w-16 text-right">
                                    {Math.floor(settings.idleThreshold / 60)} {t.settingsMinutes || 'dk'}
                                </span>
                            </div>
                            <p className="text-xs text-white/40 ml-6">
                                {t.settingsIdleDesc || 'Bu süre boyunca mouse/klavye kullanılmazsa takip duraklar'}
                            </p>
                        </div>
                    )}

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
                                    max={300}
                                    step={15}
                                    value={(settings as any).breakInterval || 45}
                                    onChange={(e) => saveSettings({ breakInterval: parseInt(e.target.value) } as any)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="flex-1 accent-white"
                                />
                                <span className="text-sm text-white/60 w-16 text-right">
                                    {Math.floor(((settings as any).breakInterval || 45) / 60) > 0
                                        ? `${Math.floor(((settings as any).breakInterval || 45) / 60)}sa ${((settings as any).breakInterval || 45) % 60}dk`
                                        : `${(settings as any).breakInterval || 45}dk`}
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
                                onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'pdf')}
                                className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                            >
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                                <option value="pdf">PDF</option>
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

                    {/* Data Import */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Upload size={16} />
                            {t.settingsImportData || 'Verileri İçe Aktar'}
                        </label>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors border border-emerald-500/20 disabled:opacity-50"
                        >
                            {importing ? '...' : (t.settingsImport || 'İçe Aktar')}
                        </button>
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

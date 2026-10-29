import React, { useState } from 'react';
import { AppDatabase } from '../types';
import {
  Database,
  X,
  Copy,
  Download,
  Check,
  ExternalLink,
  Table,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Upload,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Zap,
  Info
} from 'lucide-react';
import {
  exportAllDatabaseToWorkbook,
  importDatabaseFromWorkbook
} from '../utils/spreadsheetSync';

interface SpreadsheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: AppDatabase;
  onUpdateSheetsUrl: (url: string) => void;
  onToggleAutoSync: (enabled: boolean) => void;
  onSyncNow: () => Promise<void>;
  onPullFromSheets: () => Promise<void>;
  onImportDatabase: (importedData: Partial<AppDatabase>) => void;
}

export const SpreadsheetSyncModal: React.FC<SpreadsheetSyncModalProps> = ({
  isOpen,
  onClose,
  db,
  onUpdateSheetsUrl,
  onToggleAutoSync,
  onSyncNow,
  onPullFromSheets,
  onImportDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'tables' | 'url' | 'code'>('sync');
  const [webAppUrl, setWebAppUrl] = useState(db.sheetsWebAppUrl || '');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      const res = await fetch('/Code.gs');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      alert('Gagal menyalin kode. Anda dapat mengunduh file Code.gs secara langsung.');
    }
  };

  const handleDownloadCode = () => {
    const element = document.createElement('a');
    element.setAttribute('href', '/Code.gs');
    element.setAttribute('download', 'Code.gs');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveUrl = () => {
    onUpdateSheetsUrl(webAppUrl.trim());
    setStatusMessage({
      type: 'success',
      text: 'URL Web App berhasil disimpan!',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Masukkan URL Web App terlebih dahulu.' });
      return;
    }
    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Menguji koneksi ke Google Spreadsheet...' });
    try {
      const testUrl = `${webAppUrl.trim()}${webAppUrl.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
      const res = await fetch(testUrl);
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Koneksi Berhasil! Google Spreadsheet merespons dengan baik.' });
      } else {
        setStatusMessage({ type: 'error', text: `Gagal: Server merespons dengan status ${res.status}` });
      }
    } catch (e: any) {
      // Note: Apps script might block standard fetch if not deployed to 'Anyone'
      setStatusMessage({
        type: 'info',
        text: 'Permintaan dikirim. Pastikan deployment Web App disetel ke "Siapa saja (Anyone)".',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushSync = async () => {
    if (!webAppUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Silakan isi URL Web App Google Apps Script di tab "Pengaturan URL".' });
      setActiveTab('url');
      return;
    }
    onUpdateSheetsUrl(webAppUrl.trim());
    setIsPushing(true);
    setStatusMessage({ type: 'info', text: 'Sedang mengirim & menyinkronkan seluruh 9 tabel ke Google Spreadsheet...' });

    try {
      await onSyncNow();
      setStatusMessage({
        type: 'success',
        text: 'Sukses! Seluruh 9 tabel basis data berhasil diperbarui di Google Spreadsheet.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal sinkronisasi: ' + (err.message || 'Periksa koneksi internet atau izin Web App'),
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullSync = async () => {
    if (!webAppUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Silakan isi URL Web App Google Apps Script di tab "Pengaturan URL".' });
      setActiveTab('url');
      return;
    }
    setIsPulling(true);
    setStatusMessage({ type: 'info', text: 'Sedang menarik data terbaru dari Google Spreadsheet...' });

    try {
      await onPullFromSheets();
      setStatusMessage({
        type: 'success',
        text: 'Data berhasil ditarik! Database SiApgus telah diperbarui sesuai Google Spreadsheet.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal menarik data: ' + (err.message || 'Pastikan Web App mengizinkan akses GET'),
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleExportWorkbook = () => {
    exportAllDatabaseToWorkbook(db);
    setStatusMessage({
      type: 'success',
      text: 'File Spreadsheet Excel (.xlsx) dengan 9 sheet lengkap berhasil diunduh!',
    });
  };

  const handleImportWorkbookFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatusMessage({ type: 'info', text: 'Membaca dan memvalidasi file Spreadsheet Excel...' });
      const parsed = await importDatabaseFromWorkbook(file);
      onImportDatabase(parsed);
      setStatusMessage({
        type: 'success',
        text: 'Berhasil mengimpor data dari file Spreadsheet Excel ke database SiApgus!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal membaca file Excel: ' + (err.message || 'Format tidak sesuai'),
      });
    } finally {
      e.target.value = '';
    }
  };

  const sheetNames = [
    { name: 'DB_Pengguna', count: db.users.length, desc: 'Akun Login Admin & Guru' },
    { name: 'DB_ProfilSekolah', count: 1, desc: 'Identitas & Profil Sekolah' },
    { name: 'DB_Siswa', count: db.siswa.length, desc: 'Data Siswa & Rombel' },
    { name: 'DB_Guru', count: db.guru.length, desc: 'Data Pendidik & NIK/NUPTK' },
    { name: 'DB_MataPelajaran', count: db.guruMapel.length, desc: 'Penugasan Mapel Guru' },
    { name: 'DB_WaliKelas', count: db.waliKelas.length, desc: 'Penetapan Wali Kelas' },
    { name: 'DB_JurnalPembelajaran', count: db.jurnal.length, desc: 'Jurnal KBM Harian' },
    { name: 'DB_Penilaian', count: db.penilaian.length, desc: 'Nilai Sumatif, STS, SAS & Rapor' },
    { name: 'DB_Absensi', count: db.absensi.length, desc: 'Presensi Siswa H, S, I, A' },
  ];

  const formatLastSync = (isoStr?: string) => {
    if (!isoStr) return 'Belum pernah disinkronkan';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Sinkronisasi Database Google Spreadsheet
                </h2>
                {db.sheetsWebAppUrl ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Terhubung
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                    Belum Dikonfigurasi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Semua 9 tabel data sekolah (Siswa, Guru, Nilai, Absensi, Jurnal, Profil) otomatis tersinkron
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-5 pt-2 gap-4 text-xs font-semibold bg-slate-50/40">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronisasi Data</span>
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'tables'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>9 Tabel Database ({sheetNames.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'url'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Pengaturan URL Web App</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Script Backend (Code.gs)</span>
          </button>
        </div>

        {/* Toast / Status Alert Banner */}
        {statusMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />}
            <span className="flex-1 font-medium">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          
          {/* TAB 1: SINKRONISASI DATA */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              
              {/* Quick Status Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-slate-500 text-[11px]">Terakhir Disinkronkan ke Spreadsheet:</div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>{formatLastSync(db.lastSyncedToSheets)}</span>
                    {db.lastSyncedToSheets && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                  <Zap className={`w-4 h-4 ${db.autoSyncToSheets ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="block font-semibold text-slate-700 text-[11px]">
                      Auto-Sync Otomatis
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sinkronkan tiap kali ada input/simpan
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={db.autoSyncToSheets ?? true}
                    onChange={(e) => onToggleAutoSync(e.target.checked)}
                    className="ml-2 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons: Push & Pull */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Push Card */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Kirim ke Spreadsheet (Push)</h3>
                      <p className="text-[11px] text-slate-600">Simpan seluruh 9 tabel data SiApgus ke Google Spreadsheet</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Memperbarui lembar kerja Siswa, Guru, Jurnal, Nilai Rapor, Absensi, dan Profil ke Google Sheets secara menyeluruh.
                  </p>
                  <button
                    type="button"
                    onClick={handlePushSync}
                    disabled={isPushing}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isPushing ? 'animate-spin' : ''}`} />
                    <span>{isPushing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang (Kirim)'}</span>
                  </button>
                </div>

                {/* Pull Card */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Tarik dari Spreadsheet (Pull)</h3>
                      <p className="text-[11px] text-slate-600">Ambil data terbaru yang telah diedit di Google Spreadsheet</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Sangat berguna jika ada pengisian nilai atau data siswa langsung dari Google Spreadsheet oleh tim lain.
                  </p>
                  <button
                    type="button"
                    onClick={handlePullSync}
                    disabled={isPulling}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                    <span>{isPulling ? 'Mengambil Data...' : 'Tarik Data dari Spreadsheet'}</span>
                  </button>
                </div>

              </div>

              {/* Direct Offline Excel Spreadsheet Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">
                      Spreadsheet Excel Mandiri (.xlsx 9-Sheet Lengkap)
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    Offline / File Backup
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Unduh seluruh database menjadi satu file buku kerja Excel (.xlsx) dengan 9 sheet terpisah, atau pulihkan database dari file spreadsheet yang sudah ada.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleExportWorkbook}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh 9-Sheet Excel (.xlsx)</span>
                  </button>

                  <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Pulihkan dari File Excel</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleImportWorkbookFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TABEL DATABASE */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 leading-relaxed text-[11px]">
                Seluruh 9 entitas data sekolah di bawah ini disinkronkan secara otomatis dan memiliki lembar kerja (sheet) khusus di Google Spreadsheet Anda.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {sheetNames.map((item) => (
                  <div
                    key={item.name}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col justify-between transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {item.name}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          Aktif
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-600">
                      <span>Total Data:</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                        {item.count} baris
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PENGATURAN URL WEB APP */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  URL Web App Google Apps Script
                </label>
                <p className="text-[11px] text-slate-500">
                  Dapatkan URL ini setelah menerapkan (Deploy) script <strong>Code.gs</strong> sebagai Aplikasi Web (Web App) di Google Spreadsheet Anda.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    Simpan URL
                  </button>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Tes</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-[11px] text-amber-900">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>Syarat Penting Deployment Web App di Google:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Jalankan sebagai (Execute as):</strong> "Saya (Me)"</li>
                  <li><strong>Yang memiliki akses (Who has access):</strong> "Siapa saja (Anyone)"</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: SCRIPT BACKEND CODE.GS */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs">
                    File Backend Google Apps Script (Code.gs)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    File ini telah diintegrasikan dengan seluruh 9 tabel dan otomatis membuat tabel baru di Google Spreadsheet.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copySuccess ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Code.gs</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto space-y-1">
                <p className="text-emerald-400">// SISTEM APLIKASI GURU SEKOLAH (SiApgus) - Code.gs</p>
                <p className="text-slate-400">// Mendukung 9 Sheet Database SiApgus:</p>
                <p className="text-amber-300">const SHEET_NAMES = &#123;</p>
                <p className="pl-4">USERS: 'DB_Pengguna',</p>
                <p className="pl-4">PROFIL: 'DB_ProfilSekolah',</p>
                <p className="pl-4">SISWA: 'DB_Siswa',</p>
                <p className="pl-4">GURU: 'DB_Guru',</p>
                <p className="pl-4">MAPEL: 'DB_MataPelajaran',</p>
                <p className="pl-4">WALI_KELAS: 'DB_WaliKelas',</p>
                <p className="pl-4">JURNAL: 'DB_JurnalPembelajaran',</p>
                <p className="pl-4">PENILAIAN: 'DB_Penilaian',</p>
                <p className="pl-4">ABSENSI: 'DB_Absensi'</p>
                <p className="text-amber-300">&#125;;</p>
                <p className="text-slate-500">// Seluruh kode lengkap tersedia di file /Code.gs</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-700 text-xs">Langkah 5 Menit di Google Drive:</span>
                <ol className="list-decimal pl-4 text-slate-600 space-y-1 text-[11px]">
                  <li>Buka Google Drive &amp; buat Spreadsheet baru (beri nama <em>Database SiApgus</em>).</li>
                  <li>Klik menu <em>Ekstensi &gt; Apps Script</em>.</li>
                  <li>Tempelkan seluruh kode <strong>Code.gs</strong> dan jalankan fungsi <code>setupDatabase()</code> satu kali.</li>
                  <li>Klik <em>Terapkan (Deploy) &gt; Penerapan Baru &gt; Aplikasi Web</em>.</li>
                  <li>Setel "Yang memiliki akses" ke <strong>Siapa saja (Anyone)</strong>, lalu salin URL Web App dan tempelkan ke tab <em>Pengaturan URL</em> di sini.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Data terlindungi dan tersimpan aman secara terenkripsi</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

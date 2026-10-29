import React from 'react';
import { SchoolProfile, UserAccount } from '../types';
import { Menu, LogOut, Database, RefreshCw, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  currentUser: UserAccount;
  profile: SchoolProfile;
  activeMenu: string;
  onLogout: () => void;
  onOpenSpreadsheetSync: () => void;
  isSyncing?: boolean;
  lastSyncedToSheets?: string;
  hasSheetsUrl?: boolean;
  onQuickSync?: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  currentUser,
  profile,
  activeMenu,
  onLogout,
  onOpenSpreadsheetSync,
  isSyncing = false,
  lastSyncedToSheets,
  hasSheetsUrl = false,
  onQuickSync,
}) => {
  // Format breadcrumb title
  const getBreadcrumbTitle = (menu: string) => {
    switch (menu) {
      case 'admin-dashboard':
        return 'Dashboard Administrator';
      case 'admin-siswa':
        return 'Manajemen Data Siswa';
      case 'admin-guru':
        return 'Manajemen Data Guru';
      case 'admin-mapel':
        return 'Guru Mata Pelajaran';
      case 'admin-wali-kelas':
        return 'Penetapan Wali Kelas';
      case 'admin-setting':
        return 'Pengaturan Profil Sekolah';
      case 'guru-dashboard':
        return 'Dashboard Guru';
      case 'guru-jurnal':
        return 'Jurnal Pembelajaran Harian';
      case 'guru-penilaian':
        return 'Data Penilaian Rapor';
      case 'guru-absensi':
        return 'Absensi Siswa Harian';
      case 'guru-cetak-absen':
        return 'Cetak Rekap Absensi';
      case 'guru-cetak-rapor':
        return 'Cetak Rapor Siswa';
      default:
        return 'Sistem Informasi Guru';
    }
  };

  const formatShortTime = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: 3-line hamburger button + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Buka tutup sidebar"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          title="Buka / Tutup Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand identity on mobile, Breadcrumb on desktop */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">SiApgus</span>
            <span>/</span>
            <span className="text-blue-600 font-bold">
              {getBreadcrumbTitle(activeMenu)}
            </span>
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 truncate max-w-36">
              {profile.namaSekolah || 'SiApgus'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick actions & User badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-Time Spreadsheet Sync Button & Indicator */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSpreadsheetSync}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
              hasSheetsUrl
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Kelola Sinkronisasi Google Spreadsheet"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : hasSheetsUrl ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Database className="w-3.5 h-3.5 text-slate-500" />
            )}
            
            <span className="hidden sm:inline">
              {isSyncing
                ? 'Menyinkronkan...'
                : hasSheetsUrl
                ? `Tersinkron Spreadsheet ${lastSyncedToSheets ? `(${formatShortTime(lastSyncedToSheets)})` : ''}`
                : 'Hubungkan Spreadsheet'}
            </span>
            <span className="sm:hidden">
              {isSyncing ? 'Sync...' : 'Sheets'}
            </span>
          </button>

          {/* Quick sync button if URL is connected */}
          {hasSheetsUrl && onQuickSync && (
            <button
              type="button"
              onClick={onQuickSync}
              disabled={isSyncing}
              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition cursor-pointer disabled:opacity-50"
              title="Sinkronkan Sekarang ke Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
            {currentUser.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block text-left text-xs">
            <p className="font-bold text-slate-800 truncate max-w-40" title={currentUser.fullName}>
              {currentUser.fullName}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">
              {currentUser.role === 'admin' ? 'Administrator' : 'Guru'}
            </p>
          </div>
        </div>

        {/* Logout Quick Button */}
        <button
          type="button"
          onClick={onLogout}
          title="Keluar Aplikasi"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

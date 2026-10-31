/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AppDatabase,
  Guru,
  GuruMapelAssignment,
  JurnalItem,
  KelasItem,
  MataPelajaran,
  PenilaianItem,
  SchoolProfile,
  Siswa,
  UserAccount,
  WaliKelasAssignment,
  AbsensiRecord
} from './types';
import { getDatabase, saveDatabase, fetchServerDatabase, saveServerDatabase } from './storage/db';
import { syncPushToSpreadsheet, syncPullFromSpreadsheet } from './utils/spreadsheetSync';

import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SpreadsheetSyncModal } from './components/SpreadsheetSyncModal';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminMenuSiswa } from './components/admin/AdminMenuSiswa';
import { AdminMenuGuru } from './components/admin/AdminMenuGuru';
import { AdminMenuGuruMapel } from './components/admin/AdminMenuGuruMapel';
import { AdminMenuWaliKelas } from './components/admin/AdminMenuWaliKelas';
import { AdminMenuSetting } from './components/admin/AdminMenuSetting';

// Guru Views
import { GuruDashboard } from './components/guru/GuruDashboard';
import { GuruMenuJurnal } from './components/guru/GuruMenuJurnal';
import { GuruRaporPenilaian } from './components/guru/GuruRaporPenilaian';
import { GuruMenuAbsensi } from './components/guru/GuruMenuAbsensi';
import { GuruMenuCetakAbsen } from './components/guru/GuruMenuCetakAbsen';
import { GuruMenuCetakRapor } from './components/guru/GuruMenuCetakRapor';
import { findWaliAssignment } from './utils/waliKelas';
import { updateAppFavicon } from './utils/favicon';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  // Database State
  const [db, setDb] = useState<AppDatabase>(() => getDatabase());

  // Current Authentication Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loginTime, setLoginTime] = useState<string>('');

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>('admin-dashboard');
  const [spreadsheetModalOpen, setSpreadsheetModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const autoSyncTimerRef = useRef<any>(null);

  // Load centralized server database on boot and poll every 8 seconds for multi-device sync
  useEffect(() => {
    let isMounted = true;

    const syncWithServer = async () => {
      try {
        const serverDb = await fetchServerDatabase();
        if (serverDb && isMounted) {
          setDb(serverDb);
        }
      } catch (err) {
        console.warn('Initial server sync warning:', err);
      }
    };

    syncWithServer();

    // Polling interval so updates from any other computer/phone are reflected automatically
    const pollInterval = setInterval(async () => {
      try {
        const latestDb = await fetchServerDatabase();
        if (latestDb && isMounted) {
          setDb(latestDb);
        }
      } catch {
        // Silent background polling
      }
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Real-time Dynamic Favicon: automatically updates browser tab icon whenever school logo is uploaded/saved
  useEffect(() => {
    updateAppFavicon(db.profile.logoUrl);
  }, [db.profile.logoUrl]);

  // Sync state changes to localStorage and permanently to server so it never resets across devices
  const updateDb = (newDb: AppDatabase, skipAutoSync: boolean = false) => {
    setDb(newDb);
    saveDatabase(newDb); // Local fallback cache
    saveServerDatabase(newDb); // Central server persistence for all users/devices

    if (!skipAutoSync && newDb.sheetsWebAppUrl && newDb.autoSyncToSheets !== false) {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
      }
      autoSyncTimerRef.current = setTimeout(async () => {
        try {
          setIsSyncing(true);
          await syncPushToSpreadsheet(newDb.sheetsWebAppUrl!, newDb);
          const syncedTimestamp = new Date().toISOString();
          setDb((prev) => {
            const updated = { ...prev, lastSyncedToSheets: syncedTimestamp };
            saveDatabase(updated);
            saveServerDatabase(updated);
            return updated;
          });
        } catch (err) {
          console.error('Background auto-sync error:', err);
        } finally {
          setIsSyncing(false);
        }
      }, 1500);
    }
  };

  // Login handler
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    const now = new Date();
    const formatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setLoginTime(formatted);

    // Set initial menu based on role
    if (user.role === 'admin') {
      setActiveMenu('admin-dashboard');
    } else {
      setActiveMenu('guru-dashboard');
    }
  };

  // Logout handler - returns to login screen, username and password will be empty
  const handleLogout = () => {
    setCurrentUser(null);
    setSidebarOpen(false);
  };

  // Register user handler
  const handleRegisterUser = (
    newUser: Omit<UserAccount, 'id' | 'createdAt'>
  ): UserAccount => {
    const userObj: UserAccount = {
      ...newUser,
      id: `USR-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // If registered as guru, also add to Guru table automatically if not already there
    let updatedGuruList = [...db.guru];
    if (newUser.role === 'guru') {
      const guruIndex = updatedGuruList.findIndex(
        (g) => g.nama.toLowerCase().trim() === newUser.fullName.toLowerCase().trim()
      );
      if (guruIndex === -1) {
        const newGuruId = `GUR-${Date.now()}`;
        updatedGuruList.push({
          id: newGuruId,
          nama: newUser.fullName,
          jenisKelamin: 'L',
          mapel: 'Umum',
          nikNuptk: newUser.nikNuptk || '',
        });
        userObj.assignedTeacherId = newGuruId;
      } else {
        userObj.assignedTeacherId = updatedGuruList[guruIndex].id;
        if (newUser.nikNuptk && !updatedGuruList[guruIndex].nikNuptk) {
          updatedGuruList[guruIndex] = {
            ...updatedGuruList[guruIndex],
            nikNuptk: newUser.nikNuptk,
          };
        }
      }
    }

    const updatedUsers = [...db.users, userObj];
    updateDb({
      ...db,
      users: updatedUsers,
      guru: updatedGuruList,
    });

    return userObj;
  };

  // Reset user password handler
  const handleResetPassword = (userId: string, newPassword: string): boolean => {
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return false;

    const updatedUsers = [...db.users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password: newPassword,
    };

    updateDb({
      ...db,
      users: updatedUsers,
    });
    return true;
  };

  // ---------------- ADMIN CRUD HANDLERS ----------------
  const handleAddSiswa = (siswaData: Omit<Siswa, 'id'>) => {
    const newSiswa: Siswa = {
      ...siswaData,
      id: `SIS-${Date.now()}`,
    };
    updateDb({
      ...db,
      siswa: [...db.siswa, newSiswa],
    });
  };

  const handleUpdateSiswa = (updatedSiswa: Siswa) => {
    updateDb({
      ...db,
      siswa: db.siswa.map((s) => (s.id === updatedSiswa.id ? updatedSiswa : s)),
    });
  };

  const handleDeleteSiswa = (id: string) => {
    updateDb({
      ...db,
      siswa: db.siswa.filter((s) => s.id !== id),
    });
  };

  const handleClearAllSiswa = () => {
    updateDb({
      ...db,
      siswa: [],
    });
  };

  const handleImportSiswaBatch = (newSiswaList: Siswa[]) => {
    updateDb({
      ...db,
      siswa: [...db.siswa, ...newSiswaList],
    });
  };

  // Guru Handlers
  const handleAddGuru = (guruData: Omit<Guru, 'id'>) => {
    const newGuru: Guru = {
      ...guruData,
      id: `GUR-${Date.now()}`,
    };
    updateDb({
      ...db,
      guru: [...db.guru, newGuru],
    });
  };

  const handleUpdateGuru = (updatedGuru: Guru) => {
    updateDb({
      ...db,
      guru: db.guru.map((g) => (g.id === updatedGuru.id ? updatedGuru : g)),
    });
  };

  const handleDeleteGuru = (id: string) => {
    updateDb({
      ...db,
      guru: db.guru.filter((g) => g.id !== id),
    });
  };

  const handleClearAllGuru = () => {
    updateDb({
      ...db,
      guru: [],
    });
  };

  const handleImportGuruBatch = (newGuruList: Guru[]) => {
    updateDb({
      ...db,
      guru: [...db.guru, ...newGuruList],
    });
  };

  // Mapel & Kelas Handlers
  const handleAddMapel = (item: Omit<MataPelajaran, 'id'>) => {
    const newMapel: MataPelajaran = { ...item, id: `MAP-${Date.now()}` };
    updateDb({
      ...db,
      mapelList: [...db.mapelList, newMapel],
    });
  };

  const handleDeleteMapel = (id: string) => {
    updateDb({
      ...db,
      mapelList: db.mapelList.filter((m) => m.id !== id),
    });
  };

  const handleAddKelas = (item: Omit<KelasItem, 'id'>) => {
    const newKelas: KelasItem = { ...item, id: `KLS-${Date.now()}` };
    updateDb({
      ...db,
      kelasList: [...db.kelasList, newKelas],
    });
  };

  const handleDeleteKelas = (id: string) => {
    updateDb({
      ...db,
      kelasList: db.kelasList.filter((k) => k.id !== id),
    });
  };

  const handleAddGuruMapelAssignment = (item: Omit<GuruMapelAssignment, 'id'>) => {
    const newAssignment: GuruMapelAssignment = {
      ...item,
      id: `GM-${Date.now()}`,
    };
    updateDb({
      ...db,
      guruMapel: [...db.guruMapel, newAssignment],
    });
  };

  const handleUpdateGuruMapelAssignment = (item: GuruMapelAssignment) => {
    updateDb({
      ...db,
      guruMapel: db.guruMapel.map((gm) => (gm.id === item.id ? item : gm)),
    });
  };

  const handleDeleteGuruMapelAssignment = (id: string) => {
    updateDb({
      ...db,
      guruMapel: db.guruMapel.filter((gm) => gm.id !== id),
    });
  };

  // Wali Kelas Handlers
  const handleAddWaliKelas = (item: Omit<WaliKelasAssignment, 'id'>) => {
    const newWali: WaliKelasAssignment = {
      ...item,
      id: `WK-${Date.now()}`,
    };
    updateDb({
      ...db,
      waliKelas: [...db.waliKelas, newWali],
    });
  };

  const handleUpdateWaliKelas = (item: WaliKelasAssignment) => {
    updateDb({
      ...db,
      waliKelas: db.waliKelas.map((wk) => (wk.id === item.id ? item : wk)),
    });
  };

  const handleDeleteWaliKelas = (id: string) => {
    updateDb({
      ...db,
      waliKelas: db.waliKelas.filter((wk) => wk.id !== id),
    });
  };

  // School Profile Handler
  const handleUpdateProfile = (newProfile: SchoolProfile) => {
    updateDb({
      ...db,
      profile: newProfile,
    });
  };

  // Jurnal Handlers
  const handleAddJurnal = (item: Omit<JurnalItem, 'id'>) => {
    const newItem: JurnalItem = { ...item, id: `JRN-${Date.now()}` };
    updateDb({
      ...db,
      jurnal: [newItem, ...db.jurnal],
    });
  };

  const handleUpdateJurnal = (item: JurnalItem) => {
    updateDb({
      ...db,
      jurnal: db.jurnal.map((j) => (j.id === item.id ? item : j)),
    });
  };

  const handleDeleteJurnal = (id: string) => {
    updateDb({
      ...db,
      jurnal: db.jurnal.filter((j) => j.id !== id),
    });
  };

  // Penilaian Batch Save Handler
  const handleSavePenilaianBatch = (updatedItems: PenilaianItem[]) => {
    const existingList = [...db.penilaian];
    updatedItems.forEach((item) => {
      const idx = existingList.findIndex(
        (p) =>
          p.siswaId === item.siswaId &&
          p.kelas === item.kelas &&
          p.rombel === item.rombel &&
          p.mapel === item.mapel &&
          p.tahunPelajaran === item.tahunPelajaran &&
          p.semester === item.semester
      );
      if (idx >= 0) {
        existingList[idx] = item;
      } else {
        existingList.push(item);
      }
    });

    updateDb({
      ...db,
      penilaian: existingList,
    });
  };

  // Absensi Batch Save Handler
  const handleSaveAbsensiBatch = (records: AbsensiRecord[]) => {
    const existingList = [...db.absensi];
    records.forEach((rec) => {
      const idx = existingList.findIndex(
        (a) =>
          a.siswaId === rec.siswaId &&
          a.tanggal === rec.tanggal &&
          a.kelas === rec.kelas &&
          a.rombel === rec.rombel
      );
      if (idx >= 0) {
        existingList[idx] = rec;
      } else {
        existingList.push(rec);
      }
    });

    updateDb({
      ...db,
      absensi: existingList,
    });
  };

  // Google Sheets Cloud Sync Handlers (Push & Pull)
  const handleSyncToSheets = async () => {
    if (!db.sheetsWebAppUrl) {
      throw new Error('URL Aplikasi Web Google Apps Script belum disetel.');
    }
    setIsSyncing(true);
    try {
      await syncPushToSpreadsheet(db.sheetsWebAppUrl, db);
      const syncedTimestamp = new Date().toISOString();
      const updatedDb = { ...db, lastSyncedToSheets: syncedTimestamp };
      setDb(updatedDb);
      saveDatabase(updatedDb);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (!db.sheetsWebAppUrl) {
      throw new Error('URL Aplikasi Web Google Apps Script belum disetel.');
    }
    setIsSyncing(true);
    try {
      const pulledData = await syncPullFromSpreadsheet(db.sheetsWebAppUrl);
      const updatedDb: AppDatabase = {
        ...db,
        ...(pulledData.profile ? { profile: pulledData.profile } : {}),
        ...(pulledData.siswa ? { siswa: pulledData.siswa } : {}),
        ...(pulledData.guru ? { guru: pulledData.guru } : {}),
        ...(pulledData.guruMapel ? { guruMapel: pulledData.guruMapel } : {}),
        ...(pulledData.waliKelas ? { waliKelas: pulledData.waliKelas } : {}),
        ...(pulledData.jurnal ? { jurnal: pulledData.jurnal } : {}),
        ...(pulledData.penilaian ? { penilaian: pulledData.penilaian } : {}),
        ...(pulledData.absensi ? { absensi: pulledData.absensi } : {}),
        ...(pulledData.users ? { users: pulledData.users } : {}),
        lastSyncedToSheets: new Date().toISOString(),
      };
      updateDb(updatedDb, true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportDatabase = (importedData: Partial<AppDatabase>) => {
    const mergedDb: AppDatabase = {
      ...db,
      ...(importedData.profile ? { profile: importedData.profile } : {}),
      ...(importedData.siswa ? { siswa: importedData.siswa } : {}),
      ...(importedData.guru ? { guru: importedData.guru } : {}),
      ...(importedData.penilaian ? { penilaian: importedData.penilaian } : {}),
      ...(importedData.absensi ? { absensi: importedData.absensi } : {}),
    };
    updateDb(mergedDb);
  };

  // If not logged in, show AuthScreen (Login & Register)
  if (!currentUser) {
    return (
      <AuthScreen
        profile={db.profile}
        users={db.users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleRegisterUser}
        onResetPassword={handleResetPassword}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        currentUser={currentUser}
        profile={db.profile}
        activeMenu={activeMenu}
        setActiveMenu={(menu) => {
          setActiveMenu(menu);
          setSidebarOpen(false); // Auto close on mobile
        }}
        onLogout={handleLogout}
        waliKelasList={db.waliKelas}
        onOpenSpreadsheetSync={() => setSpreadsheetModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentUser={currentUser}
          profile={db.profile}
          activeMenu={activeMenu}
          onLogout={handleLogout}
          onOpenSpreadsheetSync={() => setSpreadsheetModalOpen(true)}
          isSyncing={isSyncing}
          lastSyncedToSheets={db.lastSyncedToSheets}
          hasSheetsUrl={Boolean(db.sheetsWebAppUrl)}
          onQuickSync={handleSyncToSheets}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Admin Views */}
          {activeMenu === 'admin-dashboard' && (
            <AdminDashboard
              currentUser={currentUser}
              loginTime={loginTime}
              db={db}
              onNavigate={(menu) => setActiveMenu(menu)}
            />
          )}

          {activeMenu === 'admin-siswa' && (
            <AdminMenuSiswa
              siswaList={db.siswa}
              onAddSiswa={handleAddSiswa}
              onUpdateSiswa={handleUpdateSiswa}
              onDeleteSiswa={handleDeleteSiswa}
              onClearAllSiswa={handleClearAllSiswa}
              onImportBatch={handleImportSiswaBatch}
            />
          )}

          {activeMenu === 'admin-guru' && (
            <AdminMenuGuru
              guruList={db.guru}
              mapelOptions={db.mapelList.map((m) => m.pelajaran)}
              onAddGuru={handleAddGuru}
              onUpdateGuru={handleUpdateGuru}
              onDeleteGuru={handleDeleteGuru}
              onClearAllGuru={handleClearAllGuru}
              onImportBatch={handleImportGuruBatch}
            />
          )}

          {activeMenu === 'admin-mapel' && (
            <AdminMenuGuruMapel
              guruList={db.guru}
              mapelList={db.mapelList}
              kelasList={db.kelasList}
              guruMapelList={db.guruMapel}
              onAddMapel={handleAddMapel}
              onDeleteMapel={handleDeleteMapel}
              onAddKelas={handleAddKelas}
              onDeleteKelas={handleDeleteKelas}
              onAddGuruMapelAssignment={handleAddGuruMapelAssignment}
              onUpdateGuruMapelAssignment={handleUpdateGuruMapelAssignment}
              onDeleteGuruMapelAssignment={handleDeleteGuruMapelAssignment}
            />
          )}

          {activeMenu === 'admin-wali-kelas' && (
            <AdminMenuWaliKelas
              guruList={db.guru}
              kelasList={db.kelasList}
              waliKelasList={db.waliKelas}
              onAddWaliKelas={handleAddWaliKelas}
              onUpdateWaliKelas={handleUpdateWaliKelas}
              onDeleteWaliKelas={handleDeleteWaliKelas}
            />
          )}

          {activeMenu === 'admin-setting' && (
            <AdminMenuSetting
              profile={db.profile}
              onUpdateProfile={handleUpdateProfile}
              sheetsWebAppUrl={db.sheetsWebAppUrl}
              onUpdateSheetsUrl={(url) => updateDb({ ...db, sheetsWebAppUrl: url })}
              onSyncToSheets={handleSyncToSheets}
            />
          )}

          {/* Guru Views */}
          {activeMenu === 'guru-dashboard' && (
            <GuruDashboard
              currentUser={currentUser}
              loginTime={loginTime}
              db={db}
              onNavigate={(menu) => setActiveMenu(menu)}
            />
          )}

          {activeMenu === 'guru-jurnal' && (
            <GuruMenuJurnal
              currentUser={currentUser}
              jurnalList={db.jurnal}
              onAddJurnal={handleAddJurnal}
              onUpdateJurnal={handleUpdateJurnal}
              onDeleteJurnal={handleDeleteJurnal}
            />
          )}

          {(activeMenu === 'guru-penilaian' || activeMenu === 'guru-cetak-rapor') && (
            <GuruRaporPenilaian
              currentUser={currentUser}
              db={db}
              onSavePenilaianBatch={handleSavePenilaianBatch}
              initialSubTab={activeMenu === 'guru-cetak-rapor' ? 'cetak' : undefined}
            />
          )}

          {activeMenu === 'guru-absensi' && (
            <GuruMenuAbsensi
              currentUser={currentUser}
              db={db}
              onSaveAbsensiBatch={handleSaveAbsensiBatch}
            />
          )}

          {activeMenu === 'guru-cetak-absen' && (
            <GuruMenuCetakAbsen
              currentUser={currentUser}
              db={db}
            />
          )}
        </main>
      </div>

      {/* Spreadsheet & Code.gs Modal */}
      <SpreadsheetSyncModal
        isOpen={spreadsheetModalOpen}
        onClose={() => setSpreadsheetModalOpen(false)}
        db={db}
        onUpdateSheetsUrl={(url) => updateDb({ ...db, sheetsWebAppUrl: url }, true)}
        onToggleAutoSync={(enabled) => updateDb({ ...db, autoSyncToSheets: enabled }, true)}
        onSyncNow={handleSyncToSheets}
        onPullFromSheets={handlePullFromSheets}
        onImportDatabase={handleImportDatabase}
      />
    </div>
  );
}

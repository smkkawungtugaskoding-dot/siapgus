import * as XLSX from 'xlsx';
import {
  AppDatabase,
  Gender,
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
} from '../types';
import {
  DEFAULT_PROFILE,
  INITIAL_USERS,
  INITIAL_SISWA,
  INITIAL_GURU,
  INITIAL_MAPEL_LIST,
  INITIAL_KELAS_LIST,
  INITIAL_GURU_MAPEL,
  INITIAL_WALI_KELAS,
  INITIAL_JURNAL,
  INITIAL_PENILAIAN,
  INITIAL_ABSENSI,
  createInitialDatabase
} from './defaultData';

export {
  DEFAULT_PROFILE,
  INITIAL_USERS,
  INITIAL_SISWA,
  INITIAL_GURU,
  INITIAL_MAPEL_LIST,
  INITIAL_KELAS_LIST,
  INITIAL_GURU_MAPEL,
  INITIAL_WALI_KELAS,
  INITIAL_JURNAL,
  INITIAL_PENILAIAN,
  INITIAL_ABSENSI,
  createInitialDatabase
};

const STORAGE_KEY = 'siapgus_school_db_v1';

export function getDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all arrays and profile exist
      return {
        users: (parsed.users || INITIAL_USERS).map((u: UserAccount, idx: number) => ({
          ...u,
          nikNuptk: u.nikNuptk || INITIAL_USERS.find(iu => iu.id === u.id)?.nikNuptk || ''
        })),
        profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
        siswa: parsed.siswa || INITIAL_SISWA,
        guru: (parsed.guru || INITIAL_GURU).map((g: Guru, idx: number) => ({
          ...g,
          nikNuptk: g.nikNuptk || INITIAL_GURU.find(ig => ig.id === g.id)?.nikNuptk || ''
        })),
        mapelList: parsed.mapelList || INITIAL_MAPEL_LIST,
        kelasList: parsed.kelasList || INITIAL_KELAS_LIST,
        guruMapel: parsed.guruMapel || INITIAL_GURU_MAPEL,
        waliKelas: parsed.waliKelas || INITIAL_WALI_KELAS,
        jurnal: parsed.jurnal || INITIAL_JURNAL,
        penilaian: parsed.penilaian || INITIAL_PENILAIAN,
        absensi: parsed.absensi && parsed.absensi.length > 6 ? parsed.absensi : INITIAL_ABSENSI,
        sheetsWebAppUrl: parsed.sheetsWebAppUrl || '',
        autoSyncToSheets: parsed.autoSyncToSheets !== undefined ? parsed.autoSyncToSheets : true,
        lastSyncedToSheets: parsed.lastSyncedToSheets || ''
      };
    }
  } catch (e) {
    console.error('Failed to load database from localStorage', e);
  }

  const initialDb: AppDatabase = {
    users: INITIAL_USERS,
    profile: DEFAULT_PROFILE,
    siswa: INITIAL_SISWA,
    guru: INITIAL_GURU,
    mapelList: INITIAL_MAPEL_LIST,
    kelasList: INITIAL_KELAS_LIST,
    guruMapel: INITIAL_GURU_MAPEL,
    waliKelas: INITIAL_WALI_KELAS,
    jurnal: INITIAL_JURNAL,
    penilaian: INITIAL_PENILAIAN,
    absensi: INITIAL_ABSENSI,
    sheetsWebAppUrl: '',
    autoSyncToSheets: true,
    lastSyncedToSheets: ''
  };
  saveDatabase(initialDb);
  return initialDb;
}

export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save database to localStorage', e);
  }
}

/**
 * Mengambil database terpusat dari server (agar semua pengguna di manapun mendapatkan data yang sama)
 */
export async function fetchServerDatabase(): Promise<AppDatabase | null> {
  try {
    const res = await fetch('/api/database', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      const serverDb = json.data as AppDatabase;
      // Simpan juga ke localStorage sebagai cache lokal
      saveDatabase(serverDb);
      return serverDb;
    }
  } catch (err) {
    console.warn('Gagal memuat database dari server, menggunakan data lokal/fallback:', err);
  }
  return null;
}

/**
 * Menyimpan database ke server secara permanen (agar tersimpan untuk semua orang dan tidak reset)
 */
export async function saveServerDatabase(db: AppDatabase): Promise<boolean> {
  try {
    const res = await fetch('/api/database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(db),
    });
    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }
    const json = await res.json();
    return json.status === 'success';
  } catch (err) {
    console.error('Gagal menyimpan database ke server:', err);
    return false;
  }
}

// Compute descriptions based on KKTP and curriculum
export function generateCapaianDeskripsi(score: number, kktp: number = 75, mapel: string = 'Mata Pelajaran', type: 'sisipan' | 'akhir' = 'akhir'): string {
  if (score >= 90) {
    return `Menunjukkan penguasaan yang istimewa dan sangat terampil dalam menguasai seluruh capaian pembelajaran ${mapel}. Mampu mengaplikasikan konsep secara mandiri dan kritis.`;
  } else if (score >= kktp) {
    return `Menunjukkan penguasaan yang sangat baik dan tuntas dalam mencapai kriteria kompetensi ${mapel}. Sudah mampu menyelesaikan tugas-tugas terstruktur dengan tepat.`;
  } else if (score >= kktp - 15) {
    return `Menunjukkan penguasaan yang cukup pada materi dasar ${mapel}, namun masih perlu pendampingan dan bimbingan berkala pada penyelesaian soal analisis tingkat lanjut.`;
  } else {
    return `Perlu bimbingan intensif dan remedial dalam memahami materi kompetensi dasar ${mapel} agar dapat mencapai standar ketercapaian tujuan pembelajaran.`;
  }
}

// Export data to Excel XLSX
export function exportToXLSX(data: any[], fileName: string, sheetName: string = 'Data') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Parse file (XLSX or CSV) to JSON
export async function parseXLSXFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

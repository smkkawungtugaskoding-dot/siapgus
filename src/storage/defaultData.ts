import {
  AppDatabase,
  SchoolProfile,
  UserAccount,
  Siswa,
  Guru,
  MataPelajaran,
  KelasItem,
  GuruMapelAssignment,
  WaliKelasAssignment,
  JurnalItem,
  PenilaianItem,
  AbsensiRecord
} from '../types';

export const DEFAULT_PROFILE: SchoolProfile = {
  namaSekolah: '',
  kepalaSekolah: '',
  nuptk: '',
  npsn: '',
  akreditasi: '',
  kurikulum: '',
  kodePos: '',
  alamatSekolah: '',
  telp: '',
  logoUrl: ''
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-001',
    username: 'admin',
    password: '123',
    role: 'admin',
    fullName: 'Administrator',
    email: 'admin@sekolah.sch.id',
    nikNuptk: '',
    createdAt: '2026-01-10T08:00:00Z'
  }
];

export const INITIAL_SISWA: Siswa[] = [];

export const INITIAL_GURU: Guru[] = [];

export const INITIAL_MAPEL_LIST: MataPelajaran[] = [];

export const INITIAL_KELAS_LIST: KelasItem[] = [
  { id: 'KLS-001', kelas: '7', rombel: 'A' },
  { id: 'KLS-002', kelas: '7', rombel: 'B' },
  { id: 'KLS-003', kelas: '7', rombel: 'C' },
  { id: 'KLS-004', kelas: '7', rombel: 'D' },
  { id: 'KLS-005', kelas: '8', rombel: 'A' },
  { id: 'KLS-006', kelas: '8', rombel: 'B' },
  { id: 'KLS-007', kelas: '8', rombel: 'C' },
  { id: 'KLS-008', kelas: '8', rombel: 'D' },
  { id: 'KLS-009', kelas: '9', rombel: 'A' },
  { id: 'KLS-010', kelas: '9', rombel: 'B' },
  { id: 'KLS-011', kelas: '9', rombel: 'C' },
  { id: 'KLS-012', kelas: '9', rombel: 'D' }
];

export const INITIAL_GURU_MAPEL: GuruMapelAssignment[] = [];

export const INITIAL_WALI_KELAS: WaliKelasAssignment[] = [];

export const INITIAL_JURNAL: JurnalItem[] = [];

export const INITIAL_PENILAIAN: PenilaianItem[] = [];

export const INITIAL_ABSENSI: AbsensiRecord[] = [];

export function createInitialDatabase(): AppDatabase {
  return {
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
}

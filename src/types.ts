export type UserRole = 'admin' | 'guru';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
  email?: string;
  nikNuptk?: string; // NIK atau NUPTK
  assignedTeacherId?: string; // Links to Guru ID if role === 'guru'
  createdAt: string;
}

export interface SchoolProfile {
  namaSekolah: string;
  kepalaSekolah: string;
  nuptk: string;
  npsn: string;
  akreditasi: 'A' | 'B' | 'C';
  kurikulum: 'Kurikulum Merdeka' | 'Kurikulum 2013' | 'Kurikulum Nasional';
  kodePos: string;
  alamatSekolah: string;
  telp: string;
  logoUrl?: string; // base64 or URL
}

export type Gender = 'L' | 'P';

export interface Siswa {
  id: string;
  nama: string;
  jenisKelamin: Gender;
  kelas: '7' | '8' | '9';
  rombel: 'A' | 'B' | 'C' | 'D';
}

export interface Guru {
  id: string;
  nama: string;
  jenisKelamin: Gender;
  mapel: string;
  nikNuptk?: string; // NIK atau NUPTK
}

export interface MataPelajaran {
  id: string;
  kodeMapel: string;
  pelajaran: string;
}

export interface KelasItem {
  id: string;
  kelas: '7' | '8' | '9';
  rombel: 'A' | 'B' | 'C' | 'D';
}

export interface GuruMapelAssignment {
  id: string;
  namaGuru: string;
  jenisKelamin: Gender;
  guruMataPelajaran: string;
  tugasTambahan: string;
  kelas: '7' | '8' | '9';
  rombel: 'A' | 'B' | 'C' | 'D';
}

export interface WaliKelasAssignment {
  id: string;
  kodeKelas: '7' | '8' | '9';
  rombel: 'A' | 'B' | 'C' | 'D';
  namaGuru: string;
  jenisKelamin: Gender;
  guruMataPelajaran: string;
  tugasTambahan: string;
}

export interface JurnalItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  hari: string;
  kelas: string; // e.g. "7A"
  jamKe: string; // e.g. "1 - 2"
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  kbm: string;
  refleksi: string;
  asesmen: string;
  siswaTidakHadir: string;
  namaGuru: string;
}

export interface PenilaianItem {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: '7' | '8' | '9';
  rombel: 'A' | 'B' | 'C' | 'D';
  mapel: string;
  pengajar: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  kktp: number;
  sumatif1?: number | null;
  sumatif2?: number | null;
  sumatif3?: number | null;
  sts?: number | null;
  sas?: number | null;
  nilaiSisipan?: number | null;
  capaianSisipan?: string;
  nilaiAkhir?: number | null;
  capaianAkhir?: string;
  // Visual state flags
  sumatif1Saved?: boolean;
  sumatif2Saved?: boolean;
  sumatif3Saved?: boolean;
  stsSaved?: boolean;
  sasSaved?: boolean;
}

export type AbsensiStatus = 'H' | 'S' | 'I' | 'A';

export interface AbsensiRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kelas: '7' | '8' | '9';
  rombel: 'A' | 'B' | 'C' | 'D';
  siswaId: string;
  namaSiswa: string;
  status: AbsensiStatus;
  keterangan?: string;
  waliKelas?: string;
}

export interface AppDatabase {
  users: UserAccount[];
  profile: SchoolProfile;
  siswa: Siswa[];
  guru: Guru[];
  mapelList: MataPelajaran[];
  kelasList: KelasItem[];
  guruMapel: GuruMapelAssignment[];
  waliKelas: WaliKelasAssignment[];
  jurnal: JurnalItem[];
  penilaian: PenilaianItem[];
  absensi: AbsensiRecord[];
  sheetsWebAppUrl?: string;
  autoSyncToSheets?: boolean;
  lastSyncedToSheets?: string;
}

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
  namaSekolah: 'SMP NEGERI 1 KELUARGA TELADAN',
  kepalaSekolah: 'Drs. H. Mulyadi, M.Pd.',
  nuptk: '197503122000031002',
  npsn: '20501892',
  akreditasi: 'A',
  kurikulum: 'Kurikulum Merdeka',
  kodePos: '60234',
  alamatSekolah: 'Jl. Pendidikan Karakter No. 12, Surabaya',
  telp: '(031) 8439211',
  logoUrl: ''
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-001',
    username: 'admin',
    password: '123',
    role: 'admin',
    fullName: 'Drs. H. Mulyadi, M.Pd. (Admin)',
    email: 'admin@sekolah.sch.id',
    nikNuptk: '197503122000031002',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'USR-002',
    username: 'budi',
    password: '123',
    role: 'guru',
    fullName: 'Budi Santoso, S.Pd.',
    email: 'budi.santoso@sekolah.sch.id',
    nikNuptk: '198504122010011005',
    assignedTeacherId: 'GUR-001',
    createdAt: '2026-01-12T09:00:00Z'
  },
  {
    id: 'USR-003',
    username: 'siti',
    password: '123',
    role: 'guru',
    fullName: 'Siti Aminah, M.Pd.',
    email: 'siti.aminah@sekolah.sch.id',
    nikNuptk: '198807212015022003',
    assignedTeacherId: 'GUR-002',
    createdAt: '2026-01-12T09:30:00Z'
  },
  {
    id: 'USR-004',
    username: 'hendra',
    password: '123',
    role: 'guru',
    fullName: 'Hendra Wijaya, S.Kom.',
    email: 'hendra.wijaya@sekolah.sch.id',
    nikNuptk: '199201152019031008',
    assignedTeacherId: 'GUR-003',
    createdAt: '2026-01-14T10:00:00Z'
  }
];

export const INITIAL_SISWA: Siswa[] = [
  { id: 'SIS-001', nama: 'Aditya Pratama Putra', jenisKelamin: 'L', kelas: '7', rombel: 'A' },
  { id: 'SIS-002', nama: 'Anindya Kirana Putri', jenisKelamin: 'P', kelas: '7', rombel: 'A' },
  { id: 'SIS-003', nama: 'Bagas Satria Wibowo', jenisKelamin: 'L', kelas: '7', rombel: 'A' },
  { id: 'SIS-004', nama: 'Cantika Putri Ramadhani', jenisKelamin: 'P', kelas: '7', rombel: 'A' },
  { id: 'SIS-005', nama: 'Dimas Arya Yudha', jenisKelamin: 'L', kelas: '7', rombel: 'A' },
  { id: 'SIS-006', nama: 'Eka Lestari Rahayu', jenisKelamin: 'P', kelas: '7', rombel: 'A' },
  { id: 'SIS-007', nama: 'Fajar Nugraha', jenisKelamin: 'L', kelas: '7', rombel: 'B' },
  { id: 'SIS-008', nama: 'Gita Permata Sari', jenisKelamin: 'P', kelas: '7', rombel: 'B' },
  { id: 'SIS-009', nama: 'Hafiz Syahputra', jenisKelamin: 'L', kelas: '7', rombel: 'B' },
  { id: 'SIS-010', nama: 'Indah Cahyani', jenisKelamin: 'P', kelas: '8', rombel: 'A' },
  { id: 'SIS-011', nama: 'Joko Tri Prasetyo', jenisKelamin: 'L', kelas: '8', rombel: 'A' },
  { id: 'SIS-012', nama: 'Karin Amelia', jenisKelamin: 'P', kelas: '8', rombel: 'B' },
  { id: 'SIS-013', nama: 'Luthfi Hakim', jenisKelamin: 'L', kelas: '9', rombel: 'A' },
  { id: 'SIS-014', nama: 'Maya Anggraini', jenisKelamin: 'P', kelas: '9', rombel: 'A' },
  { id: 'SIS-015', nama: 'Naufal Rizky', jenisKelamin: 'L', kelas: '9', rombel: 'C' }
];

export const INITIAL_GURU: Guru[] = [
  { id: 'GUR-001', nama: 'Budi Santoso, S.Pd.', jenisKelamin: 'L', mapel: 'Matematika', nikNuptk: '198504122010011005' },
  { id: 'GUR-002', nama: 'Siti Aminah, M.Pd.', jenisKelamin: 'P', mapel: 'Bahasa Indonesia', nikNuptk: '198807212015022003' },
  { id: 'GUR-003', nama: 'Hendra Wijaya, S.Kom.', jenisKelamin: 'L', mapel: 'Informatika', nikNuptk: '199201152019031008' },
  { id: 'GUR-004', nama: 'Dewi Lestari, S.Pd.', jenisKelamin: 'P', mapel: 'Ilmu Pengetahuan Alam (IPA)', nikNuptk: '199011032018012004' },
  { id: 'GUR-005', nama: 'Drs. Bambang Irawan', jenisKelamin: 'L', mapel: 'Pendidikan Pancasila', nikNuptk: '197906182005011006' },
  { id: 'GUR-006', nama: 'Nurul Hidayati, S.Pd.', jenisKelamin: 'P', mapel: 'Bahasa Inggris', nikNuptk: '199402282020122007' }
];

export const INITIAL_MAPEL_LIST: MataPelajaran[] = [
  { id: 'MAP-001', kodeMapel: 'MTK-01', pelajaran: 'Matematika' },
  { id: 'MAP-002', kodeMapel: 'BIN-01', pelajaran: 'Bahasa Indonesia' },
  { id: 'MAP-003', kodeMapel: 'INF-01', pelajaran: 'Informatika' },
  { id: 'MAP-004', kodeMapel: 'IPA-01', pelajaran: 'Ilmu Pengetahuan Alam (IPA)' },
  { id: 'MAP-005', kodeMapel: 'PPKN-01', pelajaran: 'Pendidikan Pancasila' },
  { id: 'MAP-006', kodeMapel: 'BIG-01', pelajaran: 'Bahasa Inggris' }
];

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

export const INITIAL_GURU_MAPEL: GuruMapelAssignment[] = [
  { id: 'GM-001', namaGuru: 'Budi Santoso, S.Pd.', jenisKelamin: 'L', guruMataPelajaran: 'Matematika', tugasTambahan: 'Wali Kelas 7B', kelas: '7', rombel: 'A' },
  { id: 'GM-002', namaGuru: 'Budi Santoso, S.Pd.', jenisKelamin: 'L', guruMataPelajaran: 'Matematika', tugasTambahan: 'Wali Kelas 7B', kelas: '7', rombel: 'B' },
  { id: 'GM-003', namaGuru: 'Siti Aminah, M.Pd.', jenisKelamin: 'P', guruMataPelajaran: 'Bahasa Indonesia', tugasTambahan: 'Wali Kelas 7A', kelas: '7', rombel: 'A' },
  { id: 'GM-004', namaGuru: 'Hendra Wijaya, S.Kom.', jenisKelamin: 'L', guruMataPelajaran: 'Informatika', tugasTambahan: 'Pembina OSIS', kelas: '7', rombel: 'A' },
  { id: 'GM-005', namaGuru: 'Dewi Lestari, S.Pd.', jenisKelamin: 'P', guruMataPelajaran: 'Ilmu Pengetahuan Alam (IPA)', tugasTambahan: 'Kepala Lab IPA', kelas: '7', rombel: 'A' },
  { id: 'GM-006', namaGuru: 'Drs. Bambang Irawan', jenisKelamin: 'L', guruMataPelajaran: 'Pendidikan Pancasila', tugasTambahan: 'Koordinator P5', kelas: '7', rombel: 'A' }
];

export const INITIAL_WALI_KELAS: WaliKelasAssignment[] = [
  { id: 'WK-001', kodeKelas: '7', rombel: 'A', namaGuru: 'Siti Aminah, M.Pd.', jenisKelamin: 'P', guruMataPelajaran: 'Bahasa Indonesia', tugasTambahan: 'Wali Kelas 7A' },
  { id: 'WK-002', kodeKelas: '7', rombel: 'B', namaGuru: 'Budi Santoso, S.Pd.', jenisKelamin: 'L', guruMataPelajaran: 'Matematika', tugasTambahan: 'Wali Kelas 7B' },
  { id: 'WK-003', kodeKelas: '8', rombel: 'A', namaGuru: 'Dewi Lestari, S.Pd.', jenisKelamin: 'P', guruMataPelajaran: 'Ilmu Pengetahuan Alam (IPA)', tugasTambahan: 'Wali Kelas 8A' },
  { id: 'WK-004', kodeKelas: '9', rombel: 'A', namaGuru: 'Hendra Wijaya, S.Kom.', jenisKelamin: 'L', guruMataPelajaran: 'Informatika', tugasTambahan: 'Wali Kelas 9A' }
];

export const INITIAL_JURNAL: JurnalItem[] = [
  {
    id: 'JRN-001',
    tanggal: '2026-10-27',
    hari: 'Senin',
    kelas: '7A',
    jamKe: '1 - 2',
    capaianPembelajaran: 'Peserta didik mampu memahami konsep dasar aljabar dan persamaan linier satu variabel.',
    tujuanPembelajaran: 'Menyelesaikan permasalahan kontekstual menggunakan persamaan linier sederhana.',
    kbm: 'Diskusi kelompok berbasis masalah (PBL) dan presentasi hasil lembar kerja.',
    refleksi: 'Sebagian besar siswa antusias dan memahami operasi aljabar, 2 siswa perlu pendampingan.',
    asesmen: 'Penilaian formatif rubrik diskusi kelompok dan kuis singkat.',
    siswaTidakHadir: 'Aditya Pratama (Sakit)',
    namaGuru: 'Budi Santoso, S.Pd.'
  },
  {
    id: 'JRN-002',
    tanggal: '2026-10-28',
    hari: 'Selasa',
    kelas: '7A',
    jamKe: '3 - 4',
    capaianPembelajaran: 'Peserta didik mampu menganalisis struktur teks deskripsi lingkungan sekolah.',
    tujuanPembelajaran: 'Mengidentifikasi ide pokok dan kosakata serapan dalam teks deskripsi.',
    kbm: 'Membaca terbimbing, menganalisis paragraf deskriptif, dan menulis ringkasan.',
    refleksi: 'Siswa dapat menemukan kata kunci dengan cepat, interaksi tanya jawab sangat hidup.',
    asesmen: 'Tugas portofolio penulisan deskripsi ruang kelas.',
    siswaTidakHadir: 'Nihil (Hadir Semua)',
    namaGuru: 'Siti Aminah, M.Pd.'
  }
];

export const INITIAL_PENILAIAN: PenilaianItem[] = [
  {
    id: 'NIL-001',
    siswaId: 'SIS-001',
    namaSiswa: 'Aditya Pratama Putra',
    kelas: '7',
    rombel: 'A',
    mapel: 'Matematika',
    pengajar: 'Budi Santoso, S.Pd.',
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    kktp: 75,
    sumatif1: 85,
    sumatif2: 80,
    sumatif3: 88,
    sts: 82,
    sas: 86,
    nilaiSisipan: 83,
    capaianSisipan: 'Menunjukkan pemahaman yang sangat baik dalam memahami konsep aljabar dan relasi fungsi.',
    nilaiAkhir: 85,
    capaianAkhir: 'Sangat baik dalam menyelesaikan masalah kontekstual aljabar dan geometri bidang.',
    sumatif1Saved: true,
    sumatif2Saved: true,
    sumatif3Saved: true,
    stsSaved: true,
    sasSaved: true
  },
  {
    id: 'NIL-002',
    siswaId: 'SIS-002',
    namaSiswa: 'Anindya Kirana Putri',
    kelas: '7',
    rombel: 'A',
    mapel: 'Matematika',
    pengajar: 'Budi Santoso, S.Pd.',
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    kktp: 75,
    sumatif1: 90,
    sumatif2: 92,
    sumatif3: 94,
    sts: 91,
    sas: 95,
    nilaiSisipan: 92,
    capaianSisipan: 'Menunjukkan penguasaan sangat tinggi dalam aljabar dan penalaran logis matematika.',
    nilaiAkhir: 93,
    capaianAkhir: 'Istimewa dan tuntas mandiri dalam menyelesaikan persoalan matematis tingkat lanjut.',
    sumatif1Saved: true,
    sumatif2Saved: true,
    sumatif3Saved: true,
    stsSaved: true,
    sasSaved: true
  },
  {
    id: 'NIL-003',
    siswaId: 'SIS-003',
    namaSiswa: 'Bagas Satria Wibowo',
    kelas: '7',
    rombel: 'A',
    mapel: 'Matematika',
    pengajar: 'Budi Santoso, S.Pd.',
    tahunPelajaran: '2026/2027',
    semester: 'Ganjil',
    kktp: 75,
    sumatif1: 78,
    sumatif2: 76,
    sumatif3: 80,
    sts: 77,
    sas: 79,
    nilaiSisipan: 78,
    capaianSisipan: 'Menunjukkan penguasaan baik dan tuntas dalam menyelesaikan operasi bilangan.',
    nilaiAkhir: 79,
    capaianAkhir: 'Mampu mencapai kriteria ketuntasan dengan baik pada materi persamaan linear.',
    sumatif1Saved: true,
    sumatif2Saved: true,
    sumatif3Saved: true,
    stsSaved: true,
    sasSaved: true
  }
];

export const INITIAL_ABSENSI: AbsensiRecord[] = [
  { id: 'ABS-001', tanggal: '2026-10-24', kelas: '7', rombel: 'A', siswaId: 'SIS-001', namaSiswa: 'Aditya Pratama Putra', status: 'H', keterangan: 'Hadir Tepat Waktu', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-002', tanggal: '2026-10-24', kelas: '7', rombel: 'A', siswaId: 'SIS-002', namaSiswa: 'Anindya Kirana Putri', status: 'H', keterangan: '', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-003', tanggal: '2026-10-24', kelas: '7', rombel: 'A', siswaId: 'SIS-003', namaSiswa: 'Bagas Satria Wibowo', status: 'S', keterangan: 'Demam tinggi', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-004', tanggal: '2026-10-24', kelas: '7', rombel: 'A', siswaId: 'SIS-004', namaSiswa: 'Cantika Putri Ramadhani', status: 'H', keterangan: '', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-005', tanggal: '2026-10-24', kelas: '7', rombel: 'A', siswaId: 'SIS-005', namaSiswa: 'Dimas Arya Yudha', status: 'A', keterangan: 'Tanpa kabar', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-006', tanggal: '2026-10-24', kelas: '7', rombel: 'A', siswaId: 'SIS-006', namaSiswa: 'Eka Lestari Rahayu', status: 'H', keterangan: '', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-007', tanggal: '2026-10-25', kelas: '7', rombel: 'A', siswaId: 'SIS-001', namaSiswa: 'Aditya Pratama Putra', status: 'H', keterangan: '', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-008', tanggal: '2026-10-25', kelas: '7', rombel: 'A', siswaId: 'SIS-002', namaSiswa: 'Anindya Kirana Putri', status: 'H', keterangan: '', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-009', tanggal: '2026-10-25', kelas: '7', rombel: 'A', siswaId: 'SIS-003', namaSiswa: 'Bagas Satria Wibowo', status: 'S', keterangan: 'Istirahat di rumah', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-010', tanggal: '2026-10-25', kelas: '7', rombel: 'A', siswaId: 'SIS-004', namaSiswa: 'Cantika Putri Ramadhani', status: 'H', keterangan: '', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-011', tanggal: '2026-10-25', kelas: '7', rombel: 'A', siswaId: 'SIS-005', namaSiswa: 'Dimas Arya Yudha', status: 'I', keterangan: 'Ijin keluarga', waliKelas: 'Siti Aminah, M.Pd.' },
  { id: 'ABS-012', tanggal: '2026-10-25', kelas: '7', rombel: 'A', siswaId: 'SIS-006', namaSiswa: 'Eka Lestari Rahayu', status: 'H', keterangan: '', waliKelas: 'Siti Aminah, M.Pd.' }
];

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

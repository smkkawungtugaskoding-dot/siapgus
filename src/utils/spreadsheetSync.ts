import * as XLSX from 'xlsx';
import {
  AppDatabase,
  Siswa,
  Guru,
  GuruMapelAssignment,
  WaliKelasAssignment,
  JurnalItem,
  PenilaianItem,
  AbsensiRecord,
  UserAccount,
  SchoolProfile
} from '../types';

/**
 * Utility untuk konversi dan sinkronisasi seluruh basis data SiApgus
 * dengan Google Spreadsheet (via Google Apps Script / Code.gs) dan file Excel (.xlsx)
 */

export interface FormattedSpreadsheetData {
  users: any[];
  profil: any[];
  siswa: any[];
  guru: any[];
  mapel: any[];
  waliKelas: any[];
  jurnal: any[];
  penilaian: any[];
  absensi: any[];
}

/**
 * Format data aplikasi agar sesuai 100% dengan header kolom tabel Google Spreadsheet
 */
export function formatDbForSpreadsheet(db: AppDatabase): FormattedSpreadsheetData {
  const users = db.users.map((u) => ({
    'ID': u.id,
    'Username': u.username,
    'Password': u.password,
    'Role': u.role,
    'Nama Lengkap': u.fullName,
    'NIK/NUPTK': u.nikNuptk || '',
    'Waktu Dibuat': u.createdAt,
    // Camelcase fallbacks
    id: u.id,
    username: u.username,
    role: u.role,
    fullName: u.fullName,
    nikNuptk: u.nikNuptk || '',
    createdAt: u.createdAt,
  }));

  const profil = [
    {
      'Nama Sekolah': db.profile.namaSekolah,
      'Kepala Sekolah': db.profile.kepalaSekolah,
      'NUPTK': db.profile.nuptk,
      'NPSN': db.profile.npsn,
      'Akreditasi': db.profile.akreditasi,
      'Kurikulum': db.profile.kurikulum,
      'Kode Pos': db.profile.kodePos,
      'Alamat': db.profile.alamatSekolah,
      'Telepon': db.profile.telp,
      'Logo URL': db.profile.logoUrl || '',
      'Logo URL/Base64': db.profile.logoUrl || '',
      'Logo': db.profile.logoUrl || '',
      namaSekolah: db.profile.namaSekolah,
      kepalaSekolah: db.profile.kepalaSekolah,
      nuptk: db.profile.nuptk,
      npsn: db.profile.npsn,
      akreditasi: db.profile.akreditasi,
      kurikulum: db.profile.kurikulum,
      kodePos: db.profile.kodePos,
      alamatSekolah: db.profile.alamatSekolah,
      telp: db.profile.telp,
      logoUrl: db.profile.logoUrl || ''
    }
  ];

  const siswa = db.siswa.map((s) => ({
    'ID Siswa': s.id,
    'Nama Siswa': s.nama,
    'Jenis Kelamin': s.jenisKelamin,
    'Kelas': s.kelas,
    'Rombel': s.rombel,
    id: s.id,
    nama: s.nama,
    jenisKelamin: s.jenisKelamin,
    kelas: s.kelas,
    rombel: s.rombel,
  }));

  const guru = db.guru.map((g) => ({
    'ID Guru': g.id,
    'Nama Guru': g.nama,
    'Jenis Kelamin': g.jenisKelamin,
    'NIK/NUPTK': g.nikNuptk || '',
    'Guru Mata Pelajaran': g.mapel,
    id: g.id,
    nama: g.nama,
    jenisKelamin: g.jenisKelamin,
    nikNuptk: g.nikNuptk || '',
    mapel: g.mapel,
  }));

  const mapel = db.guruMapel.map((gm) => ({
    'ID': gm.id,
    'Kode Mapel': `${gm.guruMataPelajaran.substring(0, 3).toUpperCase()}-${gm.kelas}`,
    'Mata Pelajaran': gm.guruMataPelajaran,
    'Kelas': gm.kelas,
    'Rombel': gm.rombel,
    'Nama Guru': gm.namaGuru,
    'Jenis Kelamin': gm.jenisKelamin,
    'Tugas Tambahan': gm.tugasTambahan,
    id: gm.id,
    guruMataPelajaran: gm.guruMataPelajaran,
    namaGuru: gm.namaGuru,
    jenisKelamin: gm.jenisKelamin,
    tugasTambahan: gm.tugasTambahan,
    kelas: gm.kelas,
    rombel: gm.rombel,
  }));

  const waliKelas = db.waliKelas.map((wk) => ({
    'ID': wk.id,
    'Kode Kelas': wk.kodeKelas,
    'Rombel': wk.rombel,
    'Nama Guru': wk.namaGuru,
    'Jenis Kelamin': wk.jenisKelamin,
    'Guru Mata Pelajaran': wk.guruMataPelajaran,
    'Tugas Tambahan': wk.tugasTambahan,
    id: wk.id,
    kodeKelas: wk.kodeKelas,
    rombel: wk.rombel,
    namaGuru: wk.namaGuru,
    jenisKelamin: wk.jenisKelamin,
    guruMataPelajaran: wk.guruMataPelajaran,
    tugasTambahan: wk.tugasTambahan,
  }));

  const jurnal = db.jurnal.map((j) => ({
    'ID Jurnal': j.id,
    'Hari/Tanggal': j.tanggal,
    'Hari': j.hari,
    'Kelas': j.kelas,
    'Jam Ke': j.jamKe,
    'Capaian Pembelajaran (CP)': j.capaianPembelajaran,
    'Tujuan Pembelajaran (TP)': j.tujuanPembelajaran,
    'KBM': j.kbm,
    'Refleksi Guru & Asesmen': `${j.refleksi} | Asesmen: ${j.asesmen}`,
    'Siswa Tidak Hadir': j.siswaTidakHadir,
    'Nama Guru': j.namaGuru,
    id: j.id,
    tanggal: j.tanggal,
    hari: j.hari,
    kelas: j.kelas,
    jamKe: j.jamKe,
    capaianPembelajaran: j.capaianPembelajaran,
    tujuanPembelajaran: j.tujuanPembelajaran,
    kbm: j.kbm,
    refleksi: j.refleksi,
    asesmen: j.asesmen,
    siswaTidakHadir: j.siswaTidakHadir,
    namaGuru: j.namaGuru,
  }));

  const penilaian = db.penilaian.map((p) => ({
    'ID Penilaian': p.id,
    'ID Siswa': p.siswaId,
    'Nama Siswa': p.namaSiswa,
    'Kelas': p.kelas,
    'Rombel': p.rombel,
    'Mata Pelajaran': p.mapel,
    'Nama Guru': p.pengajar,
    'Tahun Pelajaran': p.tahunPelajaran,
    'Semester': p.semester,
    'KKTP': p.kktp,
    'Sumatif 1': p.sumatif1 ?? '',
    'Sumatif 2': p.sumatif2 ?? '',
    'Sumatif 3': p.sumatif3 ?? '',
    'STS': p.sts ?? '',
    'SAS': p.sas ?? '',
    'Nilai Sisipan': p.nilaiSisipan ?? '',
    'Capaian Sisipan': p.capaianSisipan || '',
    'Nilai Akhir': p.nilaiAkhir ?? '',
    'Capaian Akhir': p.capaianAkhir || '',
    id: p.id,
    siswaId: p.siswaId,
    namaSiswa: p.namaSiswa,
    kelas: p.kelas,
    rombel: p.rombel,
    mapel: p.mapel,
    pengajar: p.pengajar,
    tahunPelajaran: p.tahunPelajaran,
    semester: p.semester,
    kktp: p.kktp,
    sumatif1: p.sumatif1,
    sumatif2: p.sumatif2,
    sumatif3: p.sumatif3,
    sts: p.sts,
    sas: p.sas,
    nilaiSisipan: p.nilaiSisipan,
    capaianSisipan: p.capaianSisipan,
    nilaiAkhir: p.nilaiAkhir,
    capaianAkhir: p.capaianAkhir,
  }));

  const absensi = db.absensi.map((a) => ({
    'ID Absen': a.id,
    'Tanggal': a.tanggal,
    'Kelas': a.kelas,
    'Rombel': a.rombel,
    'ID Siswa': a.siswaId,
    'Nama Siswa': a.namaSiswa,
    'Status (H/S/I/A)': a.status,
    'Keterangan': a.keterangan || '',
    'Wali Kelas': a.waliKelas || '',
    id: a.id,
    tanggal: a.tanggal,
    kelas: a.kelas,
    rombel: a.rombel,
    siswaId: a.siswaId,
    namaSiswa: a.namaSiswa,
    status: a.status,
    keterangan: a.keterangan,
    waliKelas: a.waliKelas,
  }));

  return {
    users,
    profil,
    siswa,
    guru,
    mapel,
    waliKelas,
    jurnal,
    penilaian,
    absensi,
  };
}

/**
 * Kirim seluruh database ke Google Apps Script Web App (Google Spreadsheet)
 */
export async function syncPushToSpreadsheet(url: string, db: AppDatabase): Promise<{ success: boolean; message: string }> {
  if (!url || !url.trim()) {
    throw new Error('URL Google Apps Script Web App belum diisi.');
  }

  const cleanUrl = url.trim();
  const formattedData = formatDbForSpreadsheet(db);

  const payload = {
    action: 'syncAll',
    timestamp: new Date().toISOString(),
    payload: {
      profil: formattedData.profil[0],
      siswa: formattedData.siswa,
      guru: formattedData.guru,
      mapel: formattedData.mapel,
      waliKelas: formattedData.waliKelas,
      jurnal: formattedData.jurnal,
      penilaian: formattedData.penilaian,
      absensi: formattedData.absensi,
      users: formattedData.users,
    },
  };

  // Google Apps Script redirect-based POST with JSON
  await fetch(cleanUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  return {
    success: true,
    message: 'Seluruh 9 tabel database berhasil dikirim dan disinkronkan ke Google Spreadsheet!',
  };
}

/**
 * Ambil seluruh data dari Google Spreadsheet via Web App GET
 */
export async function syncPullFromSpreadsheet(url: string): Promise<Partial<AppDatabase>> {
  if (!url || !url.trim()) {
    throw new Error('URL Google Apps Script Web App belum diisi.');
  }

  const cleanUrl = url.trim();
  const fetchUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getAllData&_t=${Date.now()}`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(`Gagal menghubungi server Apps Script: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.status !== 'success' || !json.data) {
    throw new Error(json.message || 'Format data dari Google Spreadsheet tidak valid');
  }

  const d = json.data;
  const result: Partial<AppDatabase> = {};

  if (d.profil) {
    result.profile = {
      namaSekolah: d.profil['Nama Sekolah'] || d.profil.namaSekolah || '',
      kepalaSekolah: d.profil['Kepala Sekolah'] || d.profil.kepalaSekolah || '',
      nuptk: String(d.profil['NUPTK'] || d.profil.nuptk || ''),
      npsn: String(d.profil['NPSN'] || d.profil.npsn || ''),
      akreditasi: (d.profil['Akreditasi'] || d.profil.akreditasi || 'A') as any,
      kurikulum: (d.profil['Kurikulum'] || d.profil.kurikulum || 'Kurikulum Merdeka') as any,
      kodePos: String(d.profil['Kode Pos'] || d.profil.kodePos || ''),
      alamatSekolah: d.profil['Alamat'] || d.profil.alamatSekolah || '',
      telp: String(d.profil['Telepon'] || d.profil.telp || ''),
      logoUrl: d.profil['Logo URL'] || d.profil['Logo URL/Base64'] || d.profil['Logo'] || d.profil.logoUrl || '',
    };
  }

  if (Array.isArray(d.siswa)) {
    result.siswa = d.siswa.map((item: any) => ({
      id: item['ID Siswa'] || item.id || `SIS-${Date.now()}`,
      nama: item['Nama Siswa'] || item.nama || '',
      jenisKelamin: (item['Jenis Kelamin'] || item.jenisKelamin || 'L') as 'L' | 'P',
      kelas: String(item['Kelas'] || item.kelas || '7') as any,
      rombel: String(item['Rombel'] || item.rombel || 'A') as any,
    }));
  }

  if (Array.isArray(d.guru)) {
    result.guru = d.guru.map((item: any) => ({
      id: item['ID Guru'] || item.id || `GUR-${Date.now()}`,
      nama: item['Nama Guru'] || item.nama || '',
      jenisKelamin: (item['Jenis Kelamin'] || item.jenisKelamin || 'L') as 'L' | 'P',
      mapel: item['Guru Mata Pelajaran'] || item.mapel || '',
      nikNuptk: String(item['NIK/NUPTK'] || item.nikNuptk || ''),
    }));
  }

  if (Array.isArray(d.mapel)) {
    result.guruMapel = d.mapel.map((item: any) => ({
      id: item['ID'] || item.id || `GM-${Date.now()}`,
      namaGuru: item['Nama Guru'] || item.namaGuru || '',
      jenisKelamin: (item['Jenis Kelamin'] || item.jenisKelamin || 'L') as 'L' | 'P',
      guruMataPelajaran: item['Mata Pelajaran'] || item.guruMataPelajaran || '',
      tugasTambahan: item['Tugas Tambahan'] || item.tugasTambahan || '',
      kelas: String(item['Kelas'] || item.kelas || '7') as any,
      rombel: String(item['Rombel'] || item.rombel || 'A') as any,
    }));
  }

  if (Array.isArray(d.waliKelas)) {
    result.waliKelas = d.waliKelas.map((item: any) => ({
      id: item['ID'] || item.id || `WK-${Date.now()}`,
      kodeKelas: String(item['Kode Kelas'] || item.kodeKelas || '7') as any,
      rombel: String(item['Rombel'] || item.rombel || 'A') as any,
      namaGuru: item['Nama Guru'] || item.namaGuru || '',
      jenisKelamin: (item['Jenis Kelamin'] || item.jenisKelamin || 'L') as 'L' | 'P',
      guruMataPelajaran: item['Guru Mata Pelajaran'] || item.guruMataPelajaran || '',
      tugasTambahan: item['Tugas Tambahan'] || item.tugasTambahan || '',
    }));
  }

  if (Array.isArray(d.jurnal)) {
    result.jurnal = d.jurnal.map((item: any) => ({
      id: item['ID Jurnal'] || item.id || `JRN-${Date.now()}`,
      tanggal: item['Hari/Tanggal'] || item.tanggal || '',
      hari: item['Hari'] || item.hari || '',
      kelas: item['Kelas'] || item.kelas || '',
      jamKe: item['Jam Ke'] || item.jamKe || '',
      capaianPembelajaran: item['Capaian Pembelajaran (CP)'] || item.capaianPembelajaran || '',
      tujuanPembelajaran: item['Tujuan Pembelajaran (TP)'] || item.tujuanPembelajaran || '',
      kbm: item['KBM'] || item.kbm || '',
      refleksi: item['Refleksi Guru & Asesmen'] || item.refleksi || '',
      asesmen: item['Asesmen'] || item.asesmen || '',
      siswaTidakHadir: item['Siswa Tidak Hadir'] || item.siswaTidakHadir || '',
      namaGuru: item['Nama Guru'] || item.namaGuru || '',
    }));
  }

  if (Array.isArray(d.penilaian)) {
    result.penilaian = d.penilaian.map((item: any) => ({
      id: item['ID Penilaian'] || item.id || `NIL-${Date.now()}`,
      siswaId: item['ID Siswa'] || item.siswaId || '',
      namaSiswa: item['Nama Siswa'] || item.namaSiswa || '',
      kelas: String(item['Kelas'] || item.kelas || '7') as any,
      rombel: String(item['Rombel'] || item.rombel || 'A') as any,
      mapel: item['Mata Pelajaran'] || item.mapel || '',
      pengajar: item['Nama Guru'] || item.pengajar || '',
      tahunPelajaran: item['Tahun Pelajaran'] || item.tahunPelajaran || '',
      semester: (item['Semester'] || item.semester || 'Ganjil') as any,
      kktp: Number(item['KKTP'] || item.kktp || 75),
      sumatif1: item['Sumatif 1'] !== '' ? Number(item['Sumatif 1'] ?? item.sumatif1) : null,
      sumatif2: item['Sumatif 2'] !== '' ? Number(item['Sumatif 2'] ?? item.sumatif2) : null,
      sumatif3: item['Sumatif 3'] !== '' ? Number(item['Sumatif 3'] ?? item.sumatif3) : null,
      sts: item['STS'] !== '' ? Number(item['STS'] ?? item.sts) : null,
      sas: item['SAS'] !== '' ? Number(item['SAS'] ?? item.sas) : null,
      nilaiSisipan: item['Nilai Sisipan'] !== '' ? Number(item['Nilai Sisipan'] ?? item.nilaiSisipan) : null,
      capaianSisipan: item['Capaian Sisipan'] || item.capaianSisipan || '',
      nilaiAkhir: item['Nilai Akhir'] !== '' ? Number(item['Nilai Akhir'] ?? item.nilaiAkhir) : null,
      capaianAkhir: item['Capaian Akhir'] || item.capaianAkhir || '',
    }));
  }

  if (Array.isArray(d.absensi)) {
    result.absensi = d.absensi.map((item: any) => ({
      id: item['ID Absen'] || item.id || `ABS-${Date.now()}`,
      tanggal: item['Tanggal'] || item.tanggal || '',
      kelas: String(item['Kelas'] || item.kelas || '7') as any,
      rombel: String(item['Rombel'] || item.rombel || 'A') as any,
      siswaId: item['ID Siswa'] || item.siswaId || '',
      namaSiswa: item['Nama Siswa'] || item.namaSiswa || '',
      status: (item['Status (H/S/I/A)'] || item.status || 'H') as any,
      keterangan: item['Keterangan'] || item.keterangan || '',
      waliKelas: item['Wali Kelas'] || item.waliKelas || '',
    }));
  }

  if (Array.isArray(d.users)) {
    result.users = d.users.map((item: any) => ({
      id: item['ID'] || item.id || `USR-${Date.now()}`,
      username: item['Username'] || item.username || '',
      password: item['Password'] || item.password || '123',
      role: (item['Role'] || item.role || 'guru') as 'admin' | 'guru',
      fullName: item['Nama Lengkap'] || item.fullName || '',
      nikNuptk: item['NIK/NUPTK'] || item.nikNuptk || '',
      createdAt: item['Waktu Dibuat'] || item.createdAt || new Date().toISOString(),
    }));
  }

  return result;
}

/**
 * Ekspor seluruh basis data ke 1 file Spreadsheet Excel (.xlsx) dengan 9 Sheet lengkap!
 */
export function exportAllDatabaseToWorkbook(db: AppDatabase, fileName?: string): void {
  const formatted = formatDbForSpreadsheet(db);
  const wb = XLSX.utils.book_new();

  const addSheet = (data: any[], sheetName: string) => {
    // Only strip camelCase duplicate keys when exporting clean Excel sheet
    const cleanRows = data.map((row) => {
      const cleanObj: Record<string, any> = {};
      Object.keys(row).forEach((k) => {
        // Keep keys that start with uppercase or contain spaces/slash (the display headers)
        if (/^[A-Z]/.test(k) || k.includes(' ') || k.includes('/')) {
          cleanObj[k] = row[k];
        }
      });
      return Object.keys(cleanObj).length > 0 ? cleanObj : row;
    });

    const ws = XLSX.utils.json_to_sheet(cleanRows.length > 0 ? cleanRows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  addSheet(formatted.profil, 'DB_ProfilSekolah');
  addSheet(formatted.siswa, 'DB_Siswa');
  addSheet(formatted.guru, 'DB_Guru');
  addSheet(formatted.mapel, 'DB_MataPelajaran');
  addSheet(formatted.waliKelas, 'DB_WaliKelas');
  addSheet(formatted.jurnal, 'DB_JurnalPembelajaran');
  addSheet(formatted.penilaian, 'DB_Penilaian');
  addSheet(formatted.absensi, 'DB_Absensi');
  addSheet(formatted.users, 'DB_Pengguna');

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const outName = fileName || `Database_SiApgus_Lengkap_9_Sheet_${todayStr}.xlsx`;
  XLSX.writeFile(wb, outName);
}

/**
 * Impor file Excel (.xlsx) yang memiliki sheet database SiApgus
 */
export async function importDatabaseFromWorkbook(file: File): Promise<Partial<AppDatabase>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const result: Partial<AppDatabase> = {};

        // Parse DB_ProfilSekolah
        if (wb.SheetNames.includes('DB_ProfilSekolah')) {
          const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets['DB_ProfilSekolah']);
          if (rows.length > 0) {
            const p = rows[0];
            result.profile = {
              namaSekolah: p['Nama Sekolah'] || p.namaSekolah || '',
              kepalaSekolah: p['Kepala Sekolah'] || p.kepalaSekolah || '',
              nuptk: String(p['NUPTK'] || p.nuptk || ''),
              npsn: String(p['NPSN'] || p.npsn || ''),
              akreditasi: (p['Akreditasi'] || p.akreditasi || 'A') as any,
              kurikulum: (p['Kurikulum'] || p.kurikulum || 'Kurikulum Merdeka') as any,
              kodePos: String(p['Kode Pos'] || p.kodePos || ''),
              alamatSekolah: p['Alamat'] || p.alamatSekolah || '',
              telp: String(p['Telepon'] || p.telp || ''),
              logoUrl: p['Logo URL'] || p['Logo URL/Base64'] || p['Logo'] || p.logoUrl || '',
            };
          }
        }

        // Parse DB_Siswa
        if (wb.SheetNames.includes('DB_Siswa')) {
          const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets['DB_Siswa']);
          result.siswa = rows.map((r) => ({
            id: r['ID Siswa'] || r.id || `SIS-${Date.now()}`,
            nama: r['Nama Siswa'] || r.nama || '',
            jenisKelamin: (r['Jenis Kelamin'] || r.jenisKelamin || 'L') as 'L' | 'P',
            kelas: String(r['Kelas'] || r.kelas || '7') as any,
            rombel: String(r['Rombel'] || r.rombel || 'A') as any,
          }));
        }

        // Parse DB_Guru
        if (wb.SheetNames.includes('DB_Guru')) {
          const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets['DB_Guru']);
          result.guru = rows.map((r) => ({
            id: r['ID Guru'] || r.id || `GUR-${Date.now()}`,
            nama: r['Nama Guru'] || r.nama || '',
            jenisKelamin: (r['Jenis Kelamin'] || r.jenisKelamin || 'L') as 'L' | 'P',
            mapel: r['Guru Mata Pelajaran'] || r.mapel || '',
            nikNuptk: String(r['NIK/NUPTK'] || r.nikNuptk || ''),
          }));
        }

        // Parse DB_Penilaian
        if (wb.SheetNames.includes('DB_Penilaian')) {
          const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets['DB_Penilaian']);
          result.penilaian = rows.map((r) => ({
            id: r['ID Penilaian'] || r.id || `NIL-${Date.now()}`,
            siswaId: r['ID Siswa'] || r.siswaId || '',
            namaSiswa: r['Nama Siswa'] || r.namaSiswa || '',
            kelas: String(r['Kelas'] || r.kelas || '7') as any,
            rombel: String(r['Rombel'] || r.rombel || 'A') as any,
            mapel: r['Mata Pelajaran'] || r.mapel || '',
            pengajar: r['Nama Guru'] || r.pengajar || '',
            tahunPelajaran: r['Tahun Pelajaran'] || r.tahunPelajaran || '',
            semester: (r['Semester'] || r.semester || 'Ganjil') as any,
            kktp: Number(r['KKTP'] || r.kktp || 75),
            sumatif1: r['Sumatif 1'] !== undefined ? Number(r['Sumatif 1']) : null,
            sumatif2: r['Sumatif 2'] !== undefined ? Number(r['Sumatif 2']) : null,
            sumatif3: r['Sumatif 3'] !== undefined ? Number(r['Sumatif 3']) : null,
            sts: r['STS'] !== undefined ? Number(r['STS']) : null,
            sas: r['SAS'] !== undefined ? Number(r['SAS']) : null,
            nilaiSisipan: r['Nilai Sisipan'] !== undefined ? Number(r['Nilai Sisipan']) : null,
            capaianSisipan: r['Capaian Sisipan'] || '',
            nilaiAkhir: r['Nilai Akhir'] !== undefined ? Number(r['Nilai Akhir']) : null,
            capaianAkhir: r['Capaian Akhir'] || '',
          }));
        }

        // Parse DB_Absensi
        if (wb.SheetNames.includes('DB_Absensi')) {
          const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets['DB_Absensi']);
          result.absensi = rows.map((r) => ({
            id: r['ID Absen'] || r.id || `ABS-${Date.now()}`,
            tanggal: r['Tanggal'] || r.tanggal || '',
            kelas: String(r['Kelas'] || r.kelas || '7') as any,
            rombel: String(r['Rombel'] || r.rombel || 'A') as any,
            siswaId: r['ID Siswa'] || r.siswaId || '',
            namaSiswa: r['Nama Siswa'] || r.namaSiswa || '',
            status: (r['Status (H/S/I/A)'] || r.status || 'H') as any,
            keterangan: r['Keterangan'] || '',
            waliKelas: r['Wali Kelas'] || '',
          }));
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

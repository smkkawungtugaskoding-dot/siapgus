/**
 * ============================================================================
 * SISTEM APLIKASI GURU SEKOLAH (SiApgus)
 * Google Apps Script Backend (Code.gs)
 * ============================================================================
 * Script ini berfungsi ganda:
 * 1. Web App Server: Menampilkan antarmuka aplikasi SiApgus (Index.html) langsung
 *    di browser tanpa perlu hosting atau server eksternal (100% GRATIS).
 * 2. Database Server: Mengelola pembacaan dan penyimpanan 9 tabel database
 *    sekolah langsung di Google Spreadsheet.
 *
 * CARA PEMASANGAN DI GOOGLE SPREADSHEET:
 * ----------------------------------------------------------------------------
 * 1. Buka Google Drive (drive.google.com) dan buat Spreadsheet baru.
 *    Beri nama Spreadsheet: "Database SiApgus".
 * 2. Di menu atas Spreadsheet, klik: "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus seluruh kode bawaan di file "Code.gs", lalu SALIN & TEMPEL kode ini.
 * 4. Tambahkan file HTML baru di Apps Script:
 *    - Klik ikon (+) di samping "File" > Pilih "HTML".
 *    - Beri nama persis: Index (tanpa .html).
 *    - Salin dan tempelkan seluruh isi file Index.html ke dalamnya.
 * 5. Jalankan fungsi "setupDatabase()" satu kali:
 *    - Di toolbar atas, pilih fungsi "setupDatabase".
 *    - Klik tombol "Jalankan" (Run).
 *    - Izinkan akses / permission saat diminta oleh Google.
 * 6. Terapkan sebagai Aplikasi Web (Web App):
 *    - Klik tombol biru "Terapkan" (Deploy) di kanan atas > "Penerapan baru" (New deployment).
 *    - Klik ikon roda gigi > Pilih "Aplikasi web" (Web app).
 *    - Deskripsi: SiApgus Versi 1.0
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Yang memiliki akses: "Siapa saja" (Anyone) -> PENTING!
 *    - Klik "Terapkan" (Deploy).
 * 7. Salin "URL Aplikasi Web" yang diberikan. Anda dapat membuka URL tersebut
 *    di laptop atau HP mana saja untuk menggunakan SiApgus!
 * ============================================================================
 */

// Daftar nama sheet database sekolah
const SHEET_NAMES = {
  USERS: 'DB_Pengguna',
  PROFIL: 'DB_ProfilSekolah',
  SISWA: 'DB_Siswa',
  GURU: 'DB_Guru',
  MAPEL: 'DB_MataPelajaran',
  WALI_KELAS: 'DB_WaliKelas',
  JURNAL: 'DB_JurnalPembelajaran',
  PENILAIAN: 'DB_Penilaian',
  ABSENSI: 'DB_Absensi'
};

/**
 * Handle HTTP GET Request
 * Saat URL dibuka di browser, fungsi ini otomatis menyajikan Index.html
 */
function doGet(e) {
  // Jika parameter query meminta JSON (misal ?action=getAllData)
  if (e && e.parameter && e.parameter.action && e.parameter.action !== 'html') {
    return handleApiGet(e);
  }

  // Tampilkan antarmuka Web App SiApgus
  try {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('SiApgus - Sistem Aplikasi Guru Sekolah')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
  } catch (err) {
    return ContentService.createTextOutput(
      'SiApgus Web App Backend Aktif.\n' +
      'Catatan: Pastikan Anda telah membuat file HTML bernama "Index" di Apps Script.\n' +
      'Error: ' + err.toString()
    ).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Handle API GET Request
 */
function handleApiGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'getAllData') {
    return respondJSON({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: fetchAllSheetsData(ss)
    });
  }

  if (action === 'getSheet') {
    const sheetKey = e.parameter.sheet;
    const sheetName = SHEET_NAMES[sheetKey] || sheetKey;
    const data = getSheetData(ss, sheetName);
    return respondJSON({ status: 'success', sheet: sheetName, count: data.length, data: data });
  }

  return respondJSON({
    status: 'online',
    app: 'SiApgus - Sistem Aplikasi Guru Sekolah',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle HTTP POST Request (REST API endpoint untuk simpan data dari luar)
 */
function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    const action = postData.action || 'syncAll';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'syncAll' || action === 'saveAll') {
      const payload = postData.payload || postData.data || {};
      savePayloadToSheets(ss, payload);
      return respondJSON({
        status: 'success',
        message: 'Seluruh database SiApgus berhasil disimpan ke Google Spreadsheet!',
        timestamp: new Date().toISOString()
      });
    }

    return respondJSON({ status: 'error', message: 'Action tidak dikenali: ' + action });
  } catch (err) {
    return respondJSON({ status: 'error', message: err.toString() });
  }
}

// ============================================================================
// FUNGSI RPC LANGSUNG UNTUK GOOGLE APPS SCRIPT (google.script.run)
// Fungsi ini dipanggil langsung dari Index.html tanpa kendala CORS
// ============================================================================

/**
 * Mengambil seluruh database sekolah langsung ke Index.html
 */
function apiGetDatabase() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Jika sheet belum ada, inisialisasi dulu
    if (!ss.getSheetByName(SHEET_NAMES.PROFIL)) {
      setupDatabase();
    }
    const data = fetchAllSheetsData(ss);
    return {
      status: 'success',
      data: data,
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId(),
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

/**
 * Menyimpan seluruh perubahan database dari Index.html ke Google Spreadsheet
 */
function apiSaveDatabase(payloadOrJsonString) {
  try {
    let payload = payloadOrJsonString;
    if (typeof payloadOrJsonString === 'string') {
      payload = JSON.parse(payloadOrJsonString);
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    savePayloadToSheets(ss, payload);
    return {
      status: 'success',
      message: 'Data berhasil disinkronkan ke Google Spreadsheet!',
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

/**
 * Mengembalikan informasi spreadsheet aktif
 */
function apiGetSystemInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    spreadsheetName: ss.getName(),
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    userEmail: Session.getActiveUser().getEmail() || 'Pengguna SiApgus'
  };
}

// ============================================================================
// LOGIKA DATABASE & SPREADSHEET ENGINE
// ============================================================================

/**
 * Membaca seluruh sheet menjadi struktur objek lengkap
 */
function fetchAllSheetsData(ss) {
  const profilRows = getSheetData(ss, SHEET_NAMES.PROFIL);
  return {
    users: getSheetData(ss, SHEET_NAMES.USERS),
    profil: profilRows.length > 0 ? profilRows[0] : null,
    siswa: getSheetData(ss, SHEET_NAMES.SISWA),
    guru: getSheetData(ss, SHEET_NAMES.GURU),
    mapel: getSheetData(ss, SHEET_NAMES.MAPEL),
    waliKelas: getSheetData(ss, SHEET_NAMES.WALI_KELAS),
    jurnal: getSheetData(ss, SHEET_NAMES.JURNAL),
    penilaian: getSheetData(ss, SHEET_NAMES.PENILAIAN),
    absensi: getSheetData(ss, SHEET_NAMES.ABSENSI)
  };
}

/**
 * Menyimpan seluruh dataset ke sheet masing-masing
 */
function savePayloadToSheets(ss, payload) {
  if (payload.profil) {
    const profilArr = Array.isArray(payload.profil) ? payload.profil : [payload.profil];
    replaceSheetData(ss, SHEET_NAMES.PROFIL, profilArr);
  }
  if (payload.siswa) replaceSheetData(ss, SHEET_NAMES.SISWA, payload.siswa);
  if (payload.guru) replaceSheetData(ss, SHEET_NAMES.GURU, payload.guru);
  if (payload.mapel) replaceSheetData(ss, SHEET_NAMES.MAPEL, payload.mapel);
  if (payload.waliKelas) replaceSheetData(ss, SHEET_NAMES.WALI_KELAS, payload.waliKelas);
  if (payload.jurnal) replaceSheetData(ss, SHEET_NAMES.JURNAL, payload.jurnal);
  if (payload.penilaian) replaceSheetData(ss, SHEET_NAMES.PENILAIAN, payload.penilaian);
  if (payload.absensi) replaceSheetData(ss, SHEET_NAMES.ABSENSI, payload.absensi);
  if (payload.users) replaceSheetData(ss, SHEET_NAMES.USERS, payload.users);
}

/**
 * Helper untuk membaca isi sheet menjadi array of object
 */
function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].toString().trim();
      obj[key] = row[j];
    }
    result.push(obj);
  }
  return result;
}

/**
 * Helper untuk mengganti isi sheet secara terstruktur dan aman
 */
function replaceSheetData(ss, sheetName, dataArray) {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) return;
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Jika sheet belum punya header, buat header dari keys item pertama
  if (sheet.getLastRow() === 0) {
    const firstItem = dataArray[0] || {};
    const keys = Object.keys(firstItem);
    sheet.appendRow(keys);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  const rowsToInsert = dataArray.map(item => {
    return headers.map(header => {
      const h = header.toString().trim();
      if (item[h] !== undefined && item[h] !== null) return item[h];

      // Mapping cerdas camelCase <-> Nama Kolom Header
      switch (h) {
        case 'ID':
        case 'ID Siswa':
        case 'ID Guru':
        case 'ID Jurnal':
        case 'ID Penilaian':
        case 'ID Absen':
          return item.id !== undefined ? item.id : (item.siswaId || item.guruId || '');

        case 'Nama Siswa':
        case 'Nama Guru':
        case 'Nama Lengkap':
          return item.nama || item.fullName || item.namaSiswa || item.namaGuru || '';

        case 'Jenis Kelamin':
          return item.jenisKelamin || item.jk || 'L';

        case 'NIK/NUPTK':
        case 'NUPTK':
          return item.nikNuptk || item.nuptk || '';

        case 'Guru Mata Pelajaran':
        case 'Mata Pelajaran':
          return item.mapel || item.guruMataPelajaran || item.pelajaran || '';

        case 'Tugas Tambahan':
          return item.tugasTambahan || '';

        case 'Kelas':
        case 'Kode Kelas':
          return item.kelas || item.kodeKelas || '';

        case 'Rombel':
          return item.rombel || '';

        case 'Hari/Tanggal':
        case 'Tanggal':
          return item.tanggal || '';

        case 'Status (H/S/I/A)':
        case 'Status':
          return item.status || 'H';

        case 'Keterangan':
          return item.keterangan || '';

        case 'Wali Kelas':
          return item.waliKelas || '';

        case 'Capaian Pembelajaran (CP)':
        case 'Capaian Pembelajaran':
          return item.capaianPembelajaran || '';

        case 'Tujuan Pembelajaran (TP)':
        case 'Tujuan Pembelajaran':
          return item.tujuanPembelajaran || '';

        case 'Refleksi Guru & Asesmen':
          return item.refleksi ? `${item.refleksi} | Asesmen: ${item.asesmen || ''}` : '';

        case 'KKTP':
          return item.kktp ?? 75;

        case 'Sumatif 1':
          return item.sumatif1 ?? '';
        case 'Sumatif 2':
          return item.sumatif2 ?? '';
        case 'Sumatif 3':
          return item.sumatif3 ?? '';
        case 'STS':
          return item.sts ?? '';
        case 'SAS':
          return item.sas ?? '';
        case 'Nilai Sisipan':
          return item.nilaiSisipan ?? '';
        case 'Capaian Sisipan':
          return item.capaianSisipan || '';
        case 'Nilai Akhir':
          return item.nilaiAkhir ?? '';
        case 'Capaian Akhir':
          return item.capaianAkhir || '';

        case 'Nama Sekolah':
          return item.namaSekolah || '';
        case 'Kepala Sekolah':
          return item.kepalaSekolah || '';
        case 'NPSN':
          return item.npsn || '';
        case 'Akreditasi':
          return item.akreditasi || '';
        case 'Kurikulum':
          return item.kurikulum || '';
        case 'Kode Pos':
          return item.kodePos || '';
        case 'Alamat':
        case 'Alamat Sekolah':
          return item.alamatSekolah || item.alamat || '';
        case 'Telepon':
          return item.telp || item.telepon || '';

        default:
          return item[h] !== undefined ? item[h] : '';
      }
    });
  });

  if (rowsToInsert.length > 0) {
    sheet.getRange(2, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
  }
}

/**
 * Inisialisasi struktur sheet dan data standar saat pertama kali dipasang
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Pengguna (Login)
  createSheetIfNotExists(ss, SHEET_NAMES.USERS, [
    'ID', 'Username', 'Password', 'Role', 'Nama Lengkap', 'NIK/NUPTK', 'Waktu Dibuat'
  ], [
    ['USR-001', 'admin', '123', 'admin', 'Drs. H. Mulyadi, M.Pd. (Admin)', '197503122000031002', new Date().toISOString()],
    ['USR-002', 'budi', '123', 'guru', 'Budi Santoso, S.Pd.', '198504122010011005', new Date().toISOString()],
    ['USR-003', 'siti', '123', 'guru', 'Siti Aminah, M.Pd.', '198807212015022003', new Date().toISOString()]
  ]);

  // 2. Sheet Profil Sekolah
  createSheetIfNotExists(ss, SHEET_NAMES.PROFIL, [
    'Nama Sekolah', 'Kepala Sekolah', 'NUPTK', 'NPSN', 'Akreditasi', 'Kurikulum', 'Kode Pos', 'Alamat', 'Telepon', 'Logo URL'
  ], [
    [
      'SMP NEGERI 1 KELUARGA TELADAN',
      'Drs. H. Mulyadi, M.Pd.',
      '197503122000031002',
      '20501892',
      'A',
      'Kurikulum Merdeka',
      '60234',
      'Jl. Pendidikan Karakter No. 12, Surabaya',
      '(031) 8439211',
      ''
    ]
  ]);

  // 3. Sheet Siswa
  createSheetIfNotExists(ss, SHEET_NAMES.SISWA, [
    'ID Siswa', 'Nama Siswa', 'Jenis Kelamin', 'Kelas', 'Rombel'
  ], [
    ['SIS-001', 'Aditya Pratama Putra', 'L', '7', 'A'],
    ['SIS-002', 'Anindya Kirana Putri', 'P', '7', 'A'],
    ['SIS-003', 'Bagas Satria Wibowo', 'L', '7', 'A'],
    ['SIS-004', 'Cantika Putri Ramadhani', 'P', '7', 'A'],
    ['SIS-005', 'Dimas Arya Yudha', 'L', '7', 'A'],
    ['SIS-006', 'Eka Lestari Rahayu', 'P', '7', 'A'],
    ['SIS-007', 'Fajar Nugraha', 'L', '7', 'B'],
    ['SIS-008', 'Gita Permata Sari', 'P', '7', 'B']
  ]);

  // 4. Sheet Guru
  createSheetIfNotExists(ss, SHEET_NAMES.GURU, [
    'ID Guru', 'Nama Guru', 'Jenis Kelamin', 'NIK/NUPTK', 'Guru Mata Pelajaran'
  ], [
    ['GUR-001', 'Budi Santoso, S.Pd.', 'L', '198504122010011005', 'Matematika'],
    ['GUR-002', 'Siti Aminah, M.Pd.', 'P', '198807212015022003', 'Bahasa Indonesia'],
    ['GUR-003', 'Hendra Wijaya, S.Kom.', 'L', '199201152019031008', 'Informatika'],
    ['GUR-004', 'Dewi Lestari, S.Pd.', 'P', '199011032018012004', 'Ilmu Pengetahuan Alam (IPA)']
  ]);

  // 5. Sheet Mata Pelajaran & Penugasan Guru
  createSheetIfNotExists(ss, SHEET_NAMES.MAPEL, [
    'ID', 'Kode Mapel', 'Mata Pelajaran', 'Kelas', 'Rombel', 'Nama Guru', 'Jenis Kelamin', 'Tugas Tambahan'
  ], [
    ['GM-001', 'MTK-7', 'Matematika', '7', 'A', 'Budi Santoso, S.Pd.', 'L', 'Wali Kelas 7B'],
    ['GM-002', 'MTK-7', 'Matematika', '7', 'B', 'Budi Santoso, S.Pd.', 'L', 'Wali Kelas 7B'],
    ['GM-003', 'BIN-7', 'Bahasa Indonesia', '7', 'A', 'Siti Aminah, M.Pd.', 'P', 'Wali Kelas 7A'],
    ['GM-004', 'INF-7', 'Informatika', '7', 'A', 'Hendra Wijaya, S.Kom.', 'L', 'Pembina OSIS']
  ]);

  // 6. Sheet Wali Kelas
  createSheetIfNotExists(ss, SHEET_NAMES.WALI_KELAS, [
    'ID', 'Kode Kelas', 'Rombel', 'Nama Guru', 'Jenis Kelamin', 'Guru Mata Pelajaran', 'Tugas Tambahan'
  ], [
    ['WK-001', '7', 'A', 'Siti Aminah, M.Pd.', 'P', 'Bahasa Indonesia', 'Wali Kelas 7A'],
    ['WK-002', '7', 'B', 'Budi Santoso, S.Pd.', 'L', 'Matematika', 'Wali Kelas 7B'],
    ['WK-003', '8', 'A', 'Dewi Lestari, S.Pd.', 'P', 'Ilmu Pengetahuan Alam (IPA)', 'Wali Kelas 8A'],
    ['WK-004', '9', 'A', 'Hendra Wijaya, S.Kom.', 'L', 'Informatika', 'Wali Kelas 9A']
  ]);

  // 7. Sheet Jurnal Pembelajaran
  createSheetIfNotExists(ss, SHEET_NAMES.JURNAL, [
    'ID Jurnal', 'Hari/Tanggal', 'Hari', 'Kelas', 'Jam Ke', 'Capaian Pembelajaran (CP)', 'Tujuan Pembelajaran (TP)', 'KBM', 'Refleksi Guru & Asesmen', 'Siswa Tidak Hadir', 'Nama Guru'
  ], [
    ['JRN-001', '2026-10-27', 'Senin', '7A', '1 - 2', 'Aljabar dan Persamaan Linier', 'Menyelesaikan persamaan linier satu variabel', 'Diskusi kelompok berbasis masalah (PBL)', 'Siswa antusias, 2 siswa perlu bimbingan', 'Aditya Pratama (Sakit)', 'Budi Santoso, S.Pd.']
  ]);

  // 8. Sheet Penilaian Rapor
  createSheetIfNotExists(ss, SHEET_NAMES.PENILAIAN, [
    'ID Penilaian', 'ID Siswa', 'Nama Siswa', 'Kelas', 'Rombel', 'Mata Pelajaran', 'Nama Guru', 'Tahun Pelajaran', 'Semester', 'KKTP', 
    'Sumatif 1', 'Sumatif 2', 'Sumatif 3', 'STS', 'SAS', 'Nilai Sisipan', 'Capaian Sisipan', 'Nilai Akhir', 'Capaian Akhir'
  ], [
    ['NIL-001', 'SIS-001', 'Aditya Pratama Putra', '7', 'A', 'Matematika', 'Budi Santoso, S.Pd.', '2026/2027', 'Ganjil', 75, 85, 80, 88, 82, 86, 83, 'Menunjukkan pemahaman sangat baik aljabar', 85, 'Sangat baik menyelesaikan masalah kontekstual']
  ]);

  // 9. Sheet Absensi Harian Siswa
  createSheetIfNotExists(ss, SHEET_NAMES.ABSENSI, [
    'ID Absen', 'Tanggal', 'Kelas', 'Rombel', 'ID Siswa', 'Nama Siswa', 'Status (H/S/I/A)', 'Keterangan', 'Wali Kelas'
  ], [
    ['ABS-001', '2026-10-27', '7', 'A', 'SIS-001', 'Aditya Pratama Putra', 'S', 'Surat dokter', 'Siti Aminah, M.Pd.']
  ]);

  Logger.log('Inisialisasi 9 Sheet Database SiApgus Berhasil!');
  return { status: 'success', message: 'Semua 9 sheet database SiApgus siap digunakan!' };
}

/**
 * Helper untuk membuat sheet jika belum ada beserta styling header biru resmi
 */
function createSheetIfNotExists(ss, name, headers, defaultRows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1E40AF') // Blue 800
               .setFontColor('#FFFFFF')
               .setFontWeight('bold')
               .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    if (defaultRows && defaultRows.length > 0) {
      defaultRows.forEach(row => sheet.appendRow(row));
    }
  }
  return sheet;
}

function respondJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

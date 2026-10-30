/**
 * ============================================================================
 * SISTEM APLIKASI GURU SEKOLAH (SiApgus)
 * Backend Lengkap Google Apps Script (Code.gs)
 * ============================================================================
 *
 * File ini merupakan backend lengkap untuk menghubungkan aplikasi SiApgus
 * dengan Google Spreadsheet secara real-time dan 100% GRATIS.
 *
 * FUNGSI UTAMA SCRIPT:
 * 1. Web App Server (doGet):
 *    - Menyajikan antarmuka aplikasi SiApgus (Index.html) langsung di browser
 *      desktop maupun smartphone (HP) tanpa perlu sewa hosting / domain.
 * 2. Database Server (doPost & google.script.run):
 *    - Mengelola 9 tabel database sekolah di Google Spreadsheet:
 *      1. DB_Pengguna (Akun Login Admin & Guru)
 *      2. DB_ProfilSekolah (Profil, Logo, Kepala Sekolah, NUPTK)
 *      3. DB_Siswa (Biodata Peserta Didik)
 *      4. DB_Guru (Data Dewan Guru & NUPTK)
 *      5. DB_MataPelajaran (Penugasan Guru Mapel)
 *      6. DB_WaliKelas (Penugasan Resmi Wali Kelas)
 *      7. DB_JurnalPembelajaran (Jurnal Agenda Mengajar Harian)
 *      8. DB_Penilaian (Nilai Sumatif, STS, SAS, Sisipan, Akhir & Capaian)
 *      9. DB_Absensi (Presensi Harian Siswa Hadir, Sakit, Izin, Alpa)
 *
 * PANDUAN LENGKAP CARA PEMASANGAN DI GOOGLE SPREADSHEET:
 * ----------------------------------------------------------------------------
 * 1. Buka Google Drive (https://drive.google.com) lalu buat Spreadsheet baru.
 *    Beri judul Spreadsheet: "Database SiApgus".
 * 2. Di menu atas Spreadsheet, klik menu:
 *    "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus seluruh isi kode bawaan pada editor "Code.gs", lalu SALIN dan
 *    TEMPEL SELURUH ISI KODE INI ke dalam file Code.gs tersebut.
 * 4. Tambahkan file antarmuka "Index.html":
 *    - Di panel kiri Apps Script, klik tombol (+) di samping tulisan "File".
 *    - Pilih opsi "HTML".
 *    - Beri nama persis: Index (jangan ketik .html karena Google otomatis menambahkannya).
 *    - Buka file Index.html dari aplikasi SiApgus, salin seluruh isinya, lalu
 *      tempelkan ke dalam file Index di Apps Script.
 * 5. Jalankan fungsi "setupDatabase" satu kali:
 *    - Di baris toolbar atas editor Apps Script, pilih dropdown fungsi: "setupDatabase".
 *    - Klik tombol "Jalankan" (Run / ikon segitiga).
 *    - Jika muncul permintaan izin ("Authorization Required"), klik "Tinjau Izin"
 *      (Review Permissions) > pilih akun Google Anda > klik "Lanjutan" (Advanced) >
 *      klik "Buka Database SiApgus (tidak aman)" > klik "Izinkan" (Allow).
 *    - Tunggu beberapa detik hingga 9 Sheet database otomatis terbuat dengan
 *      rapi, lengkap dengan header biru resmi dan data percontohan.
 * 6. Terapkan sebagai Aplikasi Web (Deploy as Web App):
 *    - Di sudut kanan atas editor Apps Script, klik tombol biru "Terapkan" (Deploy)
 *      lalu pilih "Penerapan baru" (New deployment).
 *    - Klik ikon roda gigi (gear) di sebelah kiri > pilih "Aplikasi web" (Web app).
 *    - Konfigurasikan:
 *      * Deskripsi: SiApgus Versi Lengkap 1.0
 *      * Jalankan sebagai (Execute as): "Saya" (Me - email akun Google Anda)
 *      * Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> SANGAT PENTING!
 *    - Klik tombol "Terapkan" (Deploy).
 * 7. Selesai!
 *    - Salin "URL Aplikasi Web" yang muncul.
 *    - Buka URL tersebut di browser untuk mengakses aplikasi SiApgus secara online.
 *    - Anda juga dapat menempelkan URL tersebut pada menu "Setting Profil Sekolah"
 *      atau "Sinkronisasi Spreadsheet" di SiApgus untuk mengaktifkan sinkronisasi otomatis.
 * ============================================================================
 */

// Konstanta Nama Sheet Database
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
 * Saat URL Web App dibuka di browser, fungsi ini menyajikan Index.html
 * atau melayani endpoint REST API jika menyertakan parameter action.
 */
function doGet(e) {
  // Jika parameter action ada dan bukan 'html', layani sebagai REST API JSON
  if (e && e.parameter && e.parameter.action && e.parameter.action !== 'html') {
    return handleApiGet(e);
  }

  // Tampilkan antarmuka Web App SiApgus (Index.html)
  try {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('SiApgus - Sistem Aplikasi Guru Sekolah')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
  } catch (err) {
    return ContentService.createTextOutput(
      'SiApgus Google Apps Script Backend Online.\n\n' +
      'Pemberitahuan:\n' +
      'Pastikan Anda telah membuat file HTML bernama "Index" di Apps Script dan menempelkan isi Index.html ke dalamnya.\n\n' +
      'Detail Pesan: ' + err.toString()
    ).setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Handle REST API GET Request
 */
function handleApiGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Ambil seluruh data database
  if (action === 'getAllData' || action === 'getDatabase') {
    return respondJSON({
      status: 'success',
      timestamp: new Date().toISOString(),
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      data: fetchAllSheetsData(ss)
    });
  }

  // 2. Ambil data sheet tertentu
  if (action === 'getSheet') {
    const sheetKey = e.parameter.sheet;
    const sheetName = SHEET_NAMES[sheetKey] || sheetKey;
    const data = getSheetData(ss, sheetName);
    return respondJSON({
      status: 'success',
      sheet: sheetName,
      count: data.length,
      data: data
    });
  }

  // 3. Tes Ping / Koneksi
  if (action === 'ping') {
    return respondJSON({
      status: 'online',
      app: 'SiApgus - Sistem Aplikasi Guru Sekolah',
      version: '1.0.0',
      spreadsheetName: ss.getName(),
      timestamp: new Date().toISOString()
    });
  }

  // Default response
  return respondJSON({
    status: 'online',
    app: 'SiApgus - Sistem Aplikasi Guru Sekolah',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle HTTP POST Request
 * Menerima payload JSON dari aplikasi SiApgus untuk disimpan ke Spreadsheet
 */
function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    const action = postData.action || 'syncAll';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Simpan Seluruh Database Sekaligus
    if (action === 'syncAll' || action === 'saveAll') {
      const payload = postData.payload || postData.data || {};
      savePayloadToSheets(ss, payload);
      return respondJSON({
        status: 'success',
        message: 'Seluruh database SiApgus berhasil disimpan ke Google Spreadsheet!',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Simpan Parsial: Profil Sekolah
    if (action === 'saveProfile') {
      if (postData.profile) {
        ensureProfileLogoColumn(ss);
        replaceSheetData(ss, SHEET_NAMES.PROFIL, [postData.profile]);
      }
      return respondJSON({ status: 'success', message: 'Profil sekolah berhasil disimpan.' });
    }

    // 3. Simpan Parsial: Penilaian Rapor Batch
    if (action === 'savePenilaianBatch') {
      if (postData.penilaian && Array.isArray(postData.penilaian)) {
        replaceSheetData(ss, SHEET_NAMES.PENILAIAN, postData.penilaian);
      }
      return respondJSON({ status: 'success', message: 'Data penilaian rapor berhasil disimpan.' });
    }

    // 4. Simpan Parsial: Absensi Batch
    if (action === 'saveAbsensiBatch') {
      if (postData.absensi && Array.isArray(postData.absensi)) {
        replaceSheetData(ss, SHEET_NAMES.ABSENSI, postData.absensi);
      }
      return respondJSON({ status: 'success', message: 'Data absensi presensi berhasil disimpan.' });
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
 * Mengambil seluruh database sekolah langsung ke Index.html via google.script.run
 */
function apiGetDatabase() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Jika sheet profil belum ada, inisialisasi otomatis
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
 * Mengembalikan informasi spreadsheet aktif dan user yang sedang login
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
 * Membaca seluruh 9 sheet menjadi struktur data objek terpadu
 */
function fetchAllSheetsData(ss) {
  const profilRows = getSheetData(ss, SHEET_NAMES.PROFIL);
  let profilObj = profilRows.length > 0 ? profilRows[0] : null;

  // Normalisasi kolom profil dan logo sekolah agar konsisten
  if (profilObj) {
    profilObj.logoUrl = profilObj['Logo URL'] || profilObj['Logo URL/Base64'] || profilObj['Logo'] || profilObj['Logo Sekolah'] || profilObj.logoUrl || '';
    profilObj.namaSekolah = profilObj['Nama Sekolah'] || profilObj.namaSekolah || '';
    profilObj.kepalaSekolah = profilObj['Kepala Sekolah'] || profilObj.kepalaSekolah || '';
    profilObj.nuptk = String(profilObj['NUPTK'] || profilObj.nuptk || '');
    profilObj.npsn = String(profilObj['NPSN'] || profilObj.npsn || '');
    profilObj.akreditasi = profilObj['Akreditasi'] || profilObj.akreditasi || 'A';
    profilObj.kurikulum = profilObj['Kurikulum'] || profilObj.kurikulum || 'Kurikulum Merdeka';
    profilObj.kodePos = String(profilObj['Kode Pos'] || profilObj.kodePos || '');
    profilObj.alamatSekolah = profilObj['Alamat'] || profilObj['Alamat Sekolah'] || profilObj.alamatSekolah || '';
    profilObj.telp = String(profilObj['Telepon'] || profilObj.telp || '');
  }

  return {
    users: getSheetData(ss, SHEET_NAMES.USERS),
    profil: profilObj,
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
 * Menyimpan seluruh dataset ke sheet masing-masing secara aman
 */
function savePayloadToSheets(ss, payload) {
  if (payload.profil) {
    ensureProfileLogoColumn(ss);
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
 * Memastikan kolom "Logo URL" selalu ada pada sheet DB_ProfilSekolah
 */
function ensureProfileLogoColumn(ss) {
  let sheet = ss.getSheetByName(SHEET_NAMES.PROFIL);
  if (!sheet) return;
  if (sheet.getLastRow() === 0) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  const hasLogo = headers.some(function(h) {
    const s = h.toString().toLowerCase();
    return s.indexOf('logo') !== -1;
  });

  if (!hasLogo) {
    const nextCol = headers.length + 1;
    sheet.getRange(1, nextCol).setValue('Logo URL')
      .setBackground('#1E40AF')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
  }
}

/**
 * Helper untuk membaca isi sheet menjadi array of object JSON
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

  // Jika sheet belum memiliki baris header, generate dari properti objek pertama
  if (sheet.getLastRow() === 0) {
    const firstItem = dataArray[0] || {};
    const keys = Object.keys(firstItem);
    sheet.appendRow(keys);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];

  // Hapus baris data lama (baris 2 ke bawah), pertahankan baris 1 (header)
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  const rowsToInsert = dataArray.map(item => {
    return headers.map(header => {
      const h = header.toString().trim();
      if (item[h] !== undefined && item[h] !== null) return item[h];

      // Mapping cerdas camelCase <-> Nama Kolom Header Resmi
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

        case 'Logo URL':
        case 'Logo URL/Base64':
        case 'Logo':
        case 'Logo Sekolah': {
          var logoVal = item.logoUrl || item['Logo URL'] || item['Logo URL/Base64'] || item['Logo'] || item['Logo Sekolah'] || item.logo || '';
          // Proteksi batas sel Google Spreadsheet (50.000 karakter)
          if (typeof logoVal === 'string' && logoVal.length > 49000) {
            logoVal = logoVal.substring(0, 49000);
          }
          return logoVal;
        }

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
 * Jalankan fungsi ini satu kali di Apps Script untuk membuat 9 sheet database
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

  ensureProfileLogoColumn(ss);

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

/**
 * Helper untuk merespons output JSON
 */
function respondJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

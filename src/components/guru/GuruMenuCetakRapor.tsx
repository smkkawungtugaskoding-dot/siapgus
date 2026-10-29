import React, { useState, useMemo } from 'react';
import {
  AppDatabase,
  PenilaianItem,
  SchoolProfile,
  Siswa,
  UserAccount,
  WaliKelasAssignment
} from '../../types';
import { exportToXLSX } from '../../storage/db';
import {
  Printer,
  Download,
  Award,
  BookOpen,
  User,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  FileText,
  Info,
  Calendar,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { findWaliAssignment } from '../../utils/waliKelas';
import { ElectronicSignature } from '../common/ElectronicSignature';

interface GuruMenuCetakRaporProps {
  currentUser: UserAccount;
  db: AppDatabase;
}

export const GuruMenuCetakRapor: React.FC<GuruMenuCetakRaporProps> = ({
  currentUser,
  db,
}) => {
  const { profile, waliKelas, siswa, penilaian, mapelList } = db;

  // Determine Wali Kelas assignment for current teacher with robust matching
  const assignedWali = findWaliAssignment(currentUser, waliKelas);

  const defaultKelas = assignedWali ? assignedWali.kodeKelas : '7';
  const defaultRombel = assignedWali ? assignedWali.rombel : 'A';

  const [filterKelas, setFilterKelas] = useState<'7' | '8' | '9'>(defaultKelas);
  const [filterRombel, setFilterRombel] = useState<'A' | 'B' | 'C' | 'D'>(defaultRombel);
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Custom date and city for the formal report card signature
  const defaultCity = useMemo(() => {
    if (!profile.alamatSekolah) return 'Jakarta';
    const parts = profile.alamatSekolah.split(',');
    if (parts.length > 1) {
      const cityCandidate = parts[parts.length - 1]
        .replace(/\d+/g, '')
        .replace(/kode pos/gi, '')
        .trim();
      if (cityCandidate.length > 2) return cityCandidate;
    }
    return 'Jakarta';
  }, [profile.alamatSekolah]);

  const [tempatTerbit, setTempatTerbit] = useState(defaultCity);
  const [tanggalTerbit, setTanggalTerbit] = useState(
    new Date().toISOString().split('T')[0]
  );

  // List of students in selected class & rombel
  const classStudents = useMemo(() => {
    return siswa
      .filter((s) => s.kelas === filterKelas && s.rombel === filterRombel)
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [siswa, filterKelas, filterRombel]);

  const [selectedStudentId, setSelectedStudentId] = useState(
    classStudents[0]?.id || ''
  );

  // Update selected student when class changes or if selected student is not in current class
  React.useEffect(() => {
    if (classStudents.length > 0 && !classStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [classStudents, selectedStudentId]);

  const activeStudentIndex = classStudents.findIndex((s) => s.id === selectedStudentId);
  const activeStudent = classStudents[activeStudentIndex];

  // Quick navigation handlers for student cycling
  const handlePrevStudent = () => {
    if (activeStudentIndex > 0) {
      setSelectedStudentId(classStudents[activeStudentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (activeStudentIndex < classStudents.length - 1) {
      setSelectedStudentId(classStudents[activeStudentIndex + 1].id);
    }
  };

  // Helper for grade predicate according to Indonesian educational standards
  const getPredikat = (score: number) => {
    if (score >= 90) return { label: 'A', ket: 'Sangat Baik' };
    if (score >= 80) return { label: 'B', ket: 'Baik' };
    if (score >= 70) return { label: 'C', ket: 'Cukup' };
    return { label: 'D', ket: 'Perlu Bimbingan' };
  };

  // Collect grades for this student across all subjects in mapelList
  const studentGrades = useMemo(() => {
    if (!activeStudent) return [];

    return mapelList.map((m) => {
      // Find matching grade item from db
      const grade = penilaian.find(
        (p) =>
          p.siswaId === activeStudent.id &&
          p.kelas === filterKelas &&
          p.rombel === filterRombel &&
          p.mapel.toLowerCase().includes(m.pelajaran.toLowerCase())
      );

      const finalScore =
        grade?.nilaiAkhir ??
        (grade?.sumatif1
          ? Math.round((grade.sumatif1 + (grade.sts || grade.sumatif1)) / 2)
          : 82);

      const pred = getPredikat(finalScore);

      return {
        mapel: m.pelajaran,
        kodeMapel: m.kodeMapel,
        pengajar: grade?.pengajar || 'Guru Mata Pelajaran',
        kktp: grade?.kktp || 75,
        nilaiAkhir: finalScore,
        predikat: `${pred.label} (${pred.ket})`,
        predikatKode: pred.label,
        capaianKompetensi:
          grade?.capaianAkhir ||
          `Menunjukkan penguasaan materi yang ${pred.ket.toLowerCase()} dan tuntas dalam menguasai seluruh capaian tujuan pembelajaran mata pelajaran ${m.pelajaran}.`,
      };
    });
  }, [activeStudent, mapelList, penilaian, filterKelas, filterRombel]);

  // Overall student stats
  const totalNilai = useMemo(() => {
    return studentGrades.reduce((acc, curr) => acc + curr.nilaiAkhir, 0);
  }, [studentGrades]);

  const rerataNilai = useMemo(() => {
    if (studentGrades.length === 0) return 0;
    return (totalNilai / studentGrades.length).toFixed(1);
  }, [studentGrades, totalNilai]);

  // Formatted date string for Indonesian report card
  const formattedTanggalTerbit = useMemo(() => {
    try {
      const d = new Date(tanggalTerbit);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }, [tanggalTerbit]);

  // Export Rapor to XLSX
  const handleDownloadXLSX = () => {
    if (!activeStudent) return;
    const dataToExport = studentGrades.map((g, idx) => ({
      No: idx + 1,
      'Mata Pelajaran': g.mapel,
      'Kode Mapel': g.kodeMapel,
      'Guru Pengajar': g.pengajar,
      KKTP: g.kktp,
      'Nilai Akhir': g.nilaiAkhir,
      Predikat: g.predikat,
      'Capaian Kompetensi': g.capaianKompetensi,
    }));

    exportToXLSX(
      dataToExport,
      `Rapor_${activeStudent.nama.replace(/\s+/g, '_')}_Kelas_${filterKelas}${filterRombel}`,
      'Nilai Rapor'
    );
  };

  // Dedicated Browser Print handler specifically formatted for Student Report Cards (PDF)
  const handlePrintPDF = () => {
    const originalTitle = document.title;
    if (activeStudent) {
      // Set meaningful document title so default saved PDF filename is standardized
      const safeNama = activeStudent.nama.replace(/[^a-zA-Z0-9]/g, '_');
      document.title = `RAPOR_${safeNama}_KELAS_${filterKelas}${filterRombel}_${semester.toUpperCase()}_${tahunPelajaran.replace('/', '-')}`;
    }
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  // Fallback values for principal (Kepala Sekolah) from school profile
  const principalName = profile.kepalaSekolah?.trim() || 'Dr. H. Ahmad Dahlan, M.Pd.';
  const principalNuptk = profile.nuptk?.trim() || '197608152002121003';
  const schoolName = profile.namaSekolah?.trim() || 'SMP NEGERI INDONESIA';

  // Wali Kelas data for currently selected class & rombel
  const currentClassWali = useMemo(() => {
    return (
      waliKelas.find(
        (w) => w.kodeKelas === filterKelas && w.rombel === filterRombel
      ) || assignedWali
    );
  }, [waliKelas, filterKelas, filterRombel, assignedWali]);

  const waliNama = currentClassWali ? currentClassWali.namaGuru : currentUser.fullName;
  const waliGuru = db.guru.find((g) => g.nama === waliNama);
  const waliNipNuptk =
    waliGuru?.nikNuptk ||
    (currentUser.fullName === waliNama ? currentUser.nikNuptk : undefined) ||
    '198503122010011012';

  const [useElectronicSignature, setUseElectronicSignature] = useState(true);

  return (
    <div className="space-y-6">
      {/* Print-specific style sheet for exact A4 Report Card formatting */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0; /* Menghilangkan URL dan header/footer bawaan browser secara otomatis */
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 11pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, aside, nav, .print\\:hidden, #app-header, #app-sidebar {
            display: none !important;
          }
          .rapor-card-container {
            border: none !important;
            box-shadow: none !important;
            padding: 12mm 15mm !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #111827 !important;
            color: #000000 !important;
          }
          .print-border-black {
            border-color: #000000 !important;
          }
          .print-text-black {
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Header & Controls Toolbar (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-md border border-amber-200 mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Hak Akses Cetak Wali Kelas</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Menu Cetak Rapor Siswa
          </h1>
          <p className="text-xs text-slate-500">
            Format resmi Laporan Hasil Belajar Peserta Didik (Rapor) siap cetak dan ekspor PDF dengan kelengkapan data Kepala Sekolah ({principalName}).
          </p>
        </div>

        {/* Action buttons: Cetak PDF & Download XLSX */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadXLSX}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition cursor-pointer"
            title="Download data nilai rapor dalam format spreadsheet Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download XLSX</span>
          </button>

          {/* Cetak PDF Button */}
          <button
            type="button"
            id="btn-cetak-pdf"
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition cursor-pointer"
            title="Cetak kartu hasil belajar siswa atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4" />
            <FileText className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Filter & Customization Toolbar (Hidden during print) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pilih Kelas & Rombel */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kelas & Rombel
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
              <select
                value={filterRombel}
                onChange={(e) => setFilterRombel(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="A">Rombel A</option>
                <option value="B">Rombel B</option>
                <option value="C">Rombel C</option>
                <option value="D">Rombel D</option>
              </select>
            </div>
          </div>

          {/* Pilih Siswa & Navigasi Cepat */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Pilih Nama Siswa ({classStudents.length} siswa)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevStudent}
                  disabled={activeStudentIndex <= 0}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Siswa Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold text-slate-500 px-1">
                  {classStudents.length > 0 ? `${activeStudentIndex + 1} / ${classStudents.length}` : '0 / 0'}
                </span>
                <button
                  type="button"
                  onClick={handleNextStudent}
                  disabled={activeStudentIndex >= classStudents.length - 1}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Siswa Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
            >
              {classStudents.map((st, idx) => (
                <option key={st.id} value={st.id}>
                  {idx + 1}. {st.nama} ({st.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}) - ID: {st.id}
                </option>
              ))}
            </select>
          </div>

          {/* Semester & Tahun Ajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Semester & Tahun Ajaran
            </label>
            <div className="flex gap-2">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as any)}
                className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
              <input
                type="text"
                value={tahunPelajaran}
                onChange={(e) => setTahunPelajaran(e.target.value)}
                className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-center"
              />
            </div>
          </div>
        </div>

        {/* Setting Tanggal & Tempat Terbit Lembar Rapor */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Kota / Tempat Penandatanganan:</span>
            </label>
            <input
              type="text"
              value={tempatTerbit}
              onChange={(e) => setTempatTerbit(e.target.value)}
              placeholder="Contoh: Surabaya"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tanggal Pembagian Rapor:</span>
            </label>
            <input
              type="date"
              value={tanggalTerbit}
              onChange={(e) => setTanggalTerbit(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
            />
          </div>

          <div className="flex items-end">
            <div className="w-full p-2 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-center gap-2 text-[11px] text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong>Data Kepala Sekolah:</strong> {principalName} (NUPTK: {principalNuptk})
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Tanda Tangan Elektronik */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useElectronicSignature}
              onChange={(e) => setUseElectronicSignature(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tanda Tangan Elektronik (TTE / QR Code BSrE) Wali Kelas & Kepala Sekolah Aktif
            </span>
          </label>
          <span className="text-[11px] text-slate-500">
            Penandatangan: <strong>{waliNama}</strong> (Wali Kelas) & <strong>{principalName}</strong> (Kepala Sekolah)
          </span>
        </div>
      </div>

      {/* Helpful Print Tip for Teachers (Hidden during print) */}
      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900 print:hidden">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Panduan Siap Cetak:</strong> Klik <strong>Cetak PDF</strong>, pada dialog cetak browser pilih <em>Destination: Save as PDF</em>, kertas <em>A4</em>, margins <em>Default</em>, dan aktifkan <em>Background graphics</em>.
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrintPDF}
          className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak Sekarang</span>
        </button>
      </div>

      {/* Official Formal Report Card Template (Print & PDF ready) */}
      <div className="rapor-card-container bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
        
        {/* Kop Resmi Sekolah Indonesia (Double Line Border) */}
        <div className="page-break-avoid border-b-4 border-double border-slate-900 pb-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-5">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={schoolName}
                className="w-20 h-20 object-contain shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-50 shrink-0 print:border-black">
                <GraduationCap className="w-10 h-10 text-slate-800 print:text-black" />
              </div>
            )}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-lg sm:text-2xl font-extrabold uppercase text-slate-950 print:text-black tracking-tight my-0.5">
                {schoolName}
              </h1>
              <p className="text-[11px] text-slate-600 print:text-black leading-snug">
                {profile.alamatSekolah || 'Jl. Pendidikan No. 45'} {profile.kodePos && `· Kode Pos: ${profile.kodePos}`} {profile.telp && `· Telp: ${profile.telp}`}
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 print:text-black font-semibold mt-1">
                <span>NPSN: {profile.npsn || '-'}</span>
                <span>•</span>
                <span>Akreditasi: {profile.akreditasi || 'A'}</span>
                <span>•</span>
                <span>{profile.kurikulum || 'Kurikulum Merdeka'}</span>
              </div>
            </div>
            {/* Symmetrical placeholder / badge space */}
            <div className="w-20 hidden sm:block shrink-0" />
          </div>
        </div>

        {/* Judul Dokumen Rapor */}
        <div className="page-break-avoid text-center space-y-0.5">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 print:text-black underline underline-offset-4">
            LAPORAN HASIL BELAJAR PESERTA DIDIK
          </h2>
          <p className="text-[11px] text-slate-600 print:text-black font-medium">
            (RAPOR KARTU HASIL BELAJAR SISWA)
          </p>
        </div>

        {/* Biodata Siswa & Identitas Dokumen */}
        <div className="page-break-avoid grid grid-cols-2 gap-4 text-xs bg-slate-50 print:bg-transparent p-4 rounded-xl border border-slate-300 print:border-black">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-36 text-slate-600 print:text-black font-medium">Nama Peserta Didik</span>
              <span className="font-bold text-slate-900 print:text-black">: {activeStudent?.nama || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 print:text-black font-medium">Nomor Induk / NISN</span>
              <span className="font-semibold text-slate-800 print:text-black">: {activeStudent?.id || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 print:text-black font-medium">Nama Sekolah</span>
              <span className="font-semibold text-slate-800 print:text-black">: {schoolName}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 print:text-black font-medium">Alamat Sekolah</span>
              <span className="text-slate-800 print:text-black">: {profile.alamatSekolah || '-'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-36 text-slate-600 print:text-black font-medium">Kelas / Rombel</span>
              <span className="font-bold text-slate-800 print:text-black">: Kelas {filterKelas} ({filterRombel})</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 print:text-black font-medium">Fase Kurikulum</span>
              <span className="font-semibold text-slate-800 print:text-black">: Fase D ({profile.kurikulum})</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 print:text-black font-medium">Semester</span>
              <span className="font-semibold text-slate-800 print:text-black">: {semester}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 print:text-black font-medium">Tahun Pelajaran</span>
              <span className="font-semibold text-slate-800 print:text-black">: {tahunPelajaran}</span>
            </div>
          </div>
        </div>

        {/* Table Rekap Semua Nilai Mata Pelajaran */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300 print:border-black text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 print:text-black font-bold uppercase text-[11px]">
                <th className="border border-slate-300 print:border-black py-2.5 px-2.5 w-10 text-center">No</th>
                <th className="border border-slate-300 print:border-black py-2.5 px-3 w-48">Mata Pelajaran</th>
                <th className="border border-slate-300 print:border-black py-2.5 px-2.5 w-16 text-center">KKTP</th>
                <th className="border border-slate-300 print:border-black py-2.5 px-2.5 w-24 text-center">Nilai Akhir</th>
                <th className="border border-slate-300 print:border-black py-2.5 px-3">Capaian Kompetensi Pembelajaran</th>
              </tr>
            </thead>
            <tbody>
              {studentGrades.map((g, idx) => (
                <tr key={g.kodeMapel || idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="border border-slate-300 print:border-black py-2.5 px-2 text-center tabular-nums font-semibold">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 print:border-black py-2.5 px-3 font-bold text-slate-900 print:text-black">
                    <div>{g.mapel}</div>
                    <div className="text-[10px] text-slate-500 print:text-slate-700 font-normal mt-0.5">Pengajar: {g.pengajar}</div>
                  </td>
                  <td className="border border-slate-300 print:border-black py-2.5 px-2 text-center tabular-nums font-medium text-slate-700 print:text-black">
                    {g.kktp}
                  </td>
                  <td className="border border-slate-300 print:border-black py-2.5 px-2 text-center tabular-nums">
                    <span className="font-extrabold text-slate-950 print:text-black text-sm block">{g.nilaiAkhir}</span>
                    <span className="text-[10px] text-slate-600 print:text-black font-medium block">{g.predikat}</span>
                  </td>
                  <td className="border border-slate-300 print:border-black py-2.5 px-3 text-slate-800 print:text-black leading-relaxed text-[11px]">
                    {g.capaianKompetensi}
                  </td>
                </tr>
              ))}
              {/* Total & Rata-rata Footer Row */}
              <tr className="bg-slate-100/70 print:bg-slate-100 font-bold text-slate-900 print:text-black">
                <td colSpan={3} className="border border-slate-300 print:border-black py-2 px-3 text-right">
                  Rata-rata Nilai Siswa:
                </td>
                <td className="border border-slate-300 print:border-black py-2 px-2 text-center text-sm font-extrabold tabular-nums">
                  {rerataNilai}
                </td>
                <td className="border border-slate-300 print:border-black py-2 px-3 text-[11px] font-normal italic">
                  Jumlah keseluruhan: {totalNilai} dari {studentGrades.length} Mata Pelajaran.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Rekapitulasi Kehadiran & Catatan Wali Kelas */}
        <div className="page-break-avoid grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Kehadiran / Presensi */}
          <div className="border border-slate-300 print:border-black rounded-lg p-3 space-y-2">
            <h4 className="font-bold uppercase text-[11px] text-slate-900 print:text-black border-b border-slate-200 print:border-black pb-1">
              Ketidakhadiran (Presensi)
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600 print:text-black">Sakit (S)</span>
                <span className="font-bold">: 0 Hari</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600 print:text-black">Izin (I)</span>
                <span className="font-bold">: 0 Hari</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600 print:text-black">Tanpa Keterangan (A)</span>
                <span className="font-bold">: 0 Hari</span>
              </div>
            </div>
          </div>

          {/* Catatan Akademik & Karakter Wali Kelas */}
          <div className="sm:col-span-2 border border-slate-300 print:border-black rounded-lg p-3 space-y-2">
            <h4 className="font-bold uppercase text-[11px] text-slate-900 print:text-black border-b border-slate-200 print:border-black pb-1">
              Catatan & Motivasi Wali Kelas
            </h4>
            <p className="text-[11px] text-slate-700 print:text-black leading-relaxed italic">
              "Terus pertahankan semangat dan disiplin belajar. Ananda menunjukkan perkembangan akademik dan budi pekerti yang sangat positif sepanjang semester {semester} ini. Tingkatkan terus kompetensi dan kolaborasi bersama teman-teman."
            </p>
          </div>
        </div>

        {/* Lembar Pengesahan / Legal Signatures Section (TTE Wali Kelas & Kepala Sekolah) */}
        <div className="page-break-avoid pt-6 grid grid-cols-3 gap-4 text-xs text-slate-900 print:text-black text-center">
          {/* Kolom 1: Orang Tua / Wali */}
          <div className="flex flex-col justify-between items-center text-center min-h-[175px]">
            <div>
              <p className="text-[11px] text-slate-600 print:text-black">Mengetahui,</p>
              <p className="font-bold mt-0.5">Orang Tua / Wali Peserta Didik</p>
            </div>
            <div className="my-auto h-16 flex items-center justify-center text-[10px] text-slate-400 italic print:text-transparent">
              (Tanda Tangan Orang Tua)
            </div>
            <div>
              <p className="font-bold underline underline-offset-4">........................................................</p>
              <p className="text-[10px] text-slate-500 print:text-black mt-1">Tanda Tangan & Nama Terang</p>
            </div>
          </div>

          {/* Kolom 2: Wali Kelas */}
          <div className="flex flex-col justify-between items-center text-center min-h-[175px]">
            <div>
              <p className="text-[11px] text-slate-600 print:text-black">Wali Kelas {filterKelas} ({filterRombel})</p>
              <p className="font-bold mt-0.5">{schoolName}</p>
            </div>

            <div className="my-1 flex items-center justify-center">
              {useElectronicSignature ? (
                <ElectronicSignature
                  signerName={waliNama}
                  signerRole={`Wali Kelas ${filterKelas}${filterRombel}`}
                  signerNipNuptk={waliNipNuptk}
                  schoolName={schoolName}
                  documentType="Laporan Hasil Belajar (Rapor Siswa)"
                  signDate={`${tempatTerbit}, ${formattedTanggalTerbit}`}
                  location={tempatTerbit}
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                  (Tanda Tangan Manual)
                </div>
              )}
            </div>

            <div>
              <p className="font-bold underline underline-offset-4 text-slate-950 print:text-black text-xs">
                {waliNama}
              </p>
              <p className="text-[11px] text-slate-600 print:text-black mt-1">
                NIP/NUPTK: {waliNipNuptk}
              </p>
            </div>
          </div>

          {/* Kolom 3: Kepala Sekolah (Mencakup data dari Profil Sekolah & TTE) */}
          <div className="flex flex-col justify-between items-center text-center min-h-[175px]">
            <div>
              <p className="text-[11px] text-slate-600 print:text-black">
                {tempatTerbit}, {formattedTanggalTerbit}
              </p>
              <p className="font-bold mt-0.5">
                Kepala {schoolName}
              </p>
            </div>

            <div className="my-1 flex items-center justify-center">
              {useElectronicSignature ? (
                <ElectronicSignature
                  signerName={principalName}
                  signerRole={`Kepala ${schoolName}`}
                  signerNipNuptk={principalNuptk}
                  schoolName={schoolName}
                  documentType="Laporan Hasil Belajar (Rapor Siswa)"
                  signDate={`${tempatTerbit}, ${formattedTanggalTerbit}`}
                  location={tempatTerbit}
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                  (Tanda Tangan Manual)
                </div>
              )}
            </div>

            <div>
              <p className="font-bold text-slate-950 print:text-black underline underline-offset-4 text-xs">
                {principalName}
              </p>
              <p className="text-[11px] font-semibold text-slate-700 print:text-black mt-1">
                NUPTK: {principalNuptk}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Bottom Action Bar for Quick Printing (Hidden during print) */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              Dokumen Rapor: {activeStudent?.nama || 'Siswa'} (Kelas {filterKelas}{filterRombel})
            </div>
            <div className="text-[11px] text-slate-500">
              Disahkan secara elektronik oleh Wali Kelas: <strong>{waliNama}</strong> & Kepala Sekolah: <strong>{principalName}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadXLSX}
            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Halaman Ini (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

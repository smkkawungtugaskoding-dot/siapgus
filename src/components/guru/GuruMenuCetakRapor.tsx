import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  AppDatabase,
  PenilaianItem,
  SchoolProfile,
  Siswa,
  UserAccount,
  WaliKelasAssignment
} from '../../types';
import { generateCapaianDeskripsi } from '../../storage/db';
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
  ShieldCheck,
  Eye,
  X,
  Lock,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';
import { findWaliAssignment } from '../../utils/waliKelas';
import { ElectronicSignature } from '../common/ElectronicSignature';

interface GuruMenuCetakRaporProps {
  currentUser: UserAccount;
  db: AppDatabase;
}

export type RaporType = 'sisipan' | 'semester';

export const GuruMenuCetakRapor: React.FC<GuruMenuCetakRaporProps> = ({
  currentUser,
  db,
}) => {
  const { profile, waliKelas, siswa, penilaian, mapelList, absensi } = db;

  // Determine Wali Kelas assignment for current teacher with robust matching
  const assignedWali = findWaliAssignment(currentUser, waliKelas);
  const isAdmin = currentUser.role === 'admin';

  // Default class & rombel lock to assigned Wali Kelas
  const defaultKelas = assignedWali ? assignedWali.kodeKelas : '7';
  const defaultRombel = assignedWali ? assignedWali.rombel : 'A';

  // State: Type of Rapor (Sisipan vs Akhir Semester)
  const [raporType, setRaporType] = useState<RaporType>('sisipan');

  // State: Filter and navigation
  const [filterKelas, setFilterKelas] = useState<'7' | '8' | '9'>(defaultKelas);
  const [filterRombel, setFilterRombel] = useState<'A' | 'B' | 'C' | 'D'>(defaultRombel);
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // State: Print preview modal
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Custom date and city for the formal report card signature
  const defaultCity = useMemo(() => {
    if (!profile.alamatSekolah) return 'Surabaya';
    const parts = profile.alamatSekolah.split(',');
    if (parts.length > 1) {
      const cityCandidate = parts[parts.length - 1]
        .replace(/\d+/g, '')
        .replace(/kode pos/gi, '')
        .trim();
      if (cityCandidate.length > 2) return cityCandidate;
    }
    return 'Surabaya';
  }, [profile.alamatSekolah]);

  const [tempatTerbit, setTempatTerbit] = useState(defaultCity);
  const [tanggalTerbit, setTanggalTerbit] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [useElectronicSignature, setUseElectronicSignature] = useState(true);

  // Fallback values for principal (Kepala Sekolah) dynamically connected from School Profile (Setting)
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

  // Collect grades for active student across all subjects in mapelList from Input Rapor
  const studentGrades = useMemo(() => {
    if (!activeStudent) return [];

    return mapelList.map((m) => {
      // Find matching grade item recorded in Input Rapor
      const grade = penilaian.find(
        (p) =>
          p.siswaId === activeStudent.id &&
          p.kelas === filterKelas &&
          p.rombel === filterRombel &&
          p.mapel.toLowerCase().includes(m.pelajaran.toLowerCase())
      );

      const kktp = grade?.kktp || 75;
      const s1 = grade?.sumatif1 ?? null;
      const s2 = grade?.sumatif2 ?? null;
      const s3 = grade?.sumatif3 ?? null;
      const sts = grade?.sts ?? null;
      const sas = grade?.sas ?? null;

      if (raporType === 'sisipan') {
        // Rapor Sisipan (Tengah Semester): prioritize grade.nilaiSisipan from Input Rapor
        let finalSisipanScore = grade?.nilaiSisipan;
        if (finalSisipanScore == null) {
          if (sts != null) {
            finalSisipanScore = Math.round(((s1 || 80) + (s2 || s1 || 80) + sts) / (s2 != null ? 3 : 2));
          } else if (s1 != null) {
            finalSisipanScore = s1;
          } else {
            finalSisipanScore = 82;
          }
        }

        const pred = getPredikat(finalSisipanScore);
        const capaianDesc =
          grade?.capaianSisipan ||
          generateCapaianDeskripsi(finalSisipanScore, kktp, m.pelajaran, 'sisipan');

        return {
          mapel: m.pelajaran,
          kodeMapel: m.kodeMapel,
          pengajar: grade?.pengajar || 'Guru Mata Pelajaran',
          kktp,
          s1,
          s2,
          s3,
          sts,
          sas,
          nilaiUtama: finalSisipanScore,
          predikat: `${pred.label} (${pred.ket})`,
          predikatKode: pred.label,
          capaianKompetensi: capaianDesc,
        };
      } else {
        // Rapor Akhir Semester: prioritize grade.nilaiAkhir from Input Rapor
        let finalSemesterScore = grade?.nilaiAkhir;
        if (finalSemesterScore == null) {
          if (sas != null) {
            finalSemesterScore = Math.round(((s1 || 80) + (sts || 80) + sas) / 3);
          } else if (sts != null) {
            finalSemesterScore = Math.round(((s1 || 80) + sts) / 2);
          } else {
            finalSemesterScore = grade?.nilaiSisipan || 83;
          }
        }

        const pred = getPredikat(finalSemesterScore);
        const capaianDesc =
          grade?.capaianAkhir ||
          generateCapaianDeskripsi(finalSemesterScore, kktp, m.pelajaran, 'akhir');

        return {
          mapel: m.pelajaran,
          kodeMapel: m.kodeMapel,
          pengajar: grade?.pengajar || 'Guru Mata Pelajaran',
          kktp,
          s1,
          s2,
          s3,
          sts,
          sas,
          nilaiUtama: finalSemesterScore,
          predikat: `${pred.label} (${pred.ket})`,
          predikatKode: pred.label,
          capaianKompetensi: capaianDesc,
        };
      }
    });
  }, [activeStudent, mapelList, penilaian, filterKelas, filterRombel, raporType]);

  // Overall student stats
  const totalNilai = useMemo(() => {
    return studentGrades.reduce((acc, curr) => acc + curr.nilaiUtama, 0);
  }, [studentGrades]);

  const rerataNilai = useMemo(() => {
    if (studentGrades.length === 0) return 0;
    return (totalNilai / studentGrades.length).toFixed(1);
  }, [studentGrades, totalNilai]);

  // Student Attendance Recap from absensi database
  const studentAttendance = useMemo(() => {
    if (!activeStudent) return { sakit: 0, izin: 0, alpa: 0 };
    const records = absensi.filter((a) => a.siswaId === activeStudent.id);
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    records.forEach((r) => {
      if (r.status === 'S') sakit++;
      else if (r.status === 'I') izin++;
      else if (r.status === 'A') alpa++;
    });
    return { sakit, izin, alpa };
  }, [activeStudent, absensi]);

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

  // Export Rapor to XLSX formatted spreadsheet with all metadata and signatures
  const handleDownloadXLSX = () => {
    if (!activeStudent) return;

    const judulDoc =
      raporType === 'sisipan'
        ? 'RAPOR SISIPAN (TENGAH SEMESTER)'
        : 'RAPOR AKHIR SEMESTER';

    // Build worksheet data rows
    const wsData: any[][] = [
      [schoolName.toUpperCase()],
      [`LAPORAN HASIL BELAJAR PESERTA DIDIK - ${judulDoc}`],
      [`Tahun Ajaran: ${tahunPelajaran} | Semester: ${semester} | Kurikulum: ${profile.kurikulum || 'Kurikulum Merdeka'}`],
      [],
      ['IDENTITAS SISWA'],
      ['Nama Siswa', activeStudent.nama, '', 'Kelas / Rombel', `${filterKelas} - ${filterRombel}`],
      ['Nomor Induk (NISN/ID)', activeStudent.id, '', 'Jenis Kelamin', activeStudent.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
      ['Wali Kelas', waliNama, '', 'Kepala Sekolah', principalName],
      [],
      // Table Header
      [
        'No',
        'Mata Pelajaran',
        'Guru Pengampu',
        'KKTP',
        ...(raporType === 'sisipan'
          ? ['Sumatif 1', 'Sumatif 2', 'STS', 'Nilai Akhir Sisipan']
          : ['Rata-rata Sumatif', 'STS', 'SAS', 'Nilai Akhir Rapor']),
        'Predikat',
        'Capaian Kompetensi Pembelajaran',
      ],
    ];

    // Populate rows
    studentGrades.forEach((g, idx) => {
      if (raporType === 'sisipan') {
        wsData.push([
          idx + 1,
          g.mapel,
          g.pengajar,
          g.kktp,
          g.s1 ?? '-',
          g.s2 ?? '-',
          g.sts ?? '-',
          g.nilaiUtama,
          g.predikat,
          g.capaianKompetensi,
        ]);
      } else {
        const rerataS = g.s1 != null ? (g.s2 != null ? Math.round((g.s1 + g.s2) / 2) : g.s1) : '-';
        wsData.push([
          idx + 1,
          g.mapel,
          g.pengajar,
          g.kktp,
          rerataS,
          g.sts ?? '-',
          g.sas ?? '-',
          g.nilaiUtama,
          g.predikat,
          g.capaianKompetensi,
        ]);
      }
    });

    // Summary row
    wsData.push([]);
    wsData.push([
      '',
      'RATA-RATA NILAI KESELURUHAN',
      '',
      '',
      ...(raporType === 'sisipan' ? ['', '', ''] : ['', '', '']),
      rerataNilai,
      '',
      `Total Nilai: ${totalNilai} (${studentGrades.length} Mapel)`,
    ]);

    // Attendance Recap
    wsData.push([]);
    wsData.push(['REKAPITULASI PRESENSI / KETIDAKHADIRAN']);
    wsData.push(['Sakit (S)', `${studentAttendance.sakit} Hari`]);
    wsData.push(['Izin (I)', `${studentAttendance.izin} Hari`]);
    wsData.push(['Tanpa Keterangan (A)', `${studentAttendance.alpa} Hari`]);

    // Signatures
    wsData.push([]);
    wsData.push([`${tempatTerbit}, ${formattedTanggalTerbit}`]);
    wsData.push(['Mengetahui,', 'Wali Kelas,', 'Mengetahui,']);
    wsData.push(['Orang Tua / Wali Siswa', `Wali Kelas ${filterKelas}${filterRombel}`, `Kepala ${schoolName}`]);
    wsData.push(['', '', '']);
    wsData.push(['', '', '']);
    wsData.push([
      '( ....................................... )',
      `${waliNama} (NIP/NUPTK: ${waliNipNuptk})`,
      `${principalName} (NUPTK: ${principalNuptk})`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    const sheetTitle = raporType === 'sisipan' ? 'Rapor Sisipan' : 'Rapor Akhir Semester';
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

    const safeNama = activeStudent.nama.replace(/\s+/g, '_');
    const safeTipe = raporType === 'sisipan' ? 'SISIPAN' : 'AKHIR_SEMESTER';
    XLSX.writeFile(
      wb,
      `RAPOR_${safeTipe}_${safeNama}_KELAS_${filterKelas}${filterRombel}.xlsx`
    );
  };

  // Dedicated Browser Print handler specifically formatted for Student Report Cards (PDF)
  const handlePrintPDF = () => {
    const originalTitle = document.title;
    if (activeStudent) {
      const safeNama = activeStudent.nama.replace(/[^a-zA-Z0-9]/g, '_');
      const tipeLabel = raporType === 'sisipan' ? 'SISIPAN' : 'AKHIR_SEMESTER';
      document.title = `RAPOR_${tipeLabel}_${safeNama}_KELAS_${filterKelas}${filterRombel}_${semester.toUpperCase()}_${tahunPelajaran.replace('/', '-')}`;
    }
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Print-specific style sheet for exact A4 Report Card formatting */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 10.5pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, aside, nav, .print\\:hidden, #app-header, #app-sidebar, .no-print {
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
        }
      `}</style>

      {/* Header & Access Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-md border border-amber-200 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {assignedWali
                ? `Wali Kelas Terdaftar: Kelas ${assignedWali.kodeKelas}${assignedWali.rombel}`
                : 'Akses Cetak Rapor: Administrator'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Menu Cetak Rapor Siswa</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
              {raporType === 'sisipan' ? 'Mode Rapor Sisipan' : 'Mode Rapor Akhir Semester'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekap nilai semua mata pelajaran ditarik otomatis dari Input Rapor guru mapel, dilengkapi legalitas tanda tangan Kepala Sekolah ({principalName}).
          </p>
        </div>

        {/* Action buttons: Print Preview, Cetak PDF, Download XLSX */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Print Preview Button */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer shadow-2xs"
            title="Lihat tampilan cetak A4 sebelum mencetak"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Print Preview</span>
          </button>

          {/* Download XLSX Button */}
          <button
            type="button"
            onClick={handleDownloadXLSX}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer shadow-2xs"
            title="Download data nilai rapor lengkap dalam format Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download XLSX</span>
          </button>

          {/* Cetak PDF Button */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition cursor-pointer"
            title="Cetak langsung atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Primary Mode Toggle: Cetak Rapor Sisipan vs Cetak Rapor Akhir Semester */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex flex-col sm:flex-row gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setRaporType('sisipan')}
          className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            raporType === 'sisipan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <div className="text-left">
            <div className="leading-tight">Cetak Rapor Sisipan</div>
            <div className={`text-[10px] font-normal ${raporType === 'sisipan' ? 'text-blue-100' : 'text-slate-500'}`}>
              Nilai Akhir Sisipan & Capaian STS (Tengah Semester)
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRaporType('semester')}
          className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            raporType === 'semester'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <div className="text-left">
            <div className="leading-tight">Cetak Rapor Akhir Semester</div>
            <div className={`text-[10px] font-normal ${raporType === 'semester' ? 'text-rose-100' : 'text-slate-500'}`}>
              Nilai Akhir Rapor & Capaian SAS (Akhir Semester)
            </div>
          </div>
        </button>
      </div>

      {/* Filter & Customization Toolbar (Hidden during print) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pilih Kelas & Rombel (Wali Kelas locked or Admin selectable) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Kelas & Rombel
              </label>
              {!isAdmin && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Terkunci Wali
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterKelas}
                onChange={(e) => isAdmin && setFilterKelas(e.target.value as any)}
                disabled={!isAdmin}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold disabled:opacity-85 disabled:cursor-not-allowed"
              >
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
              <select
                value={filterRombel}
                onChange={(e) => isAdmin && setFilterRombel(e.target.value as any)}
                disabled={!isAdmin}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold disabled:opacity-85 disabled:cursor-not-allowed"
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
                  {idx + 1}. {st.nama} ({st.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}) - NISN/ID: {st.id}
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

        {/* Setting Tanggal, Tempat Terbit, & Kepala Sekolah dari Menu Setting */}
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
            <div className="w-full p-2.5 bg-blue-50/80 border border-blue-200/90 rounded-lg flex items-center gap-2 text-[11px] text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <strong>Kepala Sekolah (Menu Setting):</strong>
                <div className="font-semibold">{principalName} · NUPTK: {principalNuptk}</div>
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
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
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

      {/* Helpful Print Tip Toolbar (Hidden during print) */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-700 print:hidden">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Nilai otomatis ditarik dari Input Rapor:{' '}
            <strong>{raporType === 'sisipan' ? 'Nilai Akhir Sisipan & Capaian STS' : 'Nilai Akhir Rapor & Capaian SAS'}</strong>.
            Gunakan tombol <strong>Print Preview</strong> untuk mengecek tampilan A4 sebelum mencetak atau menyimpan PDF.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
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
              <div className="text-[10px] tracking-widest uppercase font-bold text-slate-600 print:text-black">
                PEMERINTAH DAERAH · DINAS PENDIDIKAN
              </div>
              <h1 className="text-lg sm:text-2xl font-black uppercase text-slate-950 print:text-black tracking-tight my-0.5">
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
            {/* Symmetrical placeholder space */}
            <div className="w-20 hidden sm:block shrink-0" />
          </div>
        </div>

        {/* Judul Dokumen Rapor */}
        <div className="page-break-avoid text-center space-y-0.5">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 print:text-black underline underline-offset-4">
            {raporType === 'sisipan'
              ? 'LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR SISIPAN)'
              : 'LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR AKHIR SEMESTER)'}
          </h2>
          <p className="text-[11px] text-slate-600 print:text-black font-medium">
            {raporType === 'sisipan'
              ? 'REKAPITULASI PENILAIAN TENGAH SEMESTER (STS)'
              : 'REKAPITULASI PENILAIAN SUMATIF AKHIR SEMESTER (SAS)'}
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
              <span className="w-36 text-slate-600 print:text-black font-medium">Fase / Kurikulum</span>
              <span className="font-semibold text-slate-800 print:text-black">: Fase D ({profile.kurikulum || 'Kurikulum Merdeka'})</span>
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
                <th className="border border-slate-300 print:border-black py-2.5 px-2 w-10 text-center">No</th>
                <th className="border border-slate-300 print:border-black py-2.5 px-3 w-48">Mata Pelajaran</th>
                <th className="border border-slate-300 print:border-black py-2.5 px-2 w-14 text-center">KKTP</th>
                {raporType === 'sisipan' ? (
                  <>
                    <th className="border border-slate-300 print:border-black py-2.5 px-2 w-12 text-center">S1</th>
                    <th className="border border-slate-300 print:border-black py-2.5 px-2 w-12 text-center">S2</th>
                    <th className="border border-slate-300 print:border-black py-2.5 px-2 w-12 text-center">STS</th>
                    <th className="border border-slate-300 print:border-black py-2.5 px-2.5 w-24 text-center bg-blue-50/60 print:bg-transparent">
                      Nilai Sisipan
                    </th>
                  </>
                ) : (
                  <>
                    <th className="border border-slate-300 print:border-black py-2.5 px-2 w-14 text-center">Rerata S</th>
                    <th className="border border-slate-300 print:border-black py-2.5 px-2 w-12 text-center">STS</th>
                    <th className="border border-slate-300 print:border-black py-2.5 px-2 w-12 text-center">SAS</th>
                    <th className="border border-slate-300 print:border-black py-2.5 px-2.5 w-24 text-center bg-rose-50/60 print:bg-transparent">
                      Nilai Akhir
                    </th>
                  </>
                )}
                <th className="border border-slate-300 print:border-black py-2.5 px-3">
                  {raporType === 'sisipan' ? 'Capaian Kompetensi Sisipan' : 'Capaian Kompetensi Akhir'}
                </th>
              </tr>
            </thead>
            <tbody>
              {studentGrades.map((g, idx) => {
                const rerataS = g.s1 != null ? (g.s2 != null ? Math.round((g.s1 + g.s2) / 2) : g.s1) : '-';
                return (
                  <tr key={g.kodeMapel || idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums font-semibold">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 print:border-black py-2 px-3 font-bold text-slate-900 print:text-black">
                      <div>{g.mapel}</div>
                      <div className="text-[10px] text-slate-500 print:text-slate-700 font-normal mt-0.5">
                        Pengajar: {g.pengajar}
                      </div>
                    </td>
                    <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums font-medium text-slate-700 print:text-black">
                      {g.kktp}
                    </td>

                    {raporType === 'sisipan' ? (
                      <>
                        <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums text-slate-600 print:text-black">
                          {g.s1 ?? '-'}
                        </td>
                        <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums text-slate-600 print:text-black">
                          {g.s2 ?? '-'}
                        </td>
                        <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums text-slate-600 print:text-black">
                          {g.sts ?? '-'}
                        </td>
                        <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums bg-blue-50/30 print:bg-transparent">
                          <span className="font-extrabold text-slate-950 print:text-black text-sm block">
                            {g.nilaiUtama}
                          </span>
                          <span className="text-[10px] text-slate-600 print:text-black font-medium block">
                            {g.predikat}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums text-slate-600 print:text-black">
                          {rerataS}
                        </td>
                        <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums text-slate-600 print:text-black">
                          {g.sts ?? '-'}
                        </td>
                        <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums text-slate-600 print:text-black">
                          {g.sas ?? '-'}
                        </td>
                        <td className="border border-slate-300 print:border-black py-2 px-2 text-center tabular-nums bg-rose-50/30 print:bg-transparent">
                          <span className="font-extrabold text-slate-950 print:text-black text-sm block">
                            {g.nilaiUtama}
                          </span>
                          <span className="text-[10px] text-slate-600 print:text-black font-medium block">
                            {g.predikat}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="border border-slate-300 print:border-black py-2 px-3 text-slate-800 print:text-black leading-relaxed text-[11px]">
                      {g.capaianKompetensi}
                    </td>
                  </tr>
                );
              })}

              {/* Total & Rata-rata Footer Row */}
              <tr className="bg-slate-100/70 print:bg-slate-100 font-bold text-slate-900 print:text-black">
                <td colSpan={raporType === 'sisipan' ? 6 : 6} className="border border-slate-300 print:border-black py-2 px-3 text-right">
                  Rata-rata Nilai {raporType === 'sisipan' ? 'Sisipan' : 'Akhir Rapor'}:
                </td>
                <td className="border border-slate-300 print:border-black py-2 px-2 text-center text-sm font-extrabold tabular-nums">
                  {rerataNilai}
                </td>
                <td className="border border-slate-300 print:border-black py-2 px-3 text-[11px] font-normal italic">
                  Jumlah keseluruhan nilai: {totalNilai} dari {studentGrades.length} Mata Pelajaran.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Rekapitulasi Kehadiran & Catatan Wali Kelas */}
        <div className="page-break-avoid grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Kehadiran / Presensi Siswa */}
          <div className="border border-slate-300 print:border-black rounded-lg p-3 space-y-2">
            <h4 className="font-bold uppercase text-[11px] text-slate-900 print:text-black border-b border-slate-200 print:border-black pb-1">
              Ketidakhadiran (Presensi)
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600 print:text-black">Sakit (S)</span>
                <span className="font-bold">: {studentAttendance.sakit} Hari</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600 print:text-black">Izin (I)</span>
                <span className="font-bold">: {studentAttendance.izin} Hari</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-600 print:text-black">Tanpa Keterangan (A)</span>
                <span className="font-bold">: {studentAttendance.alpa} Hari</span>
              </div>
            </div>
          </div>

          {/* Catatan Akademik & Karakter Wali Kelas */}
          <div className="sm:col-span-2 border border-slate-300 print:border-black rounded-lg p-3 space-y-2">
            <h4 className="font-bold uppercase text-[11px] text-slate-900 print:text-black border-b border-slate-200 print:border-black pb-1">
              Catatan & Motivasi Wali Kelas
            </h4>
            <p className="text-[11px] text-slate-700 print:text-black leading-relaxed italic">
              {raporType === 'sisipan'
                ? `"Ananda telah menunjukkan perkembangan proses belajar yang konsisten pada pertengahan semester ${semester}. Terus pertahankan kedisiplinan dan tingkatkan penguasaan materi pada paruh semester berikutnya."`
                : `"Selamat atas capaian hasil belajar semester ${semester}. Pertahankan prestasi yang baik ini dan jadikan evaluasi capaian sebagai penyemangat untuk meraih hasil yang lebih gemilang."`}
            </p>
          </div>
        </div>

        {/* Lembar Pengesahan / Legal Signatures Section (3 Kolom: Orang Tua, Wali Kelas, Kepala Sekolah) */}
        <div className="page-break-avoid pt-6 grid grid-cols-3 gap-4 text-xs text-slate-900 print:text-black text-center">
          {/* Kolom 1: Orang Tua / Wali */}
          <div className="flex flex-col justify-between items-center text-center min-h-[175px]">
            <div>
              <p className="text-[11px] text-slate-600 print:text-black">Mengetahui,</p>
              <p className="font-bold mt-0.5">Orang Tua / Wali Siswa</p>
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
                  documentType={`Rapor ${raporType === 'sisipan' ? 'Sisipan' : 'Akhir Semester'}`}
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

          {/* Kolom 3: Kepala Sekolah (Otomatis dari Menu Setting) */}
          <div className="flex flex-col justify-between items-center text-center min-h-[175px]">
            <div>
              <p className="text-[11px] text-slate-600 print:text-black">
                {tempatTerbit}, {formattedTanggalTerbit}
              </p>
              <p className="font-bold mt-0.5">
                Mengetahui, Kepala Sekolah
              </p>
            </div>

            <div className="my-1 flex items-center justify-center">
              {useElectronicSignature ? (
                <ElectronicSignature
                  signerName={principalName}
                  signerRole={`Kepala ${schoolName}`}
                  signerNipNuptk={principalNuptk}
                  schoolName={schoolName}
                  documentType={`Rapor ${raporType === 'sisipan' ? 'Sisipan' : 'Akhir Semester'}`}
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

      {/* Secondary Bottom Action Bar (Hidden during print) */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${raporType === 'sisipan' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              Dokumen: {raporType === 'sisipan' ? 'Rapor Sisipan' : 'Rapor Akhir Semester'} - {activeStudent?.nama || 'Siswa'} (Kelas {filterKelas}{filterRombel})
            </div>
            <div className="text-[11px] text-slate-500">
              Pengesahan resmi: Wali Kelas <strong>{waliNama}</strong> & Kepala Sekolah <strong>{principalName}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Print Preview</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadXLSX}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>XLSX</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col p-4 sm:p-6 overflow-y-auto">
          {/* Modal Toolbar */}
          <div className="max-w-4xl w-full mx-auto bg-white rounded-t-2xl border-x border-t border-slate-300 px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Print Preview Dokumen Rapor ({raporType === 'sisipan' ? 'Rapor Sisipan' : 'Rapor Akhir Semester'})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Format Cetak Kertas Standar A4 Resmi Pemerintah / Satuan Pendidikan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / PDF Sekarang</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: A4 Paper Preview */}
          <div className="max-w-4xl w-full mx-auto bg-white rounded-b-2xl border-x border-b border-slate-300 p-8 sm:p-12 shadow-2xl mb-12">
            {/* Kop Preview */}
            <div className="border-b-4 border-double border-slate-900 pb-3 text-center mb-6">
              <div className="flex items-center justify-center gap-4">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt={schoolName} className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-50">
                    <GraduationCap className="w-8 h-8 text-slate-800" />
                  </div>
                )}
                <div>
                  <div className="text-[10px] tracking-widest uppercase font-bold text-slate-600">
                    PEMERINTAH DAERAH · DINAS PENDIDIKAN
                  </div>
                  <h2 className="text-xl font-black uppercase text-slate-950 tracking-tight">
                    {schoolName}
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    {profile.alamatSekolah || 'Jl. Pendidikan No. 45'} · Telp: {profile.telp || '-'} · NPSN: {profile.npsn || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Judul */}
            <div className="text-center mb-6">
              <h3 className="text-base font-extrabold uppercase tracking-wide underline underline-offset-4">
                {raporType === 'sisipan'
                  ? 'LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR SISIPAN)'
                  : 'LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR AKHIR SEMESTER)'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Tahun Ajaran {tahunPelajaran} · Semester {semester}
              </p>
            </div>

            {/* Biodata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-300 mb-6">
              <div>
                <p><strong>Nama Siswa:</strong> {activeStudent?.nama}</p>
                <p className="mt-1"><strong>NISN / ID:</strong> {activeStudent?.id}</p>
                <p className="mt-1"><strong>Sekolah:</strong> {schoolName}</p>
              </div>
              <div>
                <p><strong>Kelas / Rombel:</strong> Kelas {filterKelas} ({filterRombel})</p>
                <p className="mt-1"><strong>Wali Kelas:</strong> {waliNama}</p>
                <p className="mt-1"><strong>Kepala Sekolah:</strong> {principalName}</p>
              </div>
            </div>

            {/* Tabel Preview */}
            <table className="w-full border-collapse border border-slate-400 text-xs mb-6">
              <thead>
                <tr className="bg-slate-100 font-bold uppercase text-[10px]">
                  <th className="border border-slate-400 p-2 text-center w-8">No</th>
                  <th className="border border-slate-400 p-2">Mata Pelajaran</th>
                  <th className="border border-slate-400 p-2 text-center w-12">KKTP</th>
                  <th className="border border-slate-400 p-2 text-center w-16">
                    {raporType === 'sisipan' ? 'N. Sisipan' : 'N. Akhir'}
                  </th>
                  <th className="border border-slate-400 p-2 text-center w-16">Predikat</th>
                  <th className="border border-slate-400 p-2">Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((g, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-400 p-2 font-bold">{g.mapel}</td>
                    <td className="border border-slate-400 p-2 text-center">{g.kktp}</td>
                    <td className="border border-slate-400 p-2 text-center font-extrabold text-sm">{g.nilaiUtama}</td>
                    <td className="border border-slate-400 p-2 text-center">{g.predikatKode}</td>
                    <td className="border border-slate-400 p-2 text-[11px] leading-relaxed">{g.capaianKompetensi}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="border border-slate-400 p-2 text-right">Rata-rata:</td>
                  <td className="border border-slate-400 p-2 text-center font-black">{rerataNilai}</td>
                  <td colSpan={2} className="border border-slate-400 p-2 text-xs italic">Total: {totalNilai}</td>
                </tr>
              </tbody>
            </table>

            {/* Signatures Preview */}
            <div className="pt-6 grid grid-cols-3 gap-4 text-xs text-center">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Orang Tua / Wali Siswa</p>
                <div className="h-16" />
                <p className="font-bold underline">.........................................</p>
              </div>

              <div>
                <p>Wali Kelas {filterKelas}{filterRombel}</p>
                <p className="font-bold">{waliNama}</p>
                <div className="h-16 flex items-center justify-center text-[10px] text-blue-600 font-mono">
                  [TTE TERVERIFIKASI]
                </div>
                <p className="text-[10px] text-slate-600">NUPTK: {waliNipNuptk}</p>
              </div>

              <div>
                <p>{tempatTerbit}, {formattedTanggalTerbit}</p>
                <p className="font-bold">Kepala {schoolName}</p>
                <div className="h-16 flex items-center justify-center text-[10px] text-indigo-600 font-mono">
                  [TTE TERVERIFIKASI]
                </div>
                <p className="font-bold underline">{principalName}</p>
                <p className="text-[10px] text-slate-600">NUPTK: {principalNuptk}</p>
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setTimeout(handlePrintPDF, 300);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar A4 Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

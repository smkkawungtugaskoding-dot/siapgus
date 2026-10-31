import React, { useState, useEffect, useMemo } from 'react';
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
  FileSpreadsheet,
  Save,
  Calculator,
  CheckCircle,
  HelpCircle,
  Info,
  Award,
  Layers,
  Sparkles,
  BookOpen,
  AlertCircle,
  Printer,
  Eye,
  FileText,
  X,
  FileCheck
} from 'lucide-react';
import { GuruMenuCetakRapor, RaporType } from './GuruMenuCetakRapor';

export interface GuruRaporPenilaianProps {
  currentUser: UserAccount;
  db: AppDatabase;
  onSavePenilaianBatch: (updatedItems: PenilaianItem[]) => void;
  initialSubTab?: 'lingkup' | 'asesmen' | 'sisipan' | 'akhir' | 'cetak';
}

export const GuruRaporPenilaian: React.FC<GuruRaporPenilaianProps> = ({
  currentUser,
  db,
  onSavePenilaianBatch,
  initialSubTab,
}) => {
  const { profile, siswa, waliKelas, guruMapel, penilaian } = db;

  // Dropdown States
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Determine teaching classes for current guru from admin database (memoized)
  const teacherAssignments = useMemo(() => {
    return guruMapel.filter(
      (gm) =>
        gm.namaGuru.toLowerCase().trim() ===
        currentUser.fullName.toLowerCase().trim()
    );
  }, [guruMapel, currentUser.fullName]);

  // Provide assigned teaching classes from guruMapel without fake dummy data
  const availableClassButtons = useMemo(() => {
    if (teacherAssignments.length > 0) {
      return teacherAssignments.map((ta) => ({
        kelas: ta.kelas,
        rombel: ta.rombel,
        mapel: ta.guruMataPelajaran,
        pengajar: ta.namaGuru,
        kurikulum: profile.kurikulum || 'Kurikulum Merdeka',
      }));
    }
    // If admin is logged in, show all registered assignments from guruMapel
    if (currentUser.role === 'admin' && guruMapel.length > 0) {
      return guruMapel.map((ta) => ({
        kelas: ta.kelas,
        rombel: ta.rombel,
        mapel: ta.guruMataPelajaran,
        pengajar: ta.namaGuru,
        kurikulum: profile.kurikulum || 'Kurikulum Merdeka',
      }));
    }
    // Clean empty state when no classes are assigned yet
    return [];
  }, [teacherAssignments, currentUser.role, guruMapel, profile.kurikulum]);

  // Selected Class Button - dikosongkan (null) sebelum kelas dipilih oleh guru
  const [selectedClassIndex, setSelectedClassIndex] = useState<number | null>(null);
  const currentClassObj =
    selectedClassIndex !== null && availableClassButtons[selectedClassIndex]
      ? availableClassButtons[selectedClassIndex]
      : null;

  // KKTP Interval Setting
  const [kktpInterval, setKktpInterval] = useState(75);
  const [kktpSaved, setKktpSaved] = useState(false);

  // Sub Tab Views: 1. Ruang Lingkup, 2. Akhir Semester, 3. Hasil Sisipan, 4. Hasil Akhir, 5. Cetak Rapor
  const [activeTab, setActiveTab] = useState<'lingkup' | 'asesmen' | 'sisipan' | 'akhir' | 'cetak'>(
    initialSubTab || 'lingkup'
  );

  // Sync initialSubTab if provided
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Print Preview Modal States
  const [printPreviewStudentId, setPrintPreviewStudentId] = useState<string | null>(null);
  const [printPreviewType, setPrintPreviewType] = useState<RaporType>('sisipan');
  const [showRaporModal, setShowRaporModal] = useState<boolean>(false);
  const [cetakSubView, setCetakSubView] = useState<'tabel' | 'dokumen'>('tabel');

  // Local state for scores of students in the current class (memoized by class and rombel)
  const classStudents = useMemo(() => {
    if (!currentClassObj) return [];
    return siswa
      .filter(
        (s) =>
          s.kelas === currentClassObj.kelas &&
          s.rombel === currentClassObj.rombel
      )
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [siswa, currentClassObj]);

  // Scores dictionary mapped by student ID
  const [scoresState, setScoresState] = useState<{ [siswaId: string]: PenilaianItem }>({});
  const [statusMessage, setStatusMessage] = useState('');

  // Key tracking active class/semester context
  const activeContextKey = currentClassObj
    ? `${currentClassObj.kelas}-${currentClassObj.rombel}-${currentClassObj.mapel}-${tahunPelajaran}-${semester}`
    : '';

  // Load or initialize scores ONLY when a valid class is selected and context changes
  useEffect(() => {
    if (!currentClassObj) {
      setScoresState({});
      return;
    }

    const newScores: { [siswaId: string]: PenilaianItem } = {};

    classStudents.forEach((student) => {
      // Find existing record in db
      const existing = penilaian.find(
        (p) =>
          p.siswaId === student.id &&
          p.kelas === currentClassObj.kelas &&
          p.rombel === currentClassObj.rombel &&
          p.mapel === currentClassObj.mapel &&
          p.tahunPelajaran === tahunPelajaran &&
          p.semester === semester
      );

      if (existing) {
        newScores[student.id] = {
          ...existing,
          praktek: existing.praktek ?? null,
          praktekSaved: existing.praktekSaved ?? false,
        };
      } else {
        newScores[student.id] = {
          id: `NIL-${student.id}-${currentClassObj.kelas}${currentClassObj.rombel}-${Date.now()}`,
          siswaId: student.id,
          namaSiswa: student.nama,
          kelas: currentClassObj.kelas,
          rombel: currentClassObj.rombel,
          mapel: currentClassObj.mapel,
          pengajar: currentClassObj.pengajar,
          tahunPelajaran,
          semester,
          kktp: kktpInterval,
          sumatif1: null,
          sumatif2: null,
          sumatif3: null,
          sts: null,
          sas: null,
          praktek: null,
          nilaiSisipan: null,
          capaianSisipan: '',
          nilaiAkhir: null,
          capaianAkhir: '',
          sumatif1Saved: false,
          sumatif2Saved: false,
          sumatif3Saved: false,
          stsSaved: false,
          sasSaved: false,
          praktekSaved: false,
        };
      }
    });

    setScoresState(newScores);
  }, [activeContextKey, classStudents, currentClassObj, tahunPelajaran, semester, penilaian, kktpInterval]);

  // Check Wali Kelas for this class from Admin
  const designatedWaliKelas = currentClassObj
    ? waliKelas.find(
        (wk) =>
          wk.kodeKelas === currentClassObj.kelas &&
          wk.rombel === currentClassObj.rombel
      )
    : undefined;

  const isCurrentTeacherTheWali = Boolean(
    designatedWaliKelas &&
    designatedWaliKelas.namaGuru.toLowerCase().trim() ===
      currentUser.fullName.toLowerCase().trim()
  );

  // Handle Score Input Change - Clean and reliable string-to-number input
  const handleScoreChange = (
    siswaId: string,
    field: 'sumatif1' | 'sumatif2' | 'sumatif3' | 'sts' | 'sas' | 'praktek',
    val: string
  ) => {
    if (!currentClassObj) return;
    let num: number | null = null;
    const cleanDigits = val.replace(/[^0-9]/g, '');
    if (cleanDigits !== '') {
      const parsed = parseInt(cleanDigits, 10);
      if (!isNaN(parsed)) {
        num = Math.min(100, Math.max(0, parsed));
      }
    }

    setScoresState((prev) => {
      const current = prev[siswaId] || {
        id: `NIL-${siswaId}-${currentClassObj.kelas}${currentClassObj.rombel}-${Date.now()}`,
        siswaId,
        namaSiswa: '',
        kelas: currentClassObj.kelas,
        rombel: currentClassObj.rombel,
        mapel: currentClassObj.mapel,
        pengajar: currentClassObj.pengajar,
        tahunPelajaran,
        semester,
        kktp: kktpInterval,
        praktek: null,
        praktekSaved: false,
      };
      return {
        ...prev,
        [siswaId]: {
          ...current,
          [field]: num,
          // When edited, reset the green saved flag until they click save
          [`${field}Saved`]: false,
        },
      };
    });
  };

  // Save specific column (Sumatif 1, 2, 3, STS, SAS, Praktek) for all students in class
  const handleSaveScoreColumn = (field: 'sumatif1' | 'sumatif2' | 'sumatif3' | 'sts' | 'sas' | 'praktek') => {
    if (!currentClassObj) return;
    const updated = classStudents.map((st) => {
      const item = scoresState[st.id] || {
        id: `NIL-${st.id}-${currentClassObj.kelas}${currentClassObj.rombel}-${Date.now()}`,
        siswaId: st.id,
        namaSiswa: st.nama,
        kelas: currentClassObj.kelas,
        rombel: currentClassObj.rombel,
        mapel: currentClassObj.mapel,
        pengajar: currentClassObj.pengajar,
        tahunPelajaran,
        semester,
        kktp: kktpInterval,
        sumatif1: null,
        sumatif2: null,
        sumatif3: null,
        sts: null,
        sas: null,
        praktek: null,
        nilaiSisipan: null,
        capaianSisipan: '',
        nilaiAkhir: null,
        capaianAkhir: '',
      };
      return {
        ...item,
        [`${field}Saved`]: true,
        kktp: kktpInterval,
      };
    });

    const newMap: { [id: string]: PenilaianItem } = {};
    updated.forEach((u) => {
      newMap[u.siswaId] = u;
    });

    setScoresState(newMap);
    onSavePenilaianBatch(updated);
    setStatusMessage(`Nilai ${field.toUpperCase()} berhasil disimpan! Kotak nilai berubah warna hijau.`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Save single student score row
  const handleSaveStudentRow = (
    siswaId: string,
    fields: ('sumatif1' | 'sumatif2' | 'sumatif3' | 'sts' | 'sas' | 'praktek')[]
  ) => {
    setScoresState((prev) => {
      const current = prev[siswaId];
      if (!current) return prev;
      const updated: PenilaianItem = {
        ...current,
        kktp: kktpInterval,
      };
      fields.forEach((f) => {
        (updated as any)[`${f}Saved`] = true;
      });
      onSavePenilaianBatch([updated]);
      return { ...prev, [siswaId]: updated };
    });
    setStatusMessage(`Nilai siswa berhasil disimpan & kotak berubah warna hijau.`);
    setTimeout(() => setStatusMessage(''), 2500);
  };

  // Hitung Nilai Sisipan: (NA Sumatif + STS) / 2
  const handleCalculateSisipan = () => {
    if (!currentClassObj) return;
    const updated = classStudents.map((st) => {
      const item = scoresState[st.id] || {
        id: `NIL-${st.id}-${currentClassObj.kelas}${currentClassObj.rombel}-${Date.now()}`,
        siswaId: st.id,
        namaSiswa: st.nama,
        kelas: currentClassObj.kelas,
        rombel: currentClassObj.rombel,
        mapel: currentClassObj.mapel,
        pengajar: currentClassObj.pengajar,
        tahunPelajaran,
        semester,
        kktp: kktpInterval,
        sumatif1: null,
        sumatif2: null,
        sumatif3: null,
        sts: null,
        sas: null,
        praktek: null,
        nilaiSisipan: null,
        capaianSisipan: '',
        nilaiAkhir: null,
        capaianAkhir: '',
      };

      const s1 = item.sumatif1 ?? 0;
      const s2 = item.sumatif2 ?? 0;
      const s3 = item.sumatif3 ?? 0;

      // Calculate NA Sumatif Lingkup Materi
      const sumatifCounts = [item.sumatif1, item.sumatif2, item.sumatif3].filter(
        (v) => v !== null && v !== undefined
      ).length;
      const naSumatif = sumatifCounts > 0 ? (s1 + s2 + s3) / sumatifCounts : 0;

      const sts = item.sts !== null && item.sts !== undefined ? item.sts : naSumatif;
      const nilaiSisipan = Math.round((naSumatif + sts) / 2);
      const capaian = generateCapaianDeskripsi(
        nilaiSisipan,
        kktpInterval,
        currentClassObj.mapel,
        'sisipan'
      );

      return {
        ...item,
        nilaiSisipan,
        capaianSisipan: capaian,
      };
    });

    const newMap: { [id: string]: PenilaianItem } = {};
    updated.forEach((u) => {
      newMap[u.siswaId] = u;
    });

    setScoresState(newMap);
    onSavePenilaianBatch(updated);
    setStatusMessage('Nilai Sisipan dan Capaian Kompetensi berhasil dihitung otomatis!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Hitung Nilai Akhir: (NA Sumatif Lingkup + NA Sumatif Akhir Semester (STS, SAS, & Praktek)) / 2
  const handleCalculateNilaiAkhir = () => {
    if (!currentClassObj) return;
    const updated = classStudents.map((st) => {
      const item = scoresState[st.id] || {
        id: `NIL-${st.id}-${currentClassObj.kelas}${currentClassObj.rombel}-${Date.now()}`,
        siswaId: st.id,
        namaSiswa: st.nama,
        kelas: currentClassObj.kelas,
        rombel: currentClassObj.rombel,
        mapel: currentClassObj.mapel,
        pengajar: currentClassObj.pengajar,
        tahunPelajaran,
        semester,
        kktp: kktpInterval,
        sumatif1: null,
        sumatif2: null,
        sumatif3: null,
        sts: null,
        sas: null,
        praktek: null,
        nilaiSisipan: null,
        capaianSisipan: '',
        nilaiAkhir: null,
        capaianAkhir: '',
      };

      const s1 = item.sumatif1 ?? 0;
      const s2 = item.sumatif2 ?? 0;
      const s3 = item.sumatif3 ?? 0;

      const sumatifCounts = [item.sumatif1, item.sumatif2, item.sumatif3].filter(
        (v) => v !== null && v !== undefined
      ).length;
      const naSumatif = sumatifCounts > 0 ? (s1 + s2 + s3) / sumatifCounts : 0;

      // Akhir Semester (STS, SAS, dan Ujian Praktek)
      const sts = item.sts !== null && item.sts !== undefined ? item.sts : naSumatif;
      const sas = item.sas !== null && item.sas !== undefined ? item.sas : naSumatif;
      const hasPraktek = item.praktek !== null && item.praktek !== undefined;
      const naAkhirSemester = hasPraktek
        ? (sts + sas + Number(item.praktek)) / 3
        : (sts + sas) / 2;

      const nilaiAkhir = Math.round((naSumatif + naAkhirSemester) / 2);
      const capaian = generateCapaianDeskripsi(
        nilaiAkhir,
        kktpInterval,
        currentClassObj.mapel,
        'akhir'
      );

      return {
        ...item,
        nilaiAkhir,
        capaianAkhir: capaian,
      };
    });

    const newMap: { [id: string]: PenilaianItem } = {};
    updated.forEach((u) => {
      newMap[u.siswaId] = u;
    });

    setScoresState(newMap);
    onSavePenilaianBatch(updated);
    setStatusMessage('Nilai Akhir dan Capaian Kompetensi Kurikulum berhasil dihitung otomatis!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Data Penilaian Rapor Online
        </h1>
        <p className="text-xs text-slate-500">
          Sistem Penilaian Kurikulum Terintegrasi: Pengisian Nilai Ruang Lingkup (Sumatif 1, 2, 3), Asesmen Akhir Semester (STS & SAS), Hasil Sisipan, dan Nilai Akhir otomatis.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Controls: Tahun Pelajaran, Semester, and Wali Kelas Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        {/* Dropdown Tahun Pelajaran */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tahun Pelajaran
          </label>
          <select
            value={tahunPelajaran}
            onChange={(e) => setTahunPelajaran(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
            <option value="2027/2028">2027/2028</option>
          </select>
        </div>

        {/* Dropdown Semester */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Semester
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          >
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>
        </div>

        {/* Wali Kelas Automatic Banner Display (Requirement: Wali Kelas Auto Notice) */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <span className="font-bold text-slate-800 block truncate">
              {currentClassObj ? (
                isCurrentTeacherTheWali
                  ? `Anda adalah Wali Kelas ${currentClassObj.kelas}${currentClassObj.rombel}`
                  : `Wali Kelas ${currentClassObj.kelas}${currentClassObj.rombel}`
              ) : (
                'Informasi Wali Kelas'
              )}
            </span>
            <p className="text-[11px] text-slate-600 truncate">
              {currentClassObj ? (
                designatedWaliKelas
                  ? `Wali Kelas Resmi: ${designatedWaliKelas.namaGuru}`
                  : 'Belum ditentukan oleh Admin'
              ) : (
                'Pilih kelas di bawah untuk melihat status wali kelas'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Button Bar: Mengajar (Button ukuran agak besar, Kelas dan Kurikulum berjajar ke kanan) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pilih Kelas & Kurikulum Yang Anda Ajar:
          </label>
          {currentClassObj && (
            <button
              type="button"
              onClick={() => setSelectedClassIndex(null)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
            >
              Kosongkan / Reset Pilihan Kelas
            </button>
          )}
        </div>

        {availableClassButtons.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Belum ada kelas atau mata pelajaran yang terdaftar untuk pendidik ini. Silakan hubungi Administrator atau tentukan penugasan pada menu <strong>Guru Mata Pelajaran</strong> terlebih dahulu.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {availableClassButtons.map((btn, idx) => {
              const isSelected = selectedClassIndex === idx;
              return (
                <button
                  key={`${btn.kelas}-${btn.rombel}-${idx}`}
                  type="button"
                  onClick={() => setSelectedClassIndex(isSelected ? null : idx)}
                  className={`py-3.5 px-6 rounded-xl font-bold text-xs whitespace-nowrap transition-all shadow-xs cursor-pointer border flex flex-col items-start gap-1 shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 scale-102'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-extrabold flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Kelas {btn.kelas}{btn.rombel}</span>
                  </div>
                  <span className={`text-[11px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {btn.kurikulum} · {btn.mapel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!currentClassObj ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <Layers className="w-8 h-8 text-blue-600" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              Belum Ada Kelas & Kurikulum yang Dipilih
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Silakan pilih salah satu tombol kelas dan kurikulum yang Anda ajar di atas untuk membuka formulir input penilaian rapor siswa, interval KKTP, dan capaian kompetensi.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Information Header of the Selected Class (Data diambil otomatis dari admin) */}
          <div className="p-4 bg-linear-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-blue-900 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>
              Penilaian untuk: {currentClassObj.mapel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
            <span><strong>Pengajar:</strong> {currentClassObj.pengajar}</span>
            <span>·</span>
            <span><strong>Kurikulum:</strong> {currentClassObj.kurikulum}</span>
            <span>·</span>
            <span><strong>Kelas:</strong> {currentClassObj.kelas}{currentClassObj.rombel}</span>
            <span>·</span>
            <span><strong>Semester:</strong> {semester} ({tahunPelajaran})</span>
          </div>
        </div>

        {/* Setting Interval KKTP & Simpan */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-200 shrink-0">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Interval KKTP:
          </label>
          <input
            type="number"
            min={50}
            max={95}
            value={kktpInterval}
            onChange={(e) => {
              setKktpInterval(Number(e.target.value));
              setKktpSaved(false);
            }}
            className="w-14 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => {
              setKktpSaved(true);
              setStatusMessage(`Setting Interval KKTP ${kktpInterval} berhasil disimpan!`);
              setTimeout(() => setStatusMessage(''), 3000);
            }}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition"
          >
            {kktpSaved ? 'Tersimpan' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* 5 Sub-Tabs for Input Nilai: 1. Ruang Lingkup, 2. Akhir Semester, 3. Hasil Sisipan, 4. Hasil Akhir, 5. Cetak Rapor */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('lingkup')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'lingkup'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          1. Ruang Lingkup (Sumatif 1, 2, 3)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('asesmen')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'asesmen'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          2. Akhir Semester (STS, SAS & Praktek)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sisipan')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'sisipan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          3. Hasil Sisipan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('akhir')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'akhir'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          4. Hasil Akhir
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cetak')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'cetak'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>5. Cetak Rapor Siswa</span>
        </button>
      </div>

      {/* ----------------- SUB-TAB 1: RUANG LINGKUP (Sumatif 1, 2, 3) ----------------- */}
      {activeTab === 'lingkup' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800">
                Pengisian Nilai Ruang Lingkup Materi (Rentang 0 - 100)
              </h3>
              <p className="text-[11px] text-slate-500">
                Ketik nilai pada kotak yang disediakan lalu klik tombol <strong>Simpan</strong> pada baris siswa. Kotak nilai tugas & ulangan siswa akan otomatis berubah <strong>warna hijau</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 w-36 text-center">Sumatif 1 (Tugas)</th>
                    <th className="py-3 px-4 w-36 text-center">Sumatif 2 (Ulangan)</th>
                    <th className="py-3 px-4 w-36 text-center">Sumatif 3 (Ulangan)</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi Simpan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((st, idx) => {
                    const row = scoresState[st.id] || ({} as PenilaianItem);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center tabular-nums text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {st.nama}
                        </td>

                        {/* Sumatif 1 (Turns GREEN when saved) */}
                        <td className="py-3 px-4 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="0-100"
                            value={row.sumatif1 !== null && row.sumatif1 !== undefined ? row.sumatif1 : ''}
                            onChange={(e) => handleScoreChange(st.id, 'sumatif1', e.target.value)}
                            className={`w-20 px-2.5 py-1.5 text-center rounded-lg text-xs font-bold transition-all border outline-none ${
                              row.sumatif1Saved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold ring-1 ring-emerald-300'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                          />
                        </td>

                        {/* Sumatif 2 (Turns GREEN when saved) */}
                        <td className="py-3 px-4 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="0-100"
                            value={row.sumatif2 !== null && row.sumatif2 !== undefined ? row.sumatif2 : ''}
                            onChange={(e) => handleScoreChange(st.id, 'sumatif2', e.target.value)}
                            className={`w-20 px-2.5 py-1.5 text-center rounded-lg text-xs font-bold transition-all border outline-none ${
                              row.sumatif2Saved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold ring-1 ring-emerald-300'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                          />
                        </td>

                        {/* Sumatif 3 (Turns GREEN when saved) */}
                        <td className="py-3 px-4 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="0-100"
                            value={row.sumatif3 !== null && row.sumatif3 !== undefined ? row.sumatif3 : ''}
                            onChange={(e) => handleScoreChange(st.id, 'sumatif3', e.target.value)}
                            className={`w-20 px-2.5 py-1.5 text-center rounded-lg text-xs font-bold transition-all border outline-none ${
                              row.sumatif3Saved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold ring-1 ring-emerald-300'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                          />
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              handleSaveStudentRow(st.id, ['sumatif1', 'sumatif2', 'sumatif3']);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                              row.sumatif1Saved && row.sumatif2Saved && row.sumatif3Saved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                            }`}
                          >
                            <Save className="w-3 h-3" />
                            <span>{row.sumatif1Saved && row.sumatif2Saved && row.sumatif3Saved ? 'Tersimpan' : 'Simpan'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 2: AKHIR SEMESTER (STS, SAS, & UJIAN PRAKTEK) ----------------- */}
      {activeTab === 'asesmen' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800">
                Pengisian Nilai Asesmen Akhir Semester: STS, SAS, dan Nilai Ujian Praktek (Rentang 0 - 100)
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Ketik nilai pada kotak STS, SAS, dan Ujian Praktek lalu klik tombol <strong>Simpan</strong> pada baris siswa. Kotak nilai ujian/ulangan siswa akan otomatis berubah <strong>warna hijau</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-3 w-32 text-center">STS (Tengah Sem.)</th>
                    <th className="py-3 px-3 w-32 text-center">SAS (Akhir Sem.)</th>
                    <th className="py-3 px-3 w-44 text-center">Nilai Ujian Praktek (0-100)</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi Simpan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((st, idx) => {
                    const row = scoresState[st.id] || ({} as PenilaianItem);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center tabular-nums text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {st.nama}
                        </td>

                        {/* STS Input (Turns GREEN when saved) */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="0-100"
                            value={row.sts !== null && row.sts !== undefined ? row.sts : ''}
                            onChange={(e) => handleScoreChange(st.id, 'sts', e.target.value)}
                            className={`w-20 px-2 py-1.5 text-center rounded-lg text-xs font-bold transition-all border outline-none ${
                              row.stsSaved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold ring-1 ring-emerald-300'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                          />
                        </td>

                        {/* SAS Input (Turns GREEN when saved) */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="0-100"
                            value={row.sas !== null && row.sas !== undefined ? row.sas : ''}
                            onChange={(e) => handleScoreChange(st.id, 'sas', e.target.value)}
                            className={`w-20 px-2 py-1.5 text-center rounded-lg text-xs font-bold transition-all border outline-none ${
                              row.sasSaved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold ring-1 ring-emerald-300'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                          />
                        </td>

                        {/* Nilai Ujian Praktek (di sebelah kanan SAS, Turns GREEN when saved) */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={3}
                            placeholder="0-100"
                            value={row.praktek !== null && row.praktek !== undefined ? row.praktek : ''}
                            onChange={(e) => handleScoreChange(st.id, 'praktek', e.target.value)}
                            className={`w-24 px-2.5 py-1.5 text-center rounded-lg text-xs font-bold transition-all border outline-none ${
                              row.praktekSaved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold ring-1 ring-emerald-300'
                                : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                            }`}
                          />
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              handleSaveStudentRow(st.id, ['sts', 'sas', 'praktek']);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                              row.stsSaved && row.sasSaved && (row.praktekSaved || row.praktek === null || row.praktek === undefined)
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                            }`}
                          >
                            <Save className="w-3 h-3" />
                            <span>
                              {row.stsSaved && row.sasSaved && (row.praktekSaved || row.praktek === null || row.praktek === undefined)
                                ? 'Tersimpan'
                                : 'Simpan'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 3: HASIL SISIPAN ----------------- */}
      {activeTab === 'sisipan' && (
        <div className="space-y-4">
          {/* Requirement Notice & Explanation Banner */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Petunjuk & Keterangan Rapor Sisipan</span>
            </div>
            <div className="text-xs text-amber-950 font-medium bg-amber-100/60 p-3 rounded-xl border border-amber-300/60 leading-relaxed">
              <strong>Keterangan:</strong> Nilai otomatis ditarik dari Input Rapor: Nilai Akhir Sisipan & Capaian STS. Gunakan tombol Print Preview untuk mengecek tampilan A4 sebelum mencetak atau menyimpan PDF. Untuk tanda tangan kepsek sudah menggunakan tanda tangan elektronik.
            </div>
            <ul className="text-xs text-amber-900/90 space-y-1 list-disc pl-5 leading-relaxed">
              <li>Nilai diambil dari: <strong>(rata-rata lingkup materi (NA Sumatif) + STS) / 2</strong></li>
              <li>Jika Capaian Kompetensi tidak muncul bisa klik tombol <strong>Hitung Nilai Akhir Sisipan</strong> di bawah.</li>
            </ul>

            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={handleCalculateSisipan}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>Hitung Nilai Akhir Sisipan</span>
              </button>
            </div>
          </div>

          {/* Table: No, Siswa, Nilai Sisipan, Capaian Kompetensi, Tombol Cetak Rapor Sisipan */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-48">Nama Siswa</th>
                    <th className="py-3 px-4 w-28 text-center">Nilai Sisipan</th>
                    <th className="py-3 px-4">Capaian Kompetensi (STS)</th>
                    <th className="py-3 px-4 w-48 text-center">Cetak Rapor Sisipan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((st, idx) => {
                    const row = scoresState[st.id] || ({} as PenilaianItem);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center tabular-nums text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {st.nama}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold tabular-nums ${
                            row.nilaiSisipan !== null && row.nilaiSisipan !== undefined
                              ? row.nilaiSisipan >= kktpInterval
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {row.nilaiSisipan ?? '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 leading-relaxed">
                          {row.capaianSisipan || (
                            <span className="text-slate-400 italic">
                              Klik tombol "Hitung Nilai Akhir Sisipan" di atas untuk kalkulasi otomatis.
                            </span>
                          )}
                        </td>
                        {/* Tombol Cetak Rapor Sisipan (Sejajar dengan nama siswa) */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setPrintPreviewStudentId(st.id);
                              setPrintPreviewType('sisipan');
                              setShowRaporModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            title={`Print Preview Cetak Rapor Sisipan untuk ${st.nama}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Rapor Sisipan</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 4: HASIL AKHIR ----------------- */}
      {activeTab === 'akhir' && (
        <div className="space-y-4">
          {/* Requirement Notice & Explanation Banner */}
          <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Petunjuk & Keterangan Rapor Akhir Semester</span>
            </div>
            <div className="text-xs text-blue-950 font-medium bg-blue-100/70 p-3 rounded-xl border border-blue-300/60 leading-relaxed">
              <strong>Keterangan:</strong> Nilai otomatis ditarik dari Input Rapor: Nilai Akhir & Capaian SAS. Gunakan tombol Print Preview untuk mengecek tampilan A4 sebelum mencetak atau menyimpan PDF. Untuk tanda tangan kepsek sudah menggunakan tanda tangan elektronik.
            </div>
            <ul className="text-xs text-blue-900/90 space-y-1 list-disc pl-5 leading-relaxed">
              <li>Hasil yg ditampilkan adalah data perhitungan sebelum ada perubahan nilai.</li>
              <li>Nilai diambil dari: <strong>(rata-rata lingkup materi (NA Sumatif) + Rata-rata akhir semester (STS, SAS, & Praktek)) / 2</strong></li>
              <li>Jika Capaian Kompetensi belum muncul, klik tombol <strong>Hitung Nilai Akhir Rapor</strong> di bawah.</li>
            </ul>

            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={handleCalculateNilaiAkhir}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>Hitung Nilai Akhir Rapor</span>
              </button>
            </div>
          </div>

          {/* Table: No, Siswa, Nilai Akhir, Capaian Kompetensi, Tombol Cetak Rapor Akhir */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-48">Nama Siswa</th>
                    <th className="py-3 px-4 w-28 text-center">Nilai Akhir</th>
                    <th className="py-3 px-4">Capaian Kompetensi (SAS)</th>
                    <th className="py-3 px-4 w-48 text-center">Cetak Rapor Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((st, idx) => {
                    const row = scoresState[st.id] || ({} as PenilaianItem);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center tabular-nums text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {st.nama}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold tabular-nums ${
                            row.nilaiAkhir !== null && row.nilaiAkhir !== undefined
                              ? row.nilaiAkhir >= kktpInterval
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {row.nilaiAkhir ?? '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 leading-relaxed">
                          {row.capaianAkhir || (
                            <span className="text-slate-400 italic">
                              Klik tombol "Hitung Nilai Akhir Rapor" di atas untuk kalkulasi otomatis.
                            </span>
                          )}
                        </td>
                        {/* Tombol Cetak Rapor Akhir (Sejajar dengan nama siswa) */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setPrintPreviewStudentId(st.id);
                              setPrintPreviewType('semester');
                              setShowRaporModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            title={`Print Preview Cetak Rapor Akhir untuk ${st.nama}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Rapor Akhir</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB 5: CETAK RAPOR SISWA (DITEMPATKAN DI SEBELAH KANAN HASIL AKHIR) ----------------- */}
      {activeTab === 'cetak' && (
        <div className="space-y-5">
          {/* Top Banner 1: Rapor Sisipan notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Keterangan Cetak Rapor Sisipan (STS)
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                Nilai otomatis ditarik dari Input Rapor: Nilai Akhir Sisipan & Capaian STS. Gunakan tombol Print Preview untuk mengecek tampilan A4 sebelum mencetak atau menyimpan PDF. Untuk tanda tangan kepsek sudah menggunakan tanda tangan elektronik.
              </p>
            </div>
          </div>

          {/* Top Banner 2: Rapor Akhir notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Keterangan Cetak Rapor Akhir Semester (SAS)
              </h4>
              <p className="text-xs text-blue-900 leading-relaxed font-medium">
                Nilai otomatis ditarik dari Input Rapor: Nilai Akhir & Capaian SAS. Gunakan tombol Print Preview untuk mengecek tampilan A4 sebelum mencetak atau menyimpan PDF. Untuk tanda tangan kepsek sudah menggunakan tanda tangan elektronik.
              </p>
            </div>
          </div>

          {/* Sub-view Switcher & Class Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Tampilan Menu:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCetakSubView('tabel')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    cetakSubView === 'tabel'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabel Siswa & Tombol Cetak
                </button>
                <button
                  type="button"
                  onClick={() => setCetakSubView('dokumen')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    cetakSubView === 'dokumen'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pengaturan & Lembar A4 Lengkap
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Kelas: <strong className="text-slate-800">{currentClassObj.kelas}{currentClassObj.rombel}</strong> · {currentClassObj.mapel}
            </div>
          </div>

          {cetakSubView === 'tabel' ? (
            /* Student table with Sisipan & Akhir buttons aligned with each student */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 w-32">NISN / NIS</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-3 w-28 text-center">NA Sisipan</th>
                      <th className="py-3 px-3 w-28 text-center">NA Akhir</th>
                      <th className="py-3 px-4 w-44 text-center">Cetak Rapor Sisipan</th>
                      <th className="py-3 px-4 w-44 text-center">Cetak Rapor Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((st, idx) => {
                      const row = scoresState[st.id] || ({} as PenilaianItem);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-center tabular-nums text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {st.nisn || st.nis || '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {st.nama}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
                              row.nilaiSisipan !== null && row.nilaiSisipan !== undefined
                                ? row.nilaiSisipan >= kktpInterval
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {row.nilaiSisipan ?? '-'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
                              row.nilaiAkhir !== null && row.nilaiAkhir !== undefined
                                ? row.nilaiAkhir >= kktpInterval
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {row.nilaiAkhir ?? '-'}
                            </span>
                          </td>

                          {/* Tombol Cetak Rapor Sisipan (Sejajar dengan nama siswa) */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setPrintPreviewStudentId(st.id);
                                setPrintPreviewType('sisipan');
                                setShowRaporModal(true);
                              }}
                              className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Sisipan</span>
                            </button>
                          </td>

                          {/* Tombol Cetak Rapor Akhir (Sejajar dengan nama siswa) */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setPrintPreviewStudentId(st.id);
                                setPrintPreviewType('semester');
                                setShowRaporModal(true);
                              }}
                              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Rapor Akhir</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Embedded full GuruMenuCetakRapor component with official paper controls */
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
              <GuruMenuCetakRapor
                currentUser={currentUser}
                db={db}
                initialKelas={currentClassObj.kelas as any}
                initialRombel={currentClassObj.rombel as any}
                isEmbedded={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Print Preview Modal with Official A4 Layout & Electronic Signature */}
      {showRaporModal && currentClassObj && (
        <GuruMenuCetakRapor
          currentUser={currentUser}
          db={db}
          initialKelas={currentClassObj.kelas as any}
          initialRombel={currentClassObj.rombel as any}
          initialRaporType={printPreviewType}
          initialStudentId={printPreviewStudentId || undefined}
          initialShowPreviewModal={true}
          onCloseModal={() => setShowRaporModal(false)}
        />
      )}
        </>
      )}
    </div>
  );
};

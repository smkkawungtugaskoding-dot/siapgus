import React from 'react';
import { AppDatabase, UserAccount } from '../../types';
import {
  Users,
  Layers,
  BookOpen,
  Calendar,
  Sparkles,
  Award,
  CheckCircle,
  FileSpreadsheet,
  CheckSquare,
  Printer,
  FileText,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { findWaliAssignment } from '../../utils/waliKelas';

interface GuruDashboardProps {
  currentUser: UserAccount;
  loginTime: string;
  db: AppDatabase;
  onNavigate: (menu: string) => void;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({
  currentUser,
  loginTime,
  db,
  onNavigate,
}) => {
  const { siswa, guru, kelasList, guruMapel, waliKelas, profile } = db;

  // Robustly determine if this guru is a designated wali kelas
  const currentWaliAssignment = findWaliAssignment(currentUser, waliKelas);

  // Teaching classes assigned to this guru
  const myAssignedClasses = guruMapel.filter(
    (gm) =>
      gm.namaGuru.toLowerCase().trim() ===
      currentUser.fullName.toLowerCase().trim()
  );

  const totalSiswa = siswa.length;

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-medium text-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sistem Aplikasi Guru Sekolah (SiApgus)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hi, {currentUser.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Selamat bertugas di {profile.namaSekolah}. Melalui portal SiApgus, Bapak/Ibu Guru dapat mengelola Jurnal Pembelajaran harian, input penilaian sumatif dan asesmen akhir semester (STS/SAS), serta mencatat absensi dan mencetak buku rapor siswa.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shrink-0 text-left md:text-right">
            <span className="text-[11px] text-emerald-200 uppercase font-semibold tracking-wider block">
              Waktu Masuk
            </span>
            <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-white">
              <Calendar className="w-4 h-4 text-emerald-200" />
              <span>{loginTime || new Date().toLocaleString('id-ID')}</span>
            </div>
            <div className="mt-1 text-xs text-emerald-100">
              {currentWaliAssignment ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                  <Award className="w-3.5 h-3.5" />
                  Wali Kelas {currentWaliAssignment.kodeKelas}{currentWaliAssignment.rombel}
                </span>
              ) : (
                <span>Guru Mata Pelajaran</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Special Wali Kelas Notice & Quick Action Banner */}
      <div className="p-4 sm:p-5 bg-linear-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-emerald-200 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">
                {currentWaliAssignment
                  ? `Layanan Aktif Wali Kelas ${currentWaliAssignment.kodeKelas} (${currentWaliAssignment.rombel})`
                  : 'Layanan Wali Kelas & Cetak Rapor'}
              </h3>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                {currentWaliAssignment ? 'Tugas Tambahan Terdaftar' : 'Akses Terbuka'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Kelola pencatatan kehadiran harian, cetak lembar rekapitulasi absensi bulanan, dan cetak laporan hasil belajar (buku rapor siswa PDF).
            </p>
          </div>
        </div>

        {/* Direct Action Buttons for Wali Kelas */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('guru-absensi')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Menu Absensi</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('guru-cetak-absen')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Absen</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('guru-cetak-rapor')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cetak Rapor</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-linear-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Total Siswa Terdaftar</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalSiswa}
            </div>
            <p className="text-xs text-blue-700/80 mt-1">Siswa Terdata di Sistem</p>
          </div>
        </div>

        {/* Total Kelas Sekolah */}
        <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 p-5 rounded-2xl border border-emerald-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Total Kelas Sekolah</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {kelasList.length}
            </div>
            <p className="text-xs text-emerald-700/80 mt-1">Kelas 7, 8, dan 9</p>
          </div>
        </div>

        {/* Kelas Diampu Guru Ini */}
        <div className="bg-linear-to-br from-purple-50 to-indigo-50/50 p-5 rounded-2xl border border-purple-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">Kelas Diampu Anda</span>
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {myAssignedClasses.length}
            </div>
            <p className="text-xs text-purple-700/80 mt-1">Rombongan Belajar</p>
          </div>
        </div>

        {/* Status Wali Kelas */}
        <div className="bg-linear-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Status Tugas Tambahan</span>
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 truncate">
              {currentWaliAssignment
                ? `Wali Kelas ${currentWaliAssignment.kodeKelas}${currentWaliAssignment.rombel}`
                : 'Wali Kelas / Guru Pengajar'}
            </div>
            <p className="text-xs text-amber-700/80 mt-1">
              Hak Akses Absensi & Cetak Rapor Aktif
            </p>
          </div>
        </div>
      </div>

      {/* Layanan Utama Wali Kelas (Absen, Cetak Absen, Cetak Rapor) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Layanan Khusus Wali Kelas: Absensi & Cetak Rapor
            </h2>
            <p className="text-xs text-slate-500">
              Pilihan menu utama untuk pengelolaan presensi dan pencetakan dokumen siswa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Menu Absensi Siswa */}
          <div
            onClick={() => onNavigate('guru-absensi')}
            className="p-4 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl cursor-pointer transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <span>Menu Absensi Siswa Harian</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Catat kehadiran harian siswa (Hadir, Sakit, Ijin, Alpha) dengan fitur indikator peringatan visual otomatis untuk kehadiran di bawah 75%.
            </p>
          </div>

          {/* Card: Cetak Absen Siswa */}
          <div
            onClick={() => onNavigate('guru-cetak-absen')}
            className="p-4 bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 rounded-xl cursor-pointer transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Printer className="w-4 h-4" />
                </div>
                <span>Cetak Rekap Absensi Siswa</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cetak lembar rekapitulasi presensi bulanan per kelas dalam format tabel resmi berstandar dokumen sekolah yang siap dicetak/PDF.
            </p>
          </div>

          {/* Card: Cetak Rapor Siswa */}
          <div
            onClick={() => onNavigate('guru-cetak-rapor')}
            className="p-4 bg-slate-50 hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 rounded-xl cursor-pointer transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Cetak Rapor Siswa (PDF)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cetak buku laporan hasil belajar peserta didik (kartu hasil belajar) format A4 resmi dengan data Kepala Sekolah dan lembar pengesahan.
            </p>
          </div>
        </div>
      </div>

      {/* Akses Cepat Menu Kerja Guru */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Akses Menu Pembelajaran Guru
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => onNavigate('guru-jurnal')}
            className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl cursor-pointer transition space-y-1.5"
          >
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs">
              <BookOpen className="w-4 h-4" />
              <span>Jurnal Pembelajaran</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Isi CP, TP, KBM, dan refleksi pembelajaran harian siswa.
            </p>
          </div>

          <div
            onClick={() => onNavigate('guru-penilaian')}
            className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl cursor-pointer transition space-y-1.5"
          >
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Data Penilaian Rapor</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Input Sumatif 1, 2, 3, STS, SAS, dan hitung nilai akhir otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

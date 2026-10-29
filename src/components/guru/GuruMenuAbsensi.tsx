import React, { useState, useMemo } from 'react';
import {
  AbsensiRecord,
  AbsensiStatus,
  AppDatabase,
  Siswa,
  UserAccount,
  WaliKelasAssignment
} from '../../types';
import {
  CheckSquare,
  Save,
  Check,
  Calendar,
  Users,
  Award,
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  Filter,
  UserCheck,
  X,
  ShieldAlert,
  Info,
  Clock,
  FileText
} from 'lucide-react';
import { findWaliAssignment } from '../../utils/waliKelas';

interface GuruMenuAbsensiProps {
  currentUser: UserAccount;
  db: AppDatabase;
  onSaveAbsensiBatch: (records: AbsensiRecord[]) => void;
}

export const GuruMenuAbsensi: React.FC<GuruMenuAbsensiProps> = ({
  currentUser,
  db,
  onSaveAbsensiBatch,
}) => {
  const { waliKelas, siswa, absensi } = db;

  // Find wali kelas assignment for current user with robust matching
  const assignedWali = findWaliAssignment(currentUser, waliKelas);

  const defaultKelas = assignedWali ? assignedWali.kodeKelas : '7';
  const defaultRombel = assignedWali ? assignedWali.rombel : 'A';

  const [selectedKelas, setSelectedKelas] = useState<'7' | '8' | '9'>(defaultKelas);
  const [selectedRombel, setSelectedRombel] = useState<'A' | 'B' | 'C' | 'D'>(defaultRombel);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));

  const [statusMessage, setStatusMessage] = useState('');
  const [filterUnder75Only, setFilterUnder75Only] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Siswa | null>(null);

  // Class students
  const classStudents = useMemo(() => {
    return siswa
      .filter((s) => s.kelas === selectedKelas && s.rombel === selectedRombel)
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [siswa, selectedKelas, selectedRombel]);

  // Local attendance state mapped by student ID for the active date
  const [localAttendance, setLocalAttendance] = useState<{
    [siswaId: string]: { status: AbsensiStatus; keterangan: string; saved: boolean };
  }>({});

  // Initialize or load existing records for that date & class
  React.useEffect(() => {
    const map: { [id: string]: { status: AbsensiStatus; keterangan: string; saved: boolean } } = {};
    classStudents.forEach((st) => {
      const existing = absensi.find(
        (a) =>
          a.siswaId === st.id &&
          a.tanggal === tanggal &&
          a.kelas === selectedKelas &&
          a.rombel === selectedRombel
      );
      if (existing) {
        map[st.id] = {
          status: existing.status,
          keterangan: existing.keterangan || '',
          saved: true,
        };
      } else {
        map[st.id] = {
          status: 'H', // Default to Hadir
          keterangan: '',
          saved: false,
        };
      }
    });
    setLocalAttendance(map);
  }, [classStudents, selectedKelas, selectedRombel, tanggal, absensi]);

  // Real-time automatic calculation of cumulative attendance statistics per student
  // Automatically factors in historical records PLUS real-time edits for the active date
  const attendanceStats = useMemo(() => {
    const statsMap: {
      [siswaId: string]: {
        totalRecorded: number;
        hadir: number;
        sakit: number;
        izin: number;
        alpha: number;
        rate: number; // percentage (0 - 100)
        isUnder75: boolean;
        history: AbsensiRecord[];
      };
    } = {};

    classStudents.forEach((st) => {
      // Historical records in db for this student
      const studentDbRecords = absensi.filter((a) => a.siswaId === st.id);

      // Exclude current date from DB records since we use the live localAttendance state for current date
      const otherDatesRecords = studentDbRecords.filter((a) => a.tanggal !== tanggal);

      // Current status for the active date from localAttendance
      const currentItem = localAttendance[st.id];
      const currentStatus = currentItem?.status;

      let hadir = otherDatesRecords.filter((r) => r.status === 'H').length;
      let sakit = otherDatesRecords.filter((r) => r.status === 'S').length;
      let izin = otherDatesRecords.filter((r) => r.status === 'I').length;
      let alpha = otherDatesRecords.filter((r) => r.status === 'A').length;

      // Combine with active date status
      if (currentStatus) {
        if (currentStatus === 'H') hadir += 1;
        else if (currentStatus === 'S') sakit += 1;
        else if (currentStatus === 'I') izin += 1;
        else if (currentStatus === 'A') alpha += 1;
      }

      const totalRecorded = hadir + sakit + izin + alpha;
      // Default to 100% if no sessions have been logged yet
      const rate = totalRecorded > 0 ? (hadir / totalRecorded) * 100 : 100;
      const isUnder75 = totalRecorded > 0 && rate < 75;

      // Build simulated history including today's selection
      const historyCombined: AbsensiRecord[] = [...otherDatesRecords];
      if (currentStatus) {
        historyCombined.push({
          id: `TEMP-${st.id}-${tanggal}`,
          tanggal,
          kelas: selectedKelas,
          rombel: selectedRombel,
          siswaId: st.id,
          namaSiswa: st.nama,
          status: currentStatus,
          keterangan: currentItem?.keterangan || (currentStatus === 'H' ? 'Hadir' : 'Hari Ini'),
          waliKelas: currentUser.fullName,
        });
      }

      statsMap[st.id] = {
        totalRecorded,
        hadir,
        sakit,
        izin,
        alpha,
        rate,
        isUnder75,
        history: historyCombined.sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
      };
    });

    return statsMap;
  }, [classStudents, absensi, tanggal, localAttendance, selectedKelas, selectedRombel, currentUser.fullName]);

  // Students flagged with < 75% attendance
  const studentsUnder75 = useMemo(() => {
    return classStudents.filter((st) => attendanceStats[st.id]?.isUnder75);
  }, [classStudents, attendanceStats]);

  // Overall class average attendance percentage
  const classAvgRate = useMemo(() => {
    if (classStudents.length === 0) return 100;
    const total = classStudents.reduce((acc, st) => {
      return acc + (attendanceStats[st.id]?.rate ?? 100);
    }, 0);
    return (total / classStudents.length).toFixed(1);
  }, [classStudents, attendanceStats]);

  // Counts for the active date
  const todayCounts = useMemo(() => {
    let h = 0;
    let s = 0;
    let i = 0;
    let a = 0;
    Object.values(localAttendance).forEach((item) => {
      if (item.status === 'H') h++;
      else if (item.status === 'S') s++;
      else if (item.status === 'I') i++;
      else if (item.status === 'A') a++;
    });
    return { h, s, i, a };
  }, [localAttendance]);

  // Filtered student list for table display
  const displayedStudents = useMemo(() => {
    if (filterUnder75Only) {
      return studentsUnder75;
    }
    return classStudents;
  }, [classStudents, filterUnder75Only, studentsUnder75]);

  const handleStatusChange = (siswaId: string, status: AbsensiStatus) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        status,
        saved: false,
      },
    }));
  };

  const handleKeteranganChange = (siswaId: string, ket: string) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        keterangan: ket,
        saved: false,
      },
    }));
  };

  // Save single student attendance
  const handleSaveStudent = (siswaId: string, namaSiswa: string) => {
    const record = localAttendance[siswaId];
    if (!record) return;

    const newRecord: AbsensiRecord = {
      id: `ABS-${siswaId}-${tanggal}`,
      tanggal,
      kelas: selectedKelas,
      rombel: selectedRombel,
      siswaId,
      namaSiswa,
      status: record.status,
      keterangan: record.keterangan,
      waliKelas: currentUser.fullName,
    };

    onSaveAbsensiBatch([newRecord]);
    setLocalAttendance((prev) => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], saved: true },
    }));

    setStatusMessage(`Absensi siswa ${namaSiswa} berhasil disimpan!`);
    setTimeout(() => setStatusMessage(''), 2500);
  };

  // Save all students attendance for the day
  const handleSaveAll = () => {
    const recordsToSave: AbsensiRecord[] = classStudents.map((st) => {
      const record = localAttendance[st.id] || { status: 'H', keterangan: '' };
      return {
        id: `ABS-${st.id}-${tanggal}`,
        tanggal,
        kelas: selectedKelas,
        rombel: selectedRombel,
        siswaId: st.id,
        namaSiswa: st.nama,
        status: record.status,
        keterangan: record.keterangan,
        waliKelas: currentUser.fullName,
      };
    });

    onSaveAbsensiBatch(recordsToSave);

    setLocalAttendance((prev) => {
      const updated: any = {};
      Object.keys(prev).forEach((k) => {
        updated[k] = { ...prev[k], saved: true };
      });
      return updated;
    });

    setStatusMessage('Seluruh absensi kelas berhasil disimpan ke database!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-md border border-amber-200 mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Hak Akses Wali Kelas</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Menu Absensi Siswa Harian
          </h1>
          <p className="text-xs text-slate-500">
            Catat dan simpan status kehadiran harian siswa dengan deteksi otomatis siswa yang memiliki tingkat kehadiran di bawah batas minimal 75%.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Absensi Seluruh Siswa</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Siswa</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {classStudents.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Kelas {selectedKelas} ({selectedRombel})
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Rerata Kehadiran</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {classAvgRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Akumulasi seluruh kelas
          </div>
        </div>

        {/* Highlighted Warning Card: Siswa < 75% */}
        <div
          onClick={() => {
            if (studentsUnder75.length > 0) {
              setFilterUnder75Only(!filterUnder75Only);
            }
          }}
          className={`p-4 rounded-2xl border transition shadow-2xs cursor-pointer ${
            studentsUnder75.length > 0
              ? 'bg-rose-50/80 border-rose-300 hover:bg-rose-100/70'
              : 'bg-white border-slate-200'
          }`}
          title={studentsUnder75.length > 0 ? 'Klik untuk filter hanya siswa di bawah 75%' : ''}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={studentsUnder75.length > 0 ? 'text-rose-900 font-bold' : 'text-slate-500'}>
              Kehadiran &lt; 75%
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                studentsUnder75.length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-300'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div
              className={`text-2xl font-black ${
                studentsUnder75.length > 0 ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              {studentsUnder75.length}
            </div>
            <span className="text-[11px] font-semibold text-rose-700">
              {studentsUnder75.length > 0 ? 'Siswa Berisiko' : 'Semua Aman'}
            </span>
          </div>
          <div className="text-[11px] text-rose-600/90 mt-0.5 flex items-center gap-1 font-medium">
            {studentsUnder75.length > 0 ? (
              <span>{filterUnder75Only ? 'Sedang difilter (Klik lepas)' : 'Klik untuk filter tabel'}</span>
            ) : (
              <span className="text-emerald-600">Memenuhi batas minimal</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Status Hari Ini</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-bold">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800" title="Hadir">
              H: {todayCounts.h}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800" title="Sakit">
              S: {todayCounts.s}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800" title="Ijin">
              I: {todayCounts.i}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800" title="Alpha">
              A: {todayCounts.a}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Tanggal: {tanggal}
          </div>
        </div>
      </div>

      {/* Prominent Visual Warning Alert Banner when students are under 75% */}
      {studentsUnder75.length > 0 && (
        <div className="p-4 bg-linear-to-r from-rose-50 via-rose-50/70 to-amber-50/50 border-l-4 border-l-rose-600 border border-rose-200 rounded-2xl shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-rose-900 tracking-tight">
                    Peringatan Wali Kelas: Siswa dengan Tingkat Kehadiran Rendah (&lt; 75%)
                  </h3>
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full shadow-2xs">
                    {studentsUnder75.length} Siswa Terdeteksi
                  </span>
                </div>

                {/* Filter toggle button */}
                <button
                  type="button"
                  onClick={() => setFilterUnder75Only(!filterUnder75Only)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    filterUnder75Only
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-100/60 shadow-2xs'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    {filterUnder75Only ? 'Tampilkan Seluruh Siswa' : 'Filter: Tampilkan Hanya Siswa < 75%'}
                  </span>
                </button>
              </div>

              <p className="text-xs text-rose-800/90 mt-1.5 leading-relaxed">
                Sesuai kriteria ketuntasan kehadiran minimal <strong>75%</strong>, siswa yang berada di bawah ambang batas ini secara otomatis ditandai dengan indikator peringatan visual merah. Mohon segera lakukan verifikasi, konseling wali kelas, atau panggilan orang tua/wali:
              </p>

              {/* Student Warning Badges list */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {studentsUnder75.map((st) => {
                  const stat = attendanceStats[st.id];
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStudentForDetail(st)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                      title="Klik untuk melihat riwayat ketidakhadiran siswa ini"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <span>{st.nama}</span>
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 font-black rounded text-[11px]">
                        {stat?.rate.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({stat?.hadir}/{stat?.totalRecorded} hari)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date & Class Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tanggal Input */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Kelas & Rombel Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value as any)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
            <select
              value={selectedRombel}
              onChange={(e) => setSelectedRombel(e.target.value as any)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="A">Rombel A</option>
              <option value="B">Rombel B</option>
              <option value="C">Rombel C</option>
              <option value="D">Rombel D</option>
            </select>
          </div>

          {/* Assigned Wali Badge */}
          <div className="px-3 py-2 bg-blue-50 text-blue-800 rounded-xl font-bold text-xs border border-blue-200">
            Wali Kelas: {assignedWali ? assignedWali.namaGuru : currentUser.fullName}
          </div>
        </div>

        {/* Legend */}
        <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> H: Hadir
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> S: Sakit
          </span>
          <span className="flex items-center gap-1 font-semibold text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> I: Ijin
          </span>
          <span className="flex items-center gap-1 font-semibold text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> A: Alpha
          </span>
          <span className="border-l border-slate-200 pl-3 flex items-center gap-1 text-rose-600 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>&lt; 75%: Kritis</span>
          </span>
        </div>
      </div>

      {/* Filter status notification when active */}
      {filterUnder75Only && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600" />
            <span>
              Menampilkan filter <strong>Hanya Siswa dengan Kehadiran &lt; 75%</strong> ({displayedStudents.length} siswa ditemukan).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilterUnder75Only(false)}
            className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer text-xs"
          >
            Hapus Filter
          </button>
        </div>
      )}

      {/* Table Absensi with Visual Warning Indicators */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-56">Nama Siswa</th>
                <th className="py-3 px-4 w-56">Tingkat Kehadiran (Min. 75%)</th>
                <th className="py-3 px-4 w-52 text-center">Status Hari Ini ({tanggal})</th>
                <th className="py-3 px-4">Keterangan Khusus</th>
                <th className="py-3 px-4 w-28 text-center">Simpan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">
                      {filterUnder75Only
                        ? 'Tidak ada siswa dengan tingkat kehadiran di bawah 75% pada kelas ini.'
                        : `Tidak ada data siswa untuk kelas ${selectedKelas}${selectedRombel}.`}
                    </p>
                    {filterUnder75Only && (
                      <button
                        type="button"
                        onClick={() => setFilterUnder75Only(false)}
                        className="mt-2 text-blue-600 hover:underline font-semibold text-xs cursor-pointer"
                      >
                        Kembali ke semua siswa
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayedStudents.map((st, idx) => {
                  const item = localAttendance[st.id] || { status: 'H', keterangan: '', saved: false };
                  const stat = attendanceStats[st.id] || {
                    totalRecorded: 0,
                    hadir: 0,
                    sakit: 0,
                    izin: 0,
                    alpha: 0,
                    rate: 100,
                    isUnder75: false,
                    history: [],
                  };

                  return (
                    <tr
                      key={st.id}
                      className={`transition-colors ${
                        stat.isUnder75
                          ? 'bg-rose-50/70 hover:bg-rose-100/50 border-l-4 border-l-rose-500'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center tabular-nums text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Nama Siswa & Warning Badge */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{st.nama}</span>
                          {stat.isUnder75 && (
                            <span
                              className="inline-flex items-center text-rose-600"
                              title="Peringatan: Kehadiran siswa di bawah ambang batas minimal 75%!"
                            >
                              <AlertTriangle className="w-4 h-4 fill-rose-100 text-rose-600 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          NIS/ID: {st.id}
                        </div>

                        {/* Visual Badge when < 75% */}
                        {stat.isUnder75 ? (
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>Kehadiran Rendah &lt; 75%</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForDetail(st)}
                              className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                            >
                              Rincian
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                            <CheckSquare className="w-3 h-3" />
                            <span>Kehadiran Memenuhi Syarat</span>
                          </div>
                        )}
                      </td>

                      {/* Column: Tingkat Kehadiran & Mini Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`font-black tabular-nums text-sm ${
                                stat.isUnder75
                                  ? 'text-rose-600 font-extrabold flex items-center gap-1'
                                  : stat.rate >= 85
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {stat.rate.toFixed(1)}%
                            </span>

                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                stat.isUnder75
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : stat.rate >= 85
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {stat.isUnder75
                                ? 'Kritis'
                                : stat.rate >= 85
                                ? 'Sangat Baik'
                                : 'Cukup'}
                            </span>
                          </div>

                          {/* Progress bar with 75% marker */}
                          <div className="relative w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300/60">
                            {/* Target 75% threshold guide line */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-500/80 z-10"
                              style={{ left: '75%' }}
                              title="Batas Minimal 75%"
                            />
                            {/* Actual fill */}
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                stat.isUnder75
                                  ? 'bg-rose-500'
                                  : stat.rate >= 85
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(stat.rate, 100)}%` }}
                            />
                          </div>

                          {/* Attendance stats breakdown counts */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span title="Hadir / Total Hari">
                              H: <strong className="text-slate-800">{stat.hadir}</strong> dari {stat.totalRecorded} hari
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (S:{stat.sakit} I:{stat.izin} A:{stat.alpha})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Buttons: Hadir, Sakit, Ijin, Alpha */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                          {(['H', 'S', 'I', 'A'] as AbsensiStatus[]).map((status) => {
                            const isSelected = item.status === status;
                            let activeClass = 'bg-white text-slate-900 shadow-xs font-bold';
                            if (status === 'H' && isSelected) activeClass = 'bg-emerald-600 text-white font-bold shadow-xs';
                            if (status === 'S' && isSelected) activeClass = 'bg-amber-500 text-white font-bold shadow-xs';
                            if (status === 'I' && isSelected) activeClass = 'bg-blue-600 text-white font-bold shadow-xs';
                            if (status === 'A' && isSelected) activeClass = 'bg-rose-600 text-white font-bold shadow-xs';

                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(st.id, status)}
                                className={`flex-1 py-1 px-2 rounded-md text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? activeClass
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Catatan surat dokter / alasan ijin..."
                          value={item.keterangan}
                          onChange={(e) => handleKeteranganChange(st.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Save per student button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaveStudent(st.id, st.nama)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                            item.saved
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          {item.saved ? 'Tersimpan' : 'Simpan'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal for Student Attendance History */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Riwayat Kehadiran Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudentForDetail.nama} ({selectedStudentForDetail.id}) - Kelas {selectedKelas}{selectedRombel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats in Modal */}
            {(() => {
              const stat = attendanceStats[selectedStudentForDetail.id];
              if (!stat) return null;
              return (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Tingkat Kehadiran</div>
                    <div className={`text-base font-black ${stat.isUnder75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {stat.rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Total Hadir</div>
                    <div className="text-base font-black text-slate-800">
                      {stat.hadir} / {stat.totalRecorded} hari
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Sakit / Izin / Alpha</div>
                    <div className="text-base font-black text-amber-700">
                      {stat.sakit}S · {stat.izin}I · {stat.alpha}A
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Attendance History Log List */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Catatan Log Absensi Tercatat:</span>
              </h4>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {attendanceStats[selectedStudentForDetail.id]?.history.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">Belum ada riwayat absensi.</div>
                ) : (
                  attendanceStats[selectedStudentForDetail.id]?.history.map((h, i) => {
                    let badge = 'bg-emerald-100 text-emerald-800';
                    let label = 'Hadir';
                    if (h.status === 'S') { badge = 'bg-amber-100 text-amber-800'; label = 'Sakit'; }
                    if (h.status === 'I') { badge = 'bg-blue-100 text-blue-800'; label = 'Izin'; }
                    if (h.status === 'A') { badge = 'bg-rose-100 text-rose-800 font-bold'; label = 'Alpha'; }

                    return (
                      <div key={h.id || i} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge}`}>
                            {label}
                          </span>
                          <span className="font-semibold text-slate-800">{h.tanggal}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 max-w-[200px] truncate text-right">
                          {h.keterangan || '-'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

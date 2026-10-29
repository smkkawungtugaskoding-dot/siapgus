import React, { useState, useMemo } from 'react';
import {
  Gender,
  Guru,
  GuruMapelAssignment,
  KelasItem,
  MataPelajaran
} from '../../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  Layers,
  GraduationCap
} from 'lucide-react';

interface AdminMenuGuruMapelProps {
  guruList: Guru[];
  mapelList: MataPelajaran[];
  kelasList: KelasItem[];
  guruMapelList: GuruMapelAssignment[];
  onAddMapel: (item: Omit<MataPelajaran, 'id'>) => void;
  onDeleteMapel: (id: string) => void;
  onAddKelas: (item: Omit<KelasItem, 'id'>) => void;
  onDeleteKelas: (id: string) => void;
  onAddGuruMapelAssignment: (item: Omit<GuruMapelAssignment, 'id'>) => void;
  onUpdateGuruMapelAssignment: (item: GuruMapelAssignment) => void;
  onDeleteGuruMapelAssignment: (id: string) => void;
}

export const AdminMenuGuruMapel: React.FC<AdminMenuGuruMapelProps> = ({
  guruList,
  mapelList,
  kelasList,
  guruMapelList,
  onAddMapel,
  onDeleteMapel,
  onAddKelas,
  onDeleteKelas,
  onAddGuruMapelAssignment,
  onUpdateGuruMapelAssignment,
  onDeleteGuruMapelAssignment,
}) => {
  // Section 1: Data Mata Pelajaran (Kode Mapel & Pelajaran)
  const [kodeMapel, setKodeMapel] = useState('');
  const [namaPelajaran, setNamaPelajaran] = useState('');

  // Section 2: Data Kelas (Kelas & Rombel)
  const [inputKelas, setInputKelas] = useState<'7' | '8' | '9'>('7');
  const [inputRombel, setInputRombel] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Section 3: Penugasan Guru Mapel
  const [selectedGuruName, setSelectedGuruName] = useState(
    guruList[0]?.nama || ''
  );
  const [selectedMapel, setSelectedMapel] = useState(
    mapelList[0]?.pelajaran || ''
  );
  const [selectedTargetKelas, setSelectedTargetKelas] = useState<'7' | '8' | '9'>('7');
  const [selectedTargetRombel, setSelectedTargetRombel] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [tugasTambahan, setTugasTambahan] = useState('Guru Mapel');

  // Editing state for table row
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Handle Add Mapel
  const handleAddMapelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodeMapel.trim() || !namaPelajaran.trim()) return;

    onAddMapel({
      kodeMapel: kodeMapel.trim().toUpperCase(),
      pelajaran: namaPelajaran.trim(),
    });
    setKodeMapel('');
    setNamaPelajaran('');
    setStatusMessage('Data Mata Pelajaran berhasil ditambahkan!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Handle Add Kelas
  const handleAddKelasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const exists = kelasList.some(
      (k) => k.kelas === inputKelas && k.rombel === inputRombel
    );
    if (exists) {
      alert(`Kelas ${inputKelas}${inputRombel} sudah terdaftar.`);
      return;
    }

    onAddKelas({
      kelas: inputKelas,
      rombel: inputRombel,
    });
    setStatusMessage(`Kelas ${inputKelas}${inputRombel} berhasil ditambahkan!`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Handle Assignment Add or Update
  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedGuru = guruList.find((g) => g.nama === selectedGuruName);
    const jk: Gender = matchedGuru ? matchedGuru.jenisKelamin : 'L';

    if (editingAssignmentId) {
      onUpdateGuruMapelAssignment({
        id: editingAssignmentId,
        namaGuru: selectedGuruName,
        jenisKelamin: jk,
        guruMataPelajaran: selectedMapel,
        tugasTambahan: tugasTambahan.trim() || 'Guru Mapel',
        kelas: selectedTargetKelas,
        rombel: selectedTargetRombel,
      });
      setEditingAssignmentId(null);
      setStatusMessage('Penugasan guru mapel berhasil diperbarui!');
    } else {
      onAddGuruMapelAssignment({
        namaGuru: selectedGuruName,
        jenisKelamin: jk,
        guruMataPelajaran: selectedMapel,
        tugasTambahan: tugasTambahan.trim() || 'Guru Mapel',
        kelas: selectedTargetKelas,
        rombel: selectedTargetRombel,
      });
      setStatusMessage('Guru Mata Pelajaran otomatis tersimpan dan ditambahkan ke list!');
    }
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const startEditAssignment = (item: GuruMapelAssignment) => {
    setEditingAssignmentId(item.id);
    setSelectedGuruName(item.namaGuru);
    setSelectedMapel(item.guruMataPelajaran);
    setTugasTambahan(item.tugasTambahan);
    setSelectedTargetKelas(item.kelas);
    setSelectedTargetRombel(item.rombel);
  };

  // Auto-sort list table alphabetically by namaGuru (A - Z)
  const sortedGuruMapel = useMemo(() => {
    return [...guruMapelList].sort((a, b) =>
      a.namaGuru.localeCompare(b.namaGuru, 'id')
    );
  }, [guruMapelList]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Menu Guru Mata Pelajaran
        </h1>
        <p className="text-xs text-slate-500">
          Kelola data Mata Pelajaran, data Kelas & Rombel, dan penugasan Guru Mata Pelajaran dengan urutan abjad otomatis.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid: 1. Input Mata Pelajaran & 2. Input Data Kelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: Data Mata Pelajaran (Kode Mapel & Pelajaran) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              1. Data Mata Pelajaran (Kode Mapel & Pelajaran)
            </h2>
          </div>

          <form onSubmit={handleAddMapelSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Mapel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MTK-01"
                  value={kodeMapel}
                  onChange={(e) => setKodeMapel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-mono font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pelajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika"
                  value={namaPelajaran}
                  onChange={(e) => setNamaPelajaran(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mapel</span>
              </button>
            </div>
          </form>

          {/* List Mapel Tags with Hapus button */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Daftar Mapel Terdaftar ({mapelList.length})
            </span>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {mapelList.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <span className="font-mono font-semibold text-blue-700 text-[11px]">
                    {m.kodeMapel}
                  </span>
                  <span className="text-slate-800 font-medium">{m.pelajaran}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteMapel(m.id)}
                    title="Hapus Mapel"
                    className="text-slate-400 hover:text-red-600 transition p-0.5 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form 2: Data Kelas (Kelas & Rombel) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              2. Data Kelas & Rombel (Tingkat & Rombongan Belajar)
            </h2>
          </div>

          <form onSubmit={handleAddKelasSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Kelas
                </label>
                <select
                  value={inputKelas}
                  onChange={(e) => setInputKelas(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="7">Kelas 7</option>
                  <option value="8">Kelas 8</option>
                  <option value="9">Kelas 9</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rombel
                </label>
                <select
                  value={inputRombel}
                  onChange={(e) => setInputRombel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="A">Rombel A</option>
                  <option value="B">Rombel B</option>
                  <option value="C">Rombel C</option>
                  <option value="D">Rombel D</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kelas</span>
              </button>
            </div>
          </form>

          {/* List Kelas Tags with Hapus button */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Daftar Kelas & Rombel Terdaftar ({kelasList.length})
            </span>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {kelasList.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <span className="font-bold text-emerald-800">
                    Kelas {k.kelas}{k.rombel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteKelas(k.id)}
                    title="Hapus Kelas"
                    className="text-slate-400 hover:text-red-600 transition p-0.5 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Penugasan Guru Mata Pelajaran */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-800">
              {editingAssignmentId
                ? 'Edit Penugasan Guru Mata Pelajaran'
                : 'Penugasan Guru Mata Pelajaran & Kelas yang Diampu'}
            </h2>
          </div>
          {editingAssignmentId && (
            <button
              type="button"
              onClick={() => setEditingAssignmentId(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleAssignmentSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pilih Guru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Nama Guru
            </label>
            <select
              value={selectedGuruName}
              onChange={(e) => setSelectedGuruName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
            >
              {guruList.map((g) => (
                <option key={g.id} value={g.nama}>
                  {g.nama} ({g.jenisKelamin === 'L' ? 'L' : 'P'})
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Mata Pelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mata Pelajaran yang Diampu
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
            >
              {mapelList.map((m) => (
                <option key={m.id} value={m.pelajaran}>
                  [{m.kodeMapel}] {m.pelajaran}
                </option>
              ))}
            </select>
          </div>

          {/* Target Kelas & Rombel */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas
              </label>
              <select
                value={selectedTargetKelas}
                onChange={(e) => setSelectedTargetKelas(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
              >
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rombel
              </label>
              <select
                value={selectedTargetRombel}
                onChange={(e) => setSelectedTargetRombel(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
              >
                <option value="A">Rombel A</option>
                <option value="B">Rombel B</option>
                <option value="C">Rombel C</option>
                <option value="D">Rombel D</option>
              </select>
            </div>
          </div>

          {/* Tugas Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tugas Tambahan
            </label>
            <input
              type="text"
              placeholder="Contoh: Wali Kelas 7A, Pembina OSIS"
              value={tugasTambahan}
              onChange={(e) => setTugasTambahan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>
                {editingAssignmentId
                  ? 'Simpan Perubahan Penugasan'
                  : 'Simpan Penugasan Guru Mapel'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* List Tabel Berurutan Sesuai Abjad Otomatis */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-2">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Guru Mata Pelajaran (Otomatis Tersimpan Sesuai Abjad)
            </h3>
            <p className="text-xs text-slate-500">
              Kolom: Nama Guru, Jenis Kelamin, Guru Mata Pelajaran, Tugas Tambahan, dan Aksi
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums font-medium">
            {sortedGuruMapel.length} penugasan terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Guru (A - Z)</th>
                <th className="py-3 px-4 w-32">Jenis Kelamin</th>
                <th className="py-3 px-4">Guru Mata Pelajaran</th>
                <th className="py-3 px-4 w-28">Kelas Diampu</th>
                <th className="py-3 px-4">Tugas Tambahan</th>
                <th className="py-3 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedGuruMapel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Belum ada penugasan guru mata pelajaran.</p>
                  </td>
                </tr>
              ) : (
                sortedGuruMapel.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 text-center tabular-nums text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.namaGuru}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.jenisKelamin === 'L'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.jenisKelamin === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {item.guruMataPelajaran}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      Kelas {item.kelas}{item.rombel}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.tugasTambahan || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditAssignment(item)}
                          title="Edit Penugasan"
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteGuruMapelAssignment(item.id)}
                          title="Hapus Penugasan"
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

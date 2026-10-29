import React, { useState, useMemo } from 'react';
import { Guru, WaliKelasAssignment, KelasItem } from '../../types';
import { Award, Plus, Trash2, Edit2, Check, Users, Sparkles } from 'lucide-react';

interface AdminMenuWaliKelasProps {
  guruList: Guru[];
  kelasList: KelasItem[];
  waliKelasList: WaliKelasAssignment[];
  onAddWaliKelas: (item: Omit<WaliKelasAssignment, 'id'>) => void;
  onUpdateWaliKelas: (item: WaliKelasAssignment) => void;
  onDeleteWaliKelas: (id: string) => void;
}

export const AdminMenuWaliKelas: React.FC<AdminMenuWaliKelasProps> = ({
  guruList,
  kelasList,
  waliKelasList,
  onAddWaliKelas,
  onUpdateWaliKelas,
  onDeleteWaliKelas,
}) => {
  // Input Kelas & Rombel
  const [selectedKelas, setSelectedKelas] = useState<'7' | '8' | '9'>('7');
  const [selectedRombel, setSelectedRombel] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Input Nama Guru
  const [selectedGuruNama, setSelectedGuruNama] = useState(guruList[0]?.nama || '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuruNama) return;

    const matchedGuru = guruList.find((g) => g.nama === selectedGuruNama);
    const jk = matchedGuru ? matchedGuru.jenisKelamin : 'L';
    const mapel = matchedGuru ? matchedGuru.mapel : 'Umum';
    const tugasTambahan = `Wali Kelas ${selectedKelas}${selectedRombel}`;

    if (editingId) {
      onUpdateWaliKelas({
        id: editingId,
        kodeKelas: selectedKelas,
        rombel: selectedRombel,
        namaGuru: selectedGuruNama,
        jenisKelamin: jk,
        guruMataPelajaran: mapel,
        tugasTambahan,
      });
      setEditingId(null);
      setStatusMessage('Data Wali Kelas berhasil diperbarui!');
    } else {
      // Check if this class already has a wali kelas
      const exists = waliKelasList.some(
        (wk) => wk.kodeKelas === selectedKelas && wk.rombel === selectedRombel
      );
      if (exists) {
        if (!confirm(`Kelas ${selectedKelas}${selectedRombel} sudah memiliki Wali Kelas. Tetap tambahkan/ganti?`)) {
          return;
        }
      }

      onAddWaliKelas({
        kodeKelas: selectedKelas,
        rombel: selectedRombel,
        namaGuru: selectedGuruNama,
        jenisKelamin: jk,
        guruMataPelajaran: mapel,
        tugasTambahan,
      });
      setStatusMessage('Wali Kelas langsung otomatis tersimpan dan muncul di tabel!');
    }
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleStartEdit = (item: WaliKelasAssignment) => {
    setEditingId(item.id);
    setSelectedKelas(item.kodeKelas);
    setSelectedRombel(item.rombel);
    setSelectedGuruNama(item.namaGuru);
  };

  // Sort automatically by Alphabet (A - Z) by namaGuru
  const sortedWaliKelas = useMemo(() => {
    return [...waliKelasList].sort((a, b) =>
      a.namaGuru.localeCompare(b.namaGuru, 'id')
    );
  }, [waliKelasList]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Menu Penugasan Wali Kelas
        </h1>
        <p className="text-xs text-slate-500">
          Mengisikan data Kelas dan Rombel serta Nama Guru pendidik. Wali kelas otomatis tersimpan dan muncul di list tabel secara berurutan sesuai abjad.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Form Input Wali Kelas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800">
              {editingId ? 'Edit Data Wali Kelas' : 'Penetapan Wali Kelas Baru'}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Kode Kelas & Rombel */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Kelas
              </label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
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
                value={selectedRombel}
                onChange={(e) => setSelectedRombel(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
              >
                <option value="A">Rombel A</option>
                <option value="B">Rombel B</option>
                <option value="C">Rombel C</option>
                <option value="D">Rombel D</option>
              </select>
            </div>
          </div>

          {/* Nama Guru */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Nama Guru Pendidik
            </label>
            <div className="flex gap-2">
              <select
                value={selectedGuruNama}
                onChange={(e) => setSelectedGuruNama(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
              >
                {guruList.map((g) => (
                  <option key={g.id} value={g.nama}>
                    {g.nama} — Pengampu: {g.mapel} ({g.jenisKelamin === 'L' ? 'L' : 'P'})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Simpan' : 'Tetapkan Wali Kelas'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* List Tabel Berurutan Sesuai Abjad Otomatis */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-2">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Wali Kelas Terdaftar (Berurutan Abjad Otomatis)
            </h3>
            <p className="text-xs text-slate-500">
              Kolom: Nama Guru, Jenis Kelamin, Guru Mata Pelajaran, Tugas Tambahan, dan Aksi
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums font-medium">
            {sortedWaliKelas.length} wali kelas terdaftar
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
                <th className="py-3 px-4">Tugas Tambahan</th>
                <th className="py-3 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedWaliKelas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Belum ada wali kelas yang ditetapkan.</p>
                  </td>
                </tr>
              ) : (
                sortedWaliKelas.map((item, idx) => (
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
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {item.guruMataPelajaran}
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-800">
                      {item.tugasTambahan || `Wali Kelas ${item.kodeKelas}${item.rombel}`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          title="Edit Wali Kelas"
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteWaliKelas(item.id)}
                          title="Hapus Wali Kelas"
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

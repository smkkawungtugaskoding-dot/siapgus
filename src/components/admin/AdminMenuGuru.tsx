import React, { useState, useMemo } from 'react';
import { Guru, Gender } from '../../types';
import { exportToXLSX, parseXLSXFile } from '../../storage/db';
import {
  GraduationCap,
  UserPlus,
  Trash2,
  XCircle,
  Download,
  Upload,
  Search,
  Edit2,
  Check,
  AlertTriangle
} from 'lucide-react';

interface AdminMenuGuruProps {
  guruList: Guru[];
  mapelOptions: string[];
  onAddGuru: (guru: Omit<Guru, 'id'>) => void;
  onUpdateGuru: (guru: Guru) => void;
  onDeleteGuru: (id: string) => void;
  onClearAllGuru: () => void;
  onImportBatch: (newGuru: Guru[]) => void;
}

export const AdminMenuGuru: React.FC<AdminMenuGuruProps> = ({
  guruList,
  mapelOptions,
  onAddGuru,
  onUpdateGuru,
  onDeleteGuru,
  onClearAllGuru,
  onImportBatch,
}) => {
  // Form State
  const [nama, setNama] = useState('');
  const [nikNuptk, setNikNuptk] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<Gender>('L');
  const [mapel, setMapel] = useState(mapelOptions[0] || 'Matematika');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const resetForm = () => {
    setNama('');
    setNikNuptk('');
    setJenisKelamin('L');
    setMapel(mapelOptions[0] || 'Matematika');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    if (nikNuptk.trim() && !/^\d+$/.test(nikNuptk.trim())) {
      setStatusMessage('Perhatian: NIK/NUPTK harus berupa karakter angka numerik.');
      setTimeout(() => setStatusMessage(''), 4000);
      return;
    }

    if (editingId) {
      onUpdateGuru({
        id: editingId,
        nama: nama.trim(),
        jenisKelamin,
        mapel,
        nikNuptk: nikNuptk.trim(),
      });
      setStatusMessage('Data guru berhasil diperbarui!');
    } else {
      onAddGuru({
        nama: nama.trim(),
        jenisKelamin,
        mapel,
        nikNuptk: nikNuptk.trim(),
      });
      setStatusMessage('Data guru baru berhasil ditambahkan!');
    }

    resetForm();
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleStartEdit = (item: Guru) => {
    setEditingId(item.id);
    setNama(item.nama);
    setNikNuptk(item.nikNuptk || '');
    setJenisKelamin(item.jenisKelamin);
    setMapel(item.mapel);
  };

  // Sort automatically by Alphabet (A-Z) and search by Name or NIK/NUPTK or Mapel
  const sortedAndFilteredGuru = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...guruList]
      .filter((item) => {
        return (
          item.nama.toLowerCase().includes(q) ||
          (item.nikNuptk && item.nikNuptk.toLowerCase().includes(q)) ||
          item.mapel.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [guruList, searchQuery]);

  // Export to XLSX
  const handleExport = () => {
    const dataToExport = sortedAndFilteredGuru.map((g, index) => ({
      No: index + 1,
      'Nama Guru': g.nama,
      'NIK/NUPTK': g.nikNuptk || '-',
      'Jenis Kelamin': g.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      'Guru Mata Pelajaran': g.mapel,
    }));
    exportToXLSX(dataToExport, `Data_Guru_SiApgus_${new Date().toISOString().slice(0, 10)}`, 'Data Guru');
  };

  // Import from XLSX
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawData = await parseXLSXFile(file);
      const parsedGuru: Guru[] = rawData.map((row: any, i: number) => {
        const namaParsed = row['Nama Guru'] || row.nama || row.Nama || `Guru Baru ${i + 1}`;
        const nikParsed = (row['NIK/NUPTK'] || row['NIK'] || row['NUPTK'] || row.nikNuptk || row.nik || row.nuptk || '').toString().trim();
        const jkRaw = (row['Jenis Kelamin'] || row.jenisKelamin || row.JK || 'L').toString().toUpperCase();
        const jk: Gender = jkRaw.startsWith('P') ? 'P' : 'L';
        const mapelParsed = row['Guru Mata Pelajaran'] || row.mapel || row.Mapel || 'Matematika';

        return {
          id: `GUR-IMP-${Date.now()}-${i}`,
          nama: namaParsed,
          jenisKelamin: jk,
          mapel: mapelParsed,
          nikNuptk: nikParsed,
        };
      });

      if (parsedGuru.length > 0) {
        onImportBatch(parsedGuru);
        setStatusMessage(`Berhasil mengimpor ${parsedGuru.length} data dewan guru!`);
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) {
      alert('Gagal membaca file spreadsheet. Pastikan format file .xlsx');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Menu Data Guru
          </h1>
          <p className="text-xs text-slate-500">
            Kelola data pendidik, bidang studi mata pelajaran terdaftar berurutan abjad otomatis.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 cursor-pointer transition">
            <Upload className="w-4 h-4" />
            <span>Import Spreadsheet (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Spreadsheet (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 transition"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Hapus Semua Data</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Input Form Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              {editingId ? 'Edit Data Guru' : 'Tambah Guru Baru'}
            </h2>
          </div>
          {editingId && (
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              Mode Edit
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nama Guru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Guru Lengkap & Gelar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso, S.Pd."
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* NIK / NUPTK */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                NIK / NUPTK <span className="text-slate-400 font-normal">(16 Digit)</span>
              </label>
              {nikNuptk && !/^\d+$/.test(nikNuptk) && (
                <span className="text-[10px] text-amber-600 font-medium">Hanya angka</span>
              )}
            </div>
            <input
              type="text"
              maxLength={20}
              placeholder="Contoh: 198504122010011005"
              value={nikNuptk}
              onChange={(e) => setNikNuptk(e.target.value.replace(/\s+/g, ''))}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:bg-white ${
                nikNuptk && !/^\d+$/.test(nikNuptk)
                  ? 'border-amber-400 focus:ring-amber-500'
                  : 'border-slate-300 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Kelamin
            </label>
            <select
              value={jenisKelamin}
              onChange={(e) => setJenisKelamin(e.target.value as Gender)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {/* Guru Mata Pelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guru Mata Pelajaran
            </label>
            <input
              type="text"
              required
              list="mapel-options"
              placeholder="Contoh: Matematika"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            <datalist id="mapel-options">
              {mapelOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>

          {/* Form Action Buttons */}
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4 text-slate-500" />
              <span>Batal / Cancel</span>
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'Simpan Perubahan' : 'Tambah Guru'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama guru atau NIK/NUPTK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <span className="text-xs text-slate-500 tabular-nums">
          {sortedAndFilteredGuru.length} guru terdaftar
        </span>
      </div>

      {/* List Tabel Berurutan Sesuai Abjad Otomatis */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Guru (A - Z)</th>
                <th className="py-3 px-4 w-44">NIK / NUPTK</th>
                <th className="py-3 px-4 w-36">Jenis Kelamin</th>
                <th className="py-3 px-4">Guru Mata Pelajaran</th>
                <th className="py-3 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAndFilteredGuru.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Tidak ada data guru yang ditemukan.</p>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredGuru.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 text-center tabular-nums text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.nama}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {item.nikNuptk ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          {item.nikNuptk}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
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
                      {item.mapel}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          title="Edit Guru"
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteGuru(item.id)}
                          title="Hapus Guru"
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

      {/* Modal Konfirmasi Hapus Semua Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Semua Data Guru?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tindakan ini akan mengosongkan seluruh data guru pendidik di sistem SiApgus.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllGuru();
                  setShowClearConfirm(false);
                  setStatusMessage('Semua data guru berhasil dihapus.');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

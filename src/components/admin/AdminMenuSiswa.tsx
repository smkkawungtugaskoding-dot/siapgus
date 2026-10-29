import React, { useState, useMemo } from 'react';
import { Siswa, Gender } from '../../types';
import { exportToXLSX, parseXLSXFile } from '../../storage/db';
import {
  UserPlus,
  Trash2,
  XCircle,
  Download,
  Upload,
  Search,
  Edit2,
  Users,
  Check,
  AlertTriangle
} from 'lucide-react';

interface AdminMenuSiswaProps {
  siswaList: Siswa[];
  onAddSiswa: (siswa: Omit<Siswa, 'id'>) => void;
  onUpdateSiswa: (siswa: Siswa) => void;
  onDeleteSiswa: (id: string) => void;
  onClearAllSiswa: () => void;
  onImportBatch: (newSiswa: Siswa[]) => void;
}

export const AdminMenuSiswa: React.FC<AdminMenuSiswaProps> = ({
  siswaList,
  onAddSiswa,
  onUpdateSiswa,
  onDeleteSiswa,
  onClearAllSiswa,
  onImportBatch,
}) => {
  // Form State
  const [nama, setNama] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<Gender>('L');
  const [kelas, setKelas] = useState<'7' | '8' | '9'>('7');
  const [rombel, setRombel] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('ALL');
  const [filterRombel, setFilterRombel] = useState<string>('ALL');

  // Confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const resetForm = () => {
    setNama('');
    setJenisKelamin('L');
    setKelas('7');
    setRombel('A');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    if (editingId) {
      onUpdateSiswa({
        id: editingId,
        nama: nama.trim(),
        jenisKelamin,
        kelas,
        rombel,
      });
      setStatusMessage('Data siswa berhasil diperbarui!');
    } else {
      onAddSiswa({
        nama: nama.trim(),
        jenisKelamin,
        kelas,
        rombel,
      });
      setStatusMessage('Data siswa baru berhasil ditambahkan!');
    }

    resetForm();
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleStartEdit = (item: Siswa) => {
    setEditingId(item.id);
    setNama(item.nama);
    setJenisKelamin(item.jenisKelamin);
    setKelas(item.kelas);
    setRombel(item.rombel);
  };

  // Sort automatically by Alphabet (A-Z)
  const sortedAndFilteredSiswa = useMemo(() => {
    return [...siswaList]
      .filter((item) => {
        const matchesName = item.nama
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
        const matchesKelas =
          filterKelas === 'ALL' || item.kelas === filterKelas;
        const matchesRombel =
          filterRombel === 'ALL' || item.rombel === filterRombel;
        return matchesName && matchesKelas && matchesRombel;
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [siswaList, searchQuery, filterKelas, filterRombel]);

  // Export to XLSX
  const handleExport = () => {
    const dataToExport = sortedAndFilteredSiswa.map((s, index) => ({
      No: index + 1,
      'Nama Siswa': s.nama,
      'Jenis Kelamin': s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      Kelas: s.kelas,
      Rombel: s.rombel,
      'Kelas Lengkap': `${s.kelas}${s.rombel}`,
    }));
    exportToXLSX(dataToExport, `Data_Siswa_SiApgus_${new Date().toISOString().slice(0, 10)}`, 'Data Siswa');
  };

  // Import from XLSX
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawData = await parseXLSXFile(file);
      const parsedSiswa: Siswa[] = rawData.map((row: any, i: number) => {
        const namaParsed = row['Nama Siswa'] || row.nama || row.Nama || `Siswa Baru ${i + 1}`;
        const jkRaw = (row['Jenis Kelamin'] || row.jenisKelamin || row.JK || 'L').toString().toUpperCase();
        const jk: Gender = jkRaw.startsWith('P') ? 'P' : 'L';
        const klsRaw = (row.Kelas || row.kelas || '7').toString();
        const kls: '7' | '8' | '9' = ['7', '8', '9'].includes(klsRaw) ? (klsRaw as any) : '7';
        const rmbRaw = (row.Rombel || row.rombel || 'A').toString().toUpperCase();
        const rmb: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(rmbRaw) ? (rmbRaw as any) : 'A';

        return {
          id: `SIS-IMP-${Date.now()}-${i}`,
          nama: namaParsed,
          jenisKelamin: jk,
          kelas: kls,
          rombel: rmb,
        };
      });

      if (parsedSiswa.length > 0) {
        onImportBatch(parsedSiswa);
        setStatusMessage(`Berhasil mengimpor ${parsedSiswa.length} data siswa dari spreadsheet!`);
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) {
      alert('Gagal membaca file spreadsheet. Pastikan format file .xlsx atau .csv');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Menu Data Siswa
          </h1>
          <p className="text-xs text-slate-500">
            Kelola data siswa, rombongan belajar (A, B, C, D) kelas 7, 8, dan 9 secara otomatis berurutan abjad.
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
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              {editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h2>
          </div>
          {editingId && (
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              Mode Edit
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nama Siswa */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Siswa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Ahmad Rizky Pratama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {/* Kelas & Rombel */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Kelas
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold"
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
                value={rombel}
                onChange={(e) => setRombel(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold"
              >
                <option value="A">Rombel A</option>
                <option value="B">Rombel B</option>
                <option value="C">Rombel C</option>
                <option value="D">Rombel D</option>
              </select>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="lg:col-span-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingId ? 'Simpan Perubahan' : 'Tambah Siswa'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Filter:</span>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="ALL">Semua Kelas</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
            <select
              value={filterRombel}
              onChange={(e) => setFilterRombel(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
            >
              <option value="ALL">Semua Rombel</option>
              <option value="A">Rombel A</option>
              <option value="B">Rombel B</option>
              <option value="C">Rombel C</option>
              <option value="D">Rombel D</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {sortedAndFilteredSiswa.length} data ditemukan
          </span>
        </div>
      </div>

      {/* List Tabel Berurutan Sesuai Abjad Otomatis */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa (A - Z)</th>
                <th className="py-3 px-4 w-32">Jenis Kelamin</th>
                <th className="py-3 px-4 w-28">Kelas</th>
                <th className="py-3 px-4 w-28">Rombel</th>
                <th className="py-3 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAndFilteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Tidak ada data siswa yang cocok.</p>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredSiswa.map((item, idx) => (
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
                      Kelas {item.kelas}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      Rombel {item.rombel}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          title="Edit Siswa"
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSiswa(item.id)}
                          title="Hapus Siswa"
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
                Hapus Semua Data Siswa?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tindakan ini akan mengosongkan seluruh data siswa yang tersimpan di sistem. Data yang sudah dihapus tidak dapat dikembalikan lagi.
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
                  onClearAllSiswa();
                  setShowClearConfirm(false);
                  setStatusMessage('Semua data siswa berhasil dihapus.');
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

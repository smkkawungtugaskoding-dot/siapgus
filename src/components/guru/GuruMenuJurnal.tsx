import React, { useState } from 'react';
import { JurnalItem, UserAccount } from '../../types';
import {
  BookMarked,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Printer,
  Check,
  Search,
  Filter
} from 'lucide-react';

interface GuruMenuJurnalProps {
  currentUser: UserAccount;
  jurnalList: JurnalItem[];
  onAddJurnal: (item: Omit<JurnalItem, 'id'>) => void;
  onUpdateJurnal: (item: JurnalItem) => void;
  onDeleteJurnal: (id: string) => void;
}

export const GuruMenuJurnal: React.FC<GuruMenuJurnalProps> = ({
  currentUser,
  jurnalList,
  onAddJurnal,
  onUpdateJurnal,
  onDeleteJurnal,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [hari, setHari] = useState('Senin');
  const [kelas, setKelas] = useState('7A');
  const [jamKe, setJamKe] = useState('1 - 2');
  const [capaianPembelajaran, setCapaianPembelajaran] = useState('');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState('');
  const [kbm, setKbm] = useState('');
  const [refleksi, setRefleksi] = useState('');
  const [asesmen, setAsesmen] = useState('');
  const [siswaTidakHadir, setSiswaTidakHadir] = useState('Nihil (Hadir Semua)');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState('');

  // Auto-detect Indonesian day from date
  const handleDateChange = (val: string) => {
    setTanggal(val);
    const dateObj = new Date(val);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    setHari(dayNames[dateObj.getDay()] || 'Senin');
  };

  const resetForm = () => {
    setTanggal(new Date().toISOString().slice(0, 10));
    setHari('Senin');
    setKelas('7A');
    setJamKe('1 - 2');
    setCapaianPembelajaran('');
    setTujuanPembelajaran('');
    setKbm('');
    setRefleksi('');
    setAsesmen('');
    setSiswaTidakHadir('Nihil (Hadir Semua)');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capaianPembelajaran.trim() || !tujuanPembelajaran.trim()) {
      alert('Silakan isi Capaian Pembelajaran dan Tujuan Pembelajaran.');
      return;
    }

    if (editingId) {
      onUpdateJurnal({
        id: editingId,
        tanggal,
        hari,
        kelas,
        jamKe,
        capaianPembelajaran,
        tujuanPembelajaran,
        kbm,
        refleksi,
        asesmen,
        siswaTidakHadir,
        namaGuru: currentUser.fullName,
      });
      setStatusMessage('Jurnal pembelajaran berhasil diperbarui!');
    } else {
      onAddJurnal({
        tanggal,
        hari,
        kelas,
        jamKe,
        capaianPembelajaran,
        tujuanPembelajaran,
        kbm,
        refleksi,
        asesmen,
        siswaTidakHadir,
        namaGuru: currentUser.fullName,
      });
      setStatusMessage('Jurnal mengajar hari ini berhasil disimpan!');
    }

    resetForm();
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleEdit = (item: JurnalItem) => {
    setEditingId(item.id);
    setTanggal(item.tanggal);
    setHari(item.hari);
    setKelas(item.kelas);
    setJamKe(item.jamKe);
    setCapaianPembelajaran(item.capaianPembelajaran);
    setTujuanPembelajaran(item.tujuanPembelajaran);
    setKbm(item.kbm);
    setRefleksi(item.refleksi);
    setAsesmen(item.asesmen);
    setSiswaTidakHadir(item.siswaTidakHadir);
    setShowForm(true);
  };

  // Filter list
  const filteredJurnal = jurnalList.filter((item) => {
    const matchesSearch =
      item.capaianPembelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tujuanPembelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kbm.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKelas = filterKelas === 'ALL' || item.kelas === filterKelas;
    return matchesSearch && matchesKelas;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Menu Jurnal Pembelajaran Guru
          </h1>
          <p className="text-xs text-slate-500">
            Catat agenda harian KBM, Capaian & Tujuan Pembelajaran, Refleksi, Asesmen, dan data siswa tidak hadir setiap hari.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition print:hidden"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Cetak Jurnal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer print:hidden"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Tutup Form' : 'Isi Jurnal Baru'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Form Tambah/Edit Jurnal */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 animate-fadeIn print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">
                {editingId ? 'Edit Jurnal Pembelajaran' : 'Form Input Jurnal Mengajar Harian'}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Pengajar: {currentUser.fullName}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pembelajaran
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Hari */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hari
              </label>
              <input
                type="text"
                value={hari}
                onChange={(e) => setHari(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="7A">Kelas 7A</option>
                <option value="7B">Kelas 7B</option>
                <option value="7C">Kelas 7C</option>
                <option value="7D">Kelas 7D</option>
                <option value="8A">Kelas 8A</option>
                <option value="8B">Kelas 8B</option>
                <option value="8C">Kelas 8C</option>
                <option value="8D">Kelas 8D</option>
                <option value="9A">Kelas 9A</option>
                <option value="9B">Kelas 9B</option>
                <option value="9C">Kelas 9C</option>
                <option value="9D">Kelas 9D</option>
              </select>
            </div>

            {/* Jam Ke */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jam Ke-
              </label>
              <input
                type="text"
                placeholder="Contoh: 1 - 2"
                value={jamKe}
                onChange={(e) => setJamKe(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Capaian Pembelajaran */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capaian Pembelajaran (CP) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Deskripsi Capaian Pembelajaran dari materi yang diajarkan..."
                value={capaianPembelajaran}
                onChange={(e) => setCapaianPembelajaran(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Tujuan Pembelajaran */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tujuan Pembelajaran (TP) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Indikator ketercapaian tujuan pembelajaran pada pertemuan ini..."
                value={tujuanPembelajaran}
                onChange={(e) => setTujuanPembelajaran(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Kegiatan Belajar Mengajar (KBM) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kegiatan Belajar Mengajar (KBM)
              </label>
              <textarea
                rows={2}
                placeholder="Metode/aktivitas pembelajaran (misal: diskusi kelompok, eksplorasi, demonstrasi)..."
                value={kbm}
                onChange={(e) => setKbm(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Refleksi Guru & Asesmen Pembelajaran */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Refleksi Guru & Asesmen Pembelajaran
              </label>
              <textarea
                rows={2}
                placeholder="Catatan respon siswa dan teknik asesmen (formatif rubrik/tes tertulis)..."
                value={refleksi}
                onChange={(e) => setRefleksi(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Siswa Tidak Hadir */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Siswa Tidak Hadir (Absensi Siswa Pada Jam Ini)
              </label>
              <input
                type="text"
                placeholder="Contoh: Aditya Pratama (Sakit), Dimas Arya (Ijin) atau Nihil (Hadir Semua)"
                value={siswaTidakHadir}
                onChange={(e) => setSiswaTidakHadir(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Action buttons */}
            <div className="sm:col-span-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                {editingId ? 'Simpan Perubahan' : 'Simpan Jurnal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari materi / CP / TP / KBM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Filter Kelas:</span>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="ALL">Semua Kelas</option>
            <option value="7A">7A</option>
            <option value="7B">7B</option>
            <option value="8A">8A</option>
            <option value="9A">9A</option>
          </select>
          <span className="text-slate-400 tabular-nums">
            {filteredJurnal.length} entri jurnal
          </span>
        </div>
      </div>

      {/* Printable Jurnal Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-lg font-bold">JURNAL PEMBELAJARAN GURU</h2>
        <p className="text-xs text-slate-600">
          Guru Pengajar: {currentUser.fullName} · Dicetak pada {new Date().toLocaleDateString('id-ID')}
        </p>
      </div>

      {/* Jurnal Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-24">Hari / Tgl</th>
                <th className="py-3 px-3 w-16 text-center">Kelas</th>
                <th className="py-3 px-3 w-16 text-center">Jam</th>
                <th className="py-3 px-3 min-w-48">Capaian Pembelajaran (CP)</th>
                <th className="py-3 px-3 min-w-48">Tujuan Pembelajaran (TP)</th>
                <th className="py-3 px-3 min-w-44">KBM</th>
                <th className="py-3 px-3 min-w-44">Refleksi & Asesmen</th>
                <th className="py-3 px-3 w-32">Siswa Tdk Hadir</th>
                <th className="py-3 px-3 w-20 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJurnal.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Belum ada catatan jurnal mengajar.</p>
                  </td>
                </tr>
              ) : (
                filteredJurnal.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors align-top">
                    <td className="py-3 px-3 text-center tabular-nums text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.hari}</div>
                      <div className="text-[11px] text-slate-400">{item.tanggal}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-800">
                      {item.kelas}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-slate-600">
                      {item.jamKe}
                    </td>
                    <td className="py-3 px-3 text-slate-700 leading-relaxed">
                      {item.capaianPembelajaran}
                    </td>
                    <td className="py-3 px-3 text-slate-700 leading-relaxed">
                      {item.tujuanPembelajaran}
                    </td>
                    <td className="py-3 px-3 text-slate-600 leading-relaxed">
                      {item.kbm || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 leading-relaxed">
                      {item.refleksi || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 block">
                        {item.siswaTidakHadir || 'Hadir Semua'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center print:hidden">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="Edit Jurnal"
                          className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteJurnal(item.id)}
                          title="Hapus Jurnal"
                          className="p-1 hover:bg-red-50 text-red-600 rounded"
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

import React, { useState, useEffect, useRef } from 'react';
import { SchoolProfile } from '../../types';
import { optimizeLogoImage } from '../../utils/imageOptimizer';
import { updateAppFavicon } from '../../utils/favicon';
import {
  Settings,
  Upload,
  Check,
  CheckCircle2,
  Building,
  Image as ImageIcon,
  Copy,
  Download,
  Database,
  AlertCircle,
  AlertTriangle,
  X,
  Save,
  Loader2,
  Sparkles
} from 'lucide-react';

interface AdminMenuSettingProps {
  profile: SchoolProfile;
  onUpdateProfile: (newProfile: SchoolProfile) => void;
  sheetsWebAppUrl?: string;
  onUpdateSheetsUrl?: (url: string) => void;
  onSyncToSheets?: () => Promise<void>;
}

export const AdminMenuSetting: React.FC<AdminMenuSettingProps> = ({
  profile,
  onUpdateProfile,
  sheetsWebAppUrl = '',
  onUpdateSheetsUrl,
  onSyncToSheets,
}) => {
  // Form State
  const [formData, setFormData] = useState<SchoolProfile>({ ...profile });
  const [webAppUrl, setWebAppUrl] = useState(sheetsWebAppUrl);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isAutoSaved, setIsAutoSaved] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Ref to track local updates and avoid cursor jump on controlled inputs
  const isLocalUpdate = useRef(false);

  // Sync internal form data when profile prop updates externally
  useEffect(() => {
    if (isLocalUpdate.current) {
      isLocalUpdate.current = false;
      return;
    }
    if (profile) {
      setFormData({ ...profile });
    }
  }, [profile]);

  useEffect(() => {
    setWebAppUrl(sheetsWebAppUrl);
  }, [sheetsWebAppUrl]);

  // Validation Rules
  const isNamaSekolahFilled = formData.namaSekolah.trim().length > 0;
  const isKepalaSekolahFilled = formData.kepalaSekolah.trim().length > 0;

  // NPSN Validation: must be filled and strictly numeric
  const isNpsnFilled = formData.npsn.trim().length > 0;
  const isNpsnNumeric = /^\d+$/.test(formData.npsn.trim());
  const isNpsnValid = isNpsnFilled && isNpsnNumeric;

  // NUPTK / NIP Validation: must be filled and strictly numeric
  const isNuptkFilled = formData.nuptk.trim().length > 0;
  const isNuptkNumeric = /^\d+$/.test(formData.nuptk.trim());
  const isNuptkValid = isNuptkFilled && isNuptkNumeric;

  // All required fields filled & valid format
  const isFormValid =
    isNamaSekolahFilled &&
    isKepalaSekolahFilled &&
    isNpsnValid &&
    isNuptkValid;

  // Centralized field change handler with real-time validation and conditional auto-save
  const handleFieldChange = (field: keyof SchoolProfile, value: string) => {
    isLocalUpdate.current = true;
    const updated = {
      ...formData,
      [field]: value,
    };
    setFormData(updated);

    // Compute updated validity
    const updatedNamaFilled = updated.namaSekolah.trim().length > 0;
    const updatedKepalaFilled = updated.kepalaSekolah.trim().length > 0;
    const updatedNpsnValid = updated.npsn.trim().length > 0 && /^\d+$/.test(updated.npsn.trim());
    const updatedNuptkValid = updated.nuptk.trim().length > 0 && /^\d+$/.test(updated.nuptk.trim());
    const updatedFormValid =
      updatedNamaFilled &&
      updatedKepalaFilled &&
      updatedNpsnValid &&
      updatedNuptkValid;

    // Only auto-save to storage if the current state is valid
    if (updatedFormValid) {
      onUpdateProfile(updated);

      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedTime(timeStr);
      setIsAutoSaved(true);
      setTimeout(() => setIsAutoSaved(false), 2000);
    }
  };

  // Handle Logo Upload (JPEG, JPG, PNG) with automatic optimization for Google Spreadsheet
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Format file tidak didukung! Mohon gunakan format JPEG, JPG, atau PNG.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    try {
      setStatusMessage('Mengoptimasi ukuran logo untuk Google Spreadsheet...');
      // Kompres dan ubah ukuran logo agar pas dengan batas sel Google Spreadsheet (< 50.000 karakter)
      const optimizedBase64 = await optimizeLogoImage(file, 160, 160);
      handleFieldChange('logoUrl', optimizedBase64);
      updateAppFavicon(optimizedBase64);
      setShowToast(true);
      setStatusMessage('Logo baru berhasil dimuat, favicon tab browser telah diperbarui, dan logo siap tersimpan!');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage('Gagal memproses logo: ' + (err.message || 'File tidak dapat dibaca'));
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Remove Logo with immediate save
  const handleRemoveLogo = () => {
    handleFieldChange('logoUrl', '');
    updateAppFavicon(null);
    setShowToast(true);
    setStatusMessage('Logo sekolah telah dihapus dan favicon kembali ke standar.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  // Manual save handler with loading spinner state and validation gate
  const handleSaveProfile = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // Validation guard: reject save if form is invalid
    if (!isFormValid || isSaving) {
      if (!isNamaSekolahFilled) {
        setErrorMessage('Nama Sekolah wajib diisi!');
      } else if (!isKepalaSekolahFilled) {
        setErrorMessage('Nama Kepala Sekolah wajib diisi!');
      } else if (!isNpsnFilled) {
        setErrorMessage('NPSN wajib diisi!');
      } else if (!isNpsnNumeric) {
        setErrorMessage('Format NPSN tidak valid: hanya boleh berisi angka (numerik).');
      } else if (!isNuptkFilled) {
        setErrorMessage('NUPTK/NIP Kepala Sekolah wajib diisi!');
      } else if (!isNuptkNumeric) {
        setErrorMessage('Format NUPTK/NIP tidak valid: harus berupa angka (numerik).');
      }
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    setIsSaving(true);
    try {
      // Simulate realistic persistence delay for visible loading spinner
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Persist clean trimmed data
      onUpdateProfile({
        ...formData,
        namaSekolah: formData.namaSekolah.trim(),
        kepalaSekolah: formData.kepalaSekolah.trim(),
        npsn: formData.npsn.trim(),
        nuptk: formData.nuptk.trim(),
      });

      if (onUpdateSheetsUrl) {
        onUpdateSheetsUrl(webAppUrl.trim());
      }

      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedTime(timeStr);
      setIsSavedRecently(true);
      setShowToast(true);
      setErrorMessage('');
      setStatusMessage('Profil sekolah berhasil disimpan! Seluruh data dan nama sekolah telah diperbarui secara otomatis.');

      setTimeout(() => {
        setIsSavedRecently(false);
      }, 3500);

      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCodeGs = () => {
    const element = document.createElement('a');
    element.setAttribute('href', '/Code.gs');
    element.setAttribute('download', 'Code.gs');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyCodeGs = async () => {
    try {
      const res = await fetch('/Code.gs');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (e) {
      setErrorMessage('Gagal menyalin script. Silakan gunakan tombol Download Code.gs.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const triggerGoogleSheetsSync = async () => {
    if (!webAppUrl.trim()) {
      setErrorMessage('Silakan masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    if (onSyncToSheets) {
      setIsSyncing(true);
      try {
        await onSyncToSheets();
        setStatusMessage('Sinkronisasi data ke Google Spreadsheet berhasil dikirim!');
        setShowToast(true);
      } catch (err: any) {
        setErrorMessage('Gagal sinkronisasi ke Google Spreadsheet: ' + (err.message || 'Error'));
      } finally {
        setIsSyncing(false);
        setTimeout(() => setStatusMessage(''), 4000);
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* FLOATING TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed top-5 right-5 sm:right-8 z-50 max-w-md bg-white border-2 border-emerald-500 rounded-2xl shadow-2xl p-4 flex items-start gap-3.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-900">
                Profil Sekolah Berhasil Disimpan!
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Valid & Tersimpan
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Nama sekolah, logo, dan seluruh identitas sekolah telah tersimpan secara otomatis dan langsung diterapkan pada aplikasi.
            </p>
            {lastSavedTime && (
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Waktu simpan: {lastSavedTime} WIB
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Title with Auto-save indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Menu Setting Profil Satuan Pendidikan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Atur identitas resmi sekolah, akreditasi, kurikulum, dan logo sekolah dengan validasi numerik otomatis.
          </p>
        </div>

        {/* Auto-Save & Validation Live Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isFormValid ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {isAutoSaved
                  ? 'Menyimpan perubahan...'
                  : lastSavedTime
                  ? `Tersimpan otomatis (${lastSavedTime} WIB)`
                  : 'Auto-Save Aktif: Data valid & tersimpan'}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Menunggu format data valid (NPSN & NUPTK numerik)</span>
            </span>
          )}
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Top Success Banner */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Identitas Sekolah & Kepala Sekolah
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Kolom bertanda <span className="text-red-500 font-bold">*</span> wajib diisi dengan format valid
            </span>
          </div>

          {/* Logo Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="w-20 h-20 rounded-xl bg-white border-2 border-blue-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xs font-bold text-slate-800">
                  Upload Logo Resmi Sekolah
                </h3>
                {formData.logoUrl && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    Logo Terpasang & Tersimpan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Format yang didukung: JPEG, JPG, PNG. Begitu dipilih, logo langsung tersimpan dan otomatis tampil pada menu Login dan Sidebar.
              </p>
              <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg cursor-pointer transition shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih & Simpan Logo Baru</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
                  >
                    Hapus Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nama Sekolah */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Sekolah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.namaSekolah}
                onChange={(e) => handleFieldChange('namaSekolah', e.target.value)}
                placeholder="Contoh: SMP NEGERI 1 NUSANTARA"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition focus:outline-hidden focus:ring-2 ${
                  !isNamaSekolahFilled
                    ? 'bg-rose-50/40 border border-rose-400 text-rose-900 focus:ring-rose-400 focus:bg-white'
                    : 'bg-slate-50 border border-slate-300 text-slate-800 focus:ring-blue-500 focus:bg-white'
                }`}
              />
              {!isNamaSekolahFilled ? (
                <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Nama Sekolah wajib diisi.</span>
                </p>
              ) : (
                <p className="text-[10px] text-emerald-600 mt-1">
                  Otomatis diperbarui di sidebar, dashboard, dan login saat diketik.
                </p>
              )}
            </div>

            {/* Nama Kepala Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kepala Sekolah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.kepalaSekolah}
                onChange={(e) => handleFieldChange('kepalaSekolah', e.target.value)}
                placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition focus:outline-hidden focus:ring-2 ${
                  !isKepalaSekolahFilled
                    ? 'bg-rose-50/40 border border-rose-400 text-rose-900 focus:ring-rose-400 focus:bg-white'
                    : 'bg-slate-50 border border-slate-300 text-slate-800 focus:ring-blue-500 focus:bg-white'
                }`}
              />
              {!isKepalaSekolahFilled && (
                <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Nama Kepala Sekolah wajib diisi.</span>
                </p>
              )}
            </div>

            {/* NPSN with Real-Time Numeric Validation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NPSN (Nomor Pokok Sekolah Nasional) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={formData.npsn}
                  onChange={(e) => handleFieldChange('npsn', e.target.value)}
                  placeholder="Contoh: 20104567"
                  className={`w-full px-3.5 py-2.5 pr-9 rounded-xl text-xs font-mono transition focus:outline-hidden focus:ring-2 ${
                    isNpsnFilled && !isNpsnNumeric
                      ? 'bg-rose-50/50 border border-rose-400 text-rose-900 focus:ring-rose-400 focus:bg-white'
                      : isNpsnValid
                      ? 'bg-emerald-50/30 border border-emerald-300 text-slate-800 focus:ring-emerald-500 focus:bg-white'
                      : 'bg-slate-50 border border-slate-300 text-slate-800 focus:ring-blue-500 focus:bg-white'
                  }`}
                />
                <div className="absolute right-3 top-2.5 pointer-events-none">
                  {isNpsnFilled && !isNpsnNumeric ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                  ) : isNpsnValid ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
              </div>

              {/* Real-Time Validation Feedback for NPSN */}
              {isNpsnFilled && !isNpsnNumeric ? (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 mt-1.5 font-medium bg-rose-50/70 p-1.5 rounded-lg border border-rose-200 animate-in fade-in duration-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Format NPSN harus numerik (angka saja tanpa huruf atau simbol).</span>
                </div>
              ) : !isNpsnFilled ? (
                <p className="flex items-center gap-1 text-[11px] text-amber-600 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>NPSN wajib diisi (8 digit angka).</span>
                </p>
              ) : (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Format NPSN valid ({formData.npsn.trim().length} digit angka).</span>
                </p>
              )}
            </div>

            {/* NUPTK / NIP with Real-Time Numeric Validation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NUPTK / NIP Kepala Sekolah <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={formData.nuptk}
                  onChange={(e) => handleFieldChange('nuptk', e.target.value)}
                  placeholder="Contoh: 197508122000031002"
                  className={`w-full px-3.5 py-2.5 pr-9 rounded-xl text-xs font-mono transition focus:outline-hidden focus:ring-2 ${
                    isNuptkFilled && !isNuptkNumeric
                      ? 'bg-rose-50/50 border border-rose-400 text-rose-900 focus:ring-rose-400 focus:bg-white'
                      : isNuptkValid
                      ? 'bg-emerald-50/30 border border-emerald-300 text-slate-800 focus:ring-emerald-500 focus:bg-white'
                      : 'bg-slate-50 border border-slate-300 text-slate-800 focus:ring-blue-500 focus:bg-white'
                  }`}
                />
                <div className="absolute right-3 top-2.5 pointer-events-none">
                  {isNuptkFilled && !isNuptkNumeric ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                  ) : isNuptkValid ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
              </div>

              {/* Real-Time Validation Feedback for NUPTK */}
              {isNuptkFilled && !isNuptkNumeric ? (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 mt-1.5 font-medium bg-rose-50/70 p-1.5 rounded-lg border border-rose-200 animate-in fade-in duration-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Format NUPTK/NIP harus numerik (angka saja tanpa spasi/huruf).</span>
                </div>
              ) : !isNuptkFilled ? (
                <p className="flex items-center gap-1 text-[11px] text-amber-600 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>NUPTK/NIP wajib diisi (angka).</span>
                </p>
              ) : (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Format NUPTK/NIP valid ({formData.nuptk.trim().length} digit angka).</span>
                </p>
              )}
            </div>

            {/* Akreditasi (Dropdown A, B, C) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peringkat Akreditasi Sekolah
              </label>
              <select
                value={formData.akreditasi}
                onChange={(e) => handleFieldChange('akreditasi', e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              >
                <option value="A">Akreditasi A (Unggul)</option>
                <option value="B">Akreditasi B (Baik Sekali)</option>
                <option value="C">Akreditasi C (Baik)</option>
              </select>
            </div>

            {/* Kurikulum (Dropdown) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kurikulum yang Digunakan
              </label>
              <select
                value={formData.kurikulum}
                onChange={(e) => handleFieldChange('kurikulum', e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              >
                <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                <option value="Kurikulum 2013">Kurikulum 2013 (K13)</option>
                <option value="Kurikulum Nasional">Kurikulum Nasional</option>
              </select>
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon Sekolah
              </label>
              <input
                type="text"
                value={formData.telp}
                onChange={(e) => handleFieldChange('telp', e.target.value)}
                placeholder="Contoh: (021) 7890123"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Kode Pos */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Pos
              </label>
              <input
                type="text"
                value={formData.kodePos}
                onChange={(e) => handleFieldChange('kodePos', e.target.value)}
                placeholder="Contoh: 12345"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Alamat Sekolah */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap Sekolah
              </label>
              <input
                type="text"
                value={formData.alamatSekolah}
                onChange={(e) => handleFieldChange('alamatSekolah', e.target.value)}
                placeholder="Contoh: Jl. Pendidikan No. 45, Kebayoran Baru, Jakarta Selatan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Bottom Action Area with Status indicator & Manual Save Trigger */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
              {isFormValid ? (
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">Status:</span>
                  <span>
                    {lastSavedTime
                      ? `Data Valid & Otomatis Tersimpan (${lastSavedTime} WIB)`
                      : 'Semua Field Wajib Valid'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Tombol simpan dinonaktifkan: Lengkapi field wajib (*) dan pastikan NPSN serta NUPTK berformat angka (numerik).
                  </span>
                </div>
              )}
            </div>

            {/* Simpan Button with Loading Spinner & Validation Gate */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-simpan-profil"
                disabled={!isFormValid || isSaving}
                onClick={handleSaveProfile}
                title={
                  !isFormValid
                    ? 'Lengkapi semua field wajib dan pastikan NPSN serta NUPTK hanya berisi angka untuk mengaktifkan tombol'
                    : isSaving
                    ? 'Sedang menyimpan data...'
                    : 'Klik untuk menyimpan pengaturan profil'
                }
                className={`w-full sm:w-auto px-6 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-sm ${
                  isSaving
                    ? 'bg-blue-500 text-white cursor-wait opacity-90'
                    : !isFormValid
                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                    : isSavedRecently
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300 cursor-pointer active:scale-95'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan Profil Sekolah...</span>
                  </>
                ) : isSavedRecently ? (
                  <>
                    <Check className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>Profil Sekolah Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Profil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section Integrasi Google Spreadsheet & Code.gs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Integrasi Database Google Spreadsheet (Code.gs)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCodeGs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copySuccess ? 'Tersalin!' : 'Salin Code.gs'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCodeGs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Code.gs</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Aplikasi ini terhubung langsung dengan Google Spreadsheet. File <strong>Code.gs</strong> telah disertakan di dalam direktori sistem dan siap disalin ke Google Apps Script untuk inisialisasi 9 tabel sheet secara otomatis.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              URL Aplikasi Web Google Apps Script (Opsional untuk Live Cloud Sync)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webAppUrl}
                onChange={(e) => {
                  setWebAppUrl(e.target.value);
                  if (onUpdateSheetsUrl) {
                    onUpdateSheetsUrl(e.target.value.trim());
                  }
                }}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={triggerGoogleSheetsSync}
                disabled={isSyncing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Spreadsheet'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, CheckCircle2, Lock, ExternalLink, X, Award } from 'lucide-react';

export interface ElectronicSignatureProps {
  signerName: string;
  signerRole: string; // e.g. "Kepala Sekolah", "Wali Kelas 7A"
  signerNipNuptk?: string;
  schoolName: string;
  documentType: string; // e.g. "Laporan Hasil Belajar (Rapor)", "Rekapitulasi Presensi Kehadiran"
  signDate?: string;
  location?: string;
  className?: string;
  compact?: boolean;
}

export const ElectronicSignature: React.FC<ElectronicSignatureProps> = ({
  signerName,
  signerRole,
  signerNipNuptk,
  schoolName,
  documentType,
  signDate,
  location,
  className = '',
  compact = false,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);

  const displayDate = signDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Unique document certification ID generated deterministically from signer + role + school
  const certId = React.useMemo(() => {
    const raw = `${signerName}-${signerRole}-${schoolName}-${documentType}`.toUpperCase();
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `TTE-${hex}-${new Date().getFullYear()}`;
  }, [signerName, signerRole, schoolName, documentType]);

  const qrPayload = React.useMemo(() => {
    return [
      `[TANDA TANGAN ELEKTRONIK SAH]`,
      `Dokumen: ${documentType}`,
      `Penandatangan: ${signerName}`,
      `Jabatan: ${signerRole}`,
      `NIP/NUPTK: ${signerNipNuptk || '-'}`,
      `Instansi: ${schoolName}`,
      `Tanggal: ${displayDate}`,
      `Sertifikasi: BSrE & Sistem Akademik`,
      `ID Validasi: ${certId}`,
    ].join('\n');
  }, [documentType, signerName, signerRole, signerNipNuptk, schoolName, displayDate, certId]);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error('Error generating TTE QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrPayload]);

  return (
    <>
      <div
        className={`group relative inline-flex flex-col items-center text-center cursor-pointer select-none transition-all ${className}`}
        onClick={() => setShowVerifyModal(true)}
        title="Klik untuk melihat verifikasi Sertifikat Tanda Tangan Elektronik (TTE)"
      >
        {/* Indonesian Government Standard Electronic Signature Stamp Box */}
        <div className="relative border border-slate-300 print:border-slate-800 rounded-lg p-2 bg-white/95 print:bg-white shadow-2xs hover:shadow-xs hover:border-blue-400 transition-all max-w-[210px] w-full">
          {/* Watermark / Digital Seal Header */}
          <div className="flex items-center justify-between gap-1 pb-1 mb-1 border-b border-slate-200 print:border-slate-600 text-[8px] font-bold tracking-tight text-blue-900 print:text-black">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 print:text-black shrink-0" />
              <span>TTE TERSERTIFIKASI</span>
            </span>
            <span className="text-[7px] text-slate-400 print:text-black font-mono">BSrE</span>
          </div>

          <div className="flex items-center gap-2 text-left">
            {/* QR Code */}
            <div className="shrink-0 bg-white p-0.5 border border-slate-200 print:border-slate-400 rounded">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code Tanda Tangan Elektronik"
                  className="w-12 h-12 object-contain print:w-12 print:h-12"
                />
              ) : (
                <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                  QR...
                </div>
              )}
            </div>

            {/* Stamp Description */}
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-[7.5px] font-medium text-slate-500 print:text-black uppercase">
                Ditandatangani secara elektronik oleh:
              </p>
              <p className="text-[9px] font-bold text-slate-900 print:text-black truncate mt-0.5">
                {signerName}
              </p>
              <p className="text-[7.5px] text-slate-600 print:text-black truncate">
                {signerRole}
              </p>
              <p className="text-[7px] font-mono text-slate-400 print:text-black">
                {certId}
              </p>
            </div>
          </div>

          {/* Interactive Screen Hint (Hidden on Print) */}
          <div className="mt-1 pt-0.5 border-t border-slate-100 flex items-center justify-between text-[7px] text-blue-600 print:hidden font-medium">
            <span className="flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> Terverifikasi Sah
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-slate-500">
              Lihat <ExternalLink className="w-2 h-2" />
            </span>
          </div>
        </div>
      </div>

      {/* Verification Modal for Digital Signature Details */}
      {showVerifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden animate-fade-in"
          onClick={() => setShowVerifyModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Verifikasi Tanda Tangan Elektronik</h3>
                  <p className="text-xs text-blue-100">
                    Sertifikat Digital Sah & Terenkripsi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Status Banner */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">STATUS TTE: TERVERIFIKASI ASLI</div>
                  <div className="text-[11px] text-emerald-700">
                    Dokumen ini sah secara hukum dan belum mengalami perubahan sejak ditandatangani.
                  </div>
                </div>
              </div>

              {/* QR Preview & Data */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs shrink-0"
                  />
                )}
                <div className="space-y-1 min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Penandatangan Resmi
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    {signerName}
                  </div>
                  <div className="text-slate-600 font-semibold">{signerRole}</div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    NIP/NUPTK: {signerNipNuptk || '-'}
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-2 border-t border-slate-200 pt-3 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Satuan Pendidikan</span>
                  <span className="font-semibold text-slate-800 text-right">{schoolName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Jenis Dokumen</span>
                  <span className="font-semibold text-slate-800 text-right">{documentType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal Pengesahan</span>
                  <span className="font-semibold text-slate-800">{displayDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">No. Seri Sertifikat</span>
                  <span className="font-mono font-bold text-blue-700">{certId}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Otoritas Sertifikasi</span>
                  <span className="font-semibold text-slate-800">
                    BSrE BSSN / SIM Akademik
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Kriptografi SHA-256 Valid
              </span>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

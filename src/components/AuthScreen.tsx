import React, { useState, useEffect } from 'react';
import { SchoolProfile, UserAccount, UserRole } from '../types';
import {
  GraduationCap,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Mail,
  UserCheck,
  Check,
  Lock
} from 'lucide-react';

interface AuthScreenProps {
  profile: SchoolProfile;
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterUser: (newUser: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  onResetPassword: (userId: string, newPassword: string) => boolean;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  profile,
  users,
  onLoginSuccess,
  onRegisterUser,
  onResetPassword,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Form Fields - guaranteed empty on initial view and after reset
  const [role, setRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nikNuptk, setNikNuptk] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password specific fields
  const [forgotIdentifier, setForgotIdentifier] = useState(''); // Email, Full Name, or NIK/NUPTK
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  // Alerts
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Generate random 5-character alphanumeric captcha
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, [authMode]);

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setEmail('');
    setNikNuptk('');
    setForgotIdentifier('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCaptchaInput('');
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    generateCaptcha();
  };

  // Real-time matched user for "Lupa Password"
  const matchedForgotUser = forgotIdentifier.trim()
    ? users.find(
        (u) =>
          u.role === role &&
          ((u.email && u.email.toLowerCase().trim() === forgotIdentifier.toLowerCase().trim()) ||
            u.fullName.toLowerCase().trim() === forgotIdentifier.toLowerCase().trim() ||
            u.username.toLowerCase().trim() === forgotIdentifier.toLowerCase().trim() ||
            (u.nikNuptk && u.nikNuptk.trim() === forgotIdentifier.trim()))
      )
    : null;

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Silakan masukkan username dan password.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage('Kode captcha tidak cocok! Silakan periksa kembali.');
      generateCaptcha();
      return;
    }

    const matchedUser = users.find(
      (u) =>
        u.username.toLowerCase().trim() === username.toLowerCase().trim() &&
        u.password === password &&
        u.role === role
    );

    if (!matchedUser) {
      setErrorMessage(
        `Username atau password salah untuk role ${role === 'admin' ? 'Admin' : 'Guru'}.`
      );
      generateCaptcha();
      return;
    }

    // Success! Clear input fields so whenever they log out and return, fields are empty!
    clearForm();
    onLoginSuccess(matchedUser);
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setErrorMessage('Semua field wajib diisi.');
      return;
    }

    // Validation for Guru NIK/NUPTK
    if (role === 'guru' && !nikNuptk.trim()) {
      setErrorMessage('Pengisian Nomor NIK / NUPTK wajib diisi untuk pendaftaran akun Guru.');
      return;
    }

    if (nikNuptk.trim() && !/^\d+$/.test(nikNuptk.trim())) {
      setErrorMessage('Nomor NIK / NUPTK harus berupa karakter angka numerik.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage('Kode captcha tidak cocok! Silakan coba lagi.');
      generateCaptcha();
      return;
    }

    // Check if username already taken
    const exists = users.some(
      (u) => u.username.toLowerCase().trim() === username.toLowerCase().trim()
    );

    if (exists) {
      setErrorMessage('Username tersebut sudah digunakan. Silakan gunakan username lain.');
      return;
    }

    // Register user
    onRegisterUser({
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      email: email.trim() || `${username.trim().toLowerCase()}@sekolah.sch.id`,
      role: role,
      nikNuptk: nikNuptk.trim(),
    });

    setSuccessMessage(
      'Pendaftaran berhasil! Akun telah tersimpan di database. Silakan masuk menggunakan akun baru Anda.'
    );
    clearForm();
    setAuthMode('login');
  };

  // Handle Forgot Password Submit
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotIdentifier.trim()) {
      setErrorMessage('Silakan masukkan Alamat Email atau Nama Lengkap terdaftar Anda.');
      return;
    }

    if (!matchedForgotUser) {
      setErrorMessage(
        `Akun tidak ditemukan untuk role ${
          role === 'admin' ? 'Administrator' : 'Guru'
        }. Pastikan Email atau Nama Lengkap sesuai dengan data yang terdaftar.`
      );
      generateCaptcha();
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage('Silakan masukkan password baru Anda.');
      return;
    }

    if (newPassword.length < 3) {
      setErrorMessage('Password baru minimal harus terdiri dari 3 karakter.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Konfirmasi password baru tidak cocok. Silakan periksa kembali!');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage('Kode captcha tidak cocok! Silakan periksa kembali.');
      generateCaptcha();
      return;
    }

    // Execute password reset
    const success = onResetPassword(matchedForgotUser.id, newPassword.trim());

    if (success) {
      setSuccessMessage(
        `Password untuk akun "${matchedForgotUser.fullName}" (Username: ${matchedForgotUser.username}) berhasil diperbarui! Silakan masuk dengan password baru.`
      );
      clearForm();
      setAuthMode('login');
    } else {
      setErrorMessage('Gagal memperbarui password. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Decorative subtle backdrop container */}
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/90 p-6 sm:p-8 space-y-6">
          
          {/* Top School Logo & Identity */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-200/80 shadow-inner flex items-center justify-center overflow-hidden transition-transform hover:scale-105 duration-200">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.namaSekolah}
                  className="w-full h-full object-contain p-1"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <GraduationCap className="w-11 h-11 text-blue-600" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
                SiApgus v1.0
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {profile.namaSekolah || 'Sistem Aplikasi Guru Sekolah'}
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {authMode === 'login' &&
                  'Sistem Terintegrasi Database Spreadsheet & Manajemen Nilai Rapor'}
                {authMode === 'register' &&
                  'Pendaftaran Akun Baru Pengguna SiApgus'}
                {authMode === 'forgot' &&
                  'Pemulihan Kredensial & Reset Password Akun'}
              </p>
            </div>
          </div>

          {/* Alert feedback */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ---------------- FORM: LOGIN & REGISTER ---------------- */}
          {authMode !== 'forgot' && (
            <form
              onSubmit={authMode === 'register' ? handleRegisterSubmit : handleLoginSubmit}
              className="space-y-4"
            >
              {/* Role Switcher Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Peran Pengguna (Role)
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="admin">Administrator (Admin Sekolah)</option>
                    <option value="guru">Guru Mata Pelajaran / Wali Kelas</option>
                  </select>
                </div>
              </div>

              {/* Nama Lengkap (Register Mode) */}
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso, S.Pd."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition placeholder:text-slate-400"
                  />
                </div>
              )}

              {/* NIK / NUPTK (Register Mode) */}
              {authMode === 'register' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nomor NIK / NUPTK {role === 'guru' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                    </label>
                    {nikNuptk && !/^\d+$/.test(nikNuptk) && (
                      <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Harus berupa angka
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required={role === 'guru'}
                    placeholder={role === 'guru' ? "Contoh: 198504122010011005 (16 digit angka)" : "Contoh: 16 digit NIK atau NUPTK"}
                    value={nikNuptk}
                    onChange={(e) => setNikNuptk(e.target.value.replace(/\s+/g, ''))}
                    maxLength={20}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:bg-white transition placeholder:text-slate-400 font-mono ${
                      nikNuptk && !/^\d+$/.test(nikNuptk)
                        ? 'border-amber-400 focus:ring-amber-500'
                        : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Masukkan Nomor Induk Kependudukan (NIK) atau Nomor Unik Pendidik dan Tenaga Kependidikan (NUPTK).
                  </p>
                </div>
              )}

              {/* Email (Register Mode) */}
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alamat Email (Untuk Pemulihan Password)
                  </label>
                  <input
                    type="email"
                    placeholder="Contoh: budi.santoso@sekolah.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition placeholder:text-slate-400"
                  />
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Masukkan username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition placeholder:text-slate-400"
                />
              </div>

              {/* Password with Eye Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMessage('');
                        setSuccessMessage('');
                        setCaptchaInput('');
                        generateCaptcha();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer transition"
                    >
                      Lupa Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="off"
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Captcha Security */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Verifikasi Captcha
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Ketik kode di samping
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    onClick={generateCaptcha}
                    title="Klik untuk acak kode baru"
                    className="px-4 py-2 bg-linear-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl font-mono text-base font-bold tracking-widest text-slate-800 select-none cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <span className="italic">{captchaCode}</span>
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Kode"
                    maxLength={5}
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold tracking-wider text-slate-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-center"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {authMode === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar Akun Baru</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke SiApgus</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ---------------- FORM: LUPA PASSWORD ---------------- */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Reset Kredensial Akun</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    clearForm();
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Kembali</span>
                </button>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Peran Pengguna Akun Terdaftar
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="admin">Administrator (Admin Sekolah)</option>
                  <option value="guru">Guru Mata Pelajaran / Wali Kelas</option>
                </select>
              </div>

              {/* Email or Full Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Terdaftar atau Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Contoh: budi.santoso@sekolah.sch.id atau Budi Santoso"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition placeholder:text-slate-400"
                  />
                  <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Masukkan salah satu: alamat email terdaftar, nama lengkap, atau username Anda.
                </p>
              </div>

              {/* Real-Time Matched Account Card */}
              {matchedForgotUser && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">
                        {matchedForgotUser.fullName}
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        Username terdaftar:{' '}
                        <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                          {matchedForgotUser.username}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full shrink-0">
                    Terverifikasi
                  </span>
                </div>
              )}

              {/* Password Baru */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password baru minimal 3 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Konfirmasi Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Ketik ulang password baru Anda"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Captcha Security */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Verifikasi Keamanan Captcha
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Ketik kode di samping
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    onClick={generateCaptcha}
                    title="Klik untuk acak kode baru"
                    className="px-4 py-2 bg-linear-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-xl font-mono text-base font-bold tracking-widest text-slate-800 select-none cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <span className="italic">{captchaCode}</span>
                    <RefreshCw className="w-3 h-3 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Kode"
                    maxLength={5}
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold tracking-wider text-slate-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition text-center"
                  />
                </div>
              </div>

              {/* Submit Reset Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Reset & Simpan Password Baru</span>
              </button>
            </form>
          )}

          {/* Bottom Navigation & Mode Switcher */}
          <div className="pt-3 border-t border-slate-100 text-center">
            {authMode === 'login' && (
              <p className="text-xs text-slate-600">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    clearForm();
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline ml-1 cursor-pointer"
                >
                  Daftar Baru Pengguna
                </button>
              </p>
            )}

            {authMode === 'register' && (
              <p className="text-xs text-slate-600">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    clearForm();
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline ml-1 cursor-pointer"
                >
                  Kembali ke Tampilan Login
                </button>
              </p>
            )}

            {authMode === 'forgot' && (
              <p className="text-xs text-slate-600">
                Sudah ingat password Anda?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    clearForm();
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline ml-1 cursor-pointer"
                >
                  Kembali ke Tampilan Login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          SiApgus © 2026 · Sistem Aplikasi Guru Sekolah & Integrasi Spreadsheet
        </p>
      </div>
    </div>
  );
};

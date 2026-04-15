'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { UserRole } from '@/types';
import { Shield, Calendar, ArrowRight, Stethoscope } from 'lucide-react';
import MedicalLogo from '@/components/MedicalLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { auth as authApi } from '@/lib/api';

export default function Home() {
  const { t, locale } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const [requestedDoctorId, setRequestedDoctorId] = useState('');
  const [publicDoctors, setPublicDoctors] = useState<{ id: string; firstName: string; lastName: string; specialty: string }[]>([]);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLogin && role === UserRole.ASSISTANT) {
      authApi.getPublicDoctors().then((res) => setPublicDoctors(res.data)).catch(() => {});
    }
  }, [isLogin, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({
          email, password, firstName, lastName, role,
          ...(role === UserRole.ASSISTANT && requestedDoctorId ? { requestedDoctorId } : {}),
        });
      }
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(t('common.error'));
      }
    }
  };

  // Get the app name based on locale
  const getAppName = () => {
    if (locale === 'ar') {
      return 'طبيبي';
    }
    return 'Tabibi';
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding with blue gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-400/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-primary-800 rounded-2xl flex items-center justify-center shadow-lg">
                <MedicalLogo size={32} />
              </div>
              <h1 className="text-6xl font-logo font-bold text-white tracking-wide">{getAppName()}</h1>
            </div>
            <p className="text-xl text-white/90 font-light leading-relaxed max-w-md">
              {t('landing.description')}
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm border border-white/10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{t('landing.easyScheduling')}</h3>
                <p className="text-white/70 text-sm">{t('landing.bookInSeconds')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm border border-white/10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{t('landing.secureRecords')}</h3>
                <p className="text-white/70 text-sm">{t('landing.dataProtected')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm border border-white/10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{t('landing.qualityCare')}</h3>
                <p className="text-white/70 text-sm">{t('landing.bestDoctors')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary-900/30 to-transparent" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary-700 rounded-xl flex items-center justify-center shadow-blue">
                <MedicalLogo size={28} />
              </div>
              <h1 className="text-5xl font-logo font-bold text-primary-600">{getAppName()}</h1>
            </div>
            <p className="text-primary-700">{t('landing.tagline')}</p>
          </div>

          {/* Form card with shadow */}
          <div className="bg-white rounded-2xl shadow-dialog p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-primary-800">
                {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
              </h2>
              <p className="text-primary-600 mt-1 text-sm">
                {isLogin ? t('auth.signInToAccount') : t('auth.startManagingHealth')}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex mb-6 bg-primary-50 rounded-xl p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-primary-500 hover:text-primary-700'
                }`}
              >
                {t('auth.signIn')}
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-primary-500 hover:text-primary-700'
                }`}
              >
                {t('auth.register')}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1.5">
                        {t('auth.firstName')}
                      </label>
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl placeholder-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1.5">
                        {t('auth.lastName')}
                      </label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl placeholder-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      {t('auth.iAmA')}
                    </label>
                    <select
                      value={role}
                      onChange={(e) => { setRole(e.target.value as UserRole); setRequestedDoctorId(''); }}
                      className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value={UserRole.PATIENT}>{t('auth.patient')}</option>
                      <option value={UserRole.DOCTOR}>{t('auth.doctor')}</option>
                      <option value={UserRole.ASSISTANT}>{t('auth.assistant')}</option>
                    </select>
                  </div>
                  {/* Doctor selector for assistants */}
                  {role === UserRole.ASSISTANT && (
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1.5">
                        {t('auth.selectDoctor')}
                      </label>
                      <select
                        value={requestedDoctorId}
                        onChange={(e) => setRequestedDoctorId(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      >
                        <option value="">{t('auth.chooseDoctorPlaceholder')}</option>
                        {publicDoctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            Dr. {d.firstName} {d.lastName} — {d.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl placeholder-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1.5">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-primary-50/50 border border-primary-100 rounded-xl placeholder-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-700 hover:bg-primary-800 text-white py-3 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                {isLogin ? t('auth.signIn') : t('auth.createAccount')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            {isLogin && (
              <p className="text-center text-sm text-primary-600 mt-6">
                {t('auth.dontHaveAccount')}{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary-500 hover:text-primary-700 font-semibold"
                >
                  {t('auth.registerNow')}
                </button>
              </p>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-primary-500 mt-6">
            {t('auth.termsAgreement')}
          </p>
        </div>
      </div>

      <LanguageSwitcher />
    </div>
  );
}

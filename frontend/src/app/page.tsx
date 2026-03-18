'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { UserRole } from '@/types';
import { Heart, Shield, Calendar, ArrowRight } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, firstName, lastName, role });
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

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-teal-400">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-400/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">{t('common.appName')}</h1>
            </div>
            <p className="text-xl text-white/90 font-light leading-relaxed max-w-md">
              {t('landing.description')}
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">{t('landing.easyScheduling')}</h3>
                <p className="text-white/70 text-sm">{t('landing.bookInSeconds')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-sm">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">{t('landing.secureRecords')}</h3>
                <p className="text-white/70 text-sm">{t('landing.dataProtected')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-primary-600">{t('common.appName')}</h1>
            </div>
            <p className="text-midnight-600">{t('landing.tagline')}</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-midnight-900">
                {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
              </h2>
              <p className="text-midnight-600 mt-1 text-sm">
                {isLogin ? t('auth.signInToAccount') : t('auth.startManagingHealth')}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex mb-6 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-midnight-600 hover:text-midnight-800'
                }`}
              >
                {t('auth.signIn')}
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-midnight-600 hover:text-midnight-800'
                }`}
              >
                {t('auth.register')}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-midnight-800 mb-1.5">
                        {t('auth.firstName')}
                      </label>
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-midnight-800 mb-1.5">
                        {t('auth.lastName')}
                      </label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-midnight-800 mb-1.5">
                      {t('auth.iAmA')}
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value={UserRole.PATIENT}>{t('auth.patient')}</option>
                      <option value={UserRole.DOCTOR}>{t('auth.doctor')}</option>
                      <option value={UserRole.ADMIN}>{t('auth.admin')}</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-midnight-800 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-midnight-800 mb-1.5">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2 group"
              >
                {isLogin ? t('auth.signIn') : t('auth.createAccount')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            {isLogin && (
              <p className="text-center text-sm text-midnight-600 mt-6">
                {t('auth.dontHaveAccount')}{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('auth.registerNow')}
                </button>
              </p>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-midnight-500 mt-6">
            {t('auth.termsAgreement')}
          </p>
        </div>
      </div>

      <LanguageSwitcher />
    </div>
  );
}

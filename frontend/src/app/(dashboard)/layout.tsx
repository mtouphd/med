'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  Stethoscope,
  LogOut,
  FolderOpen,
  FileText,
  Heart,
  UserCog,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Inbox,
  Settings,
  Menu,
  X,
  UserCheck
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MedicalLogo from '@/components/MedicalLogo';

interface NavigationItem {
  nameKey: string;
  href: string;
  roles: UserRole[];
  icon?: any;
  children?: NavigationItem[];
}

const navigationConfig: NavigationItem[] = [
  { nameKey: 'nav.dashboard', href: '/dashboard', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT, UserRole.ASSISTANT], icon: LayoutDashboard },
  { nameKey: 'nav.appointments', href: '/appointments', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT, UserRole.ASSISTANT], icon: Calendar },
  { nameKey: 'nav.consultations', href: '/consultations', roles: [UserRole.PATIENT, UserRole.DOCTOR], icon: FileText },
  { nameKey: 'nav.availability', href: '/availability', roles: [UserRole.DOCTOR], icon: CalendarDays },
  { nameKey: 'nav.patientFolder', href: '/patients', roles: [UserRole.DOCTOR], icon: FolderOpen },
  { nameKey: 'nav.assistants', href: '/assistants', roles: [UserRole.DOCTOR], icon: UserCheck },
  { nameKey: 'nav.settings', href: '/settings', roles: [UserRole.DOCTOR], icon: Settings },
  { nameKey: 'nav.doctors', href: '/doctors', roles: [UserRole.PATIENT], icon: Stethoscope },
  { nameKey: 'nav.myPatients', href: '/assistant-patients', roles: [UserRole.ASSISTANT], icon: Users },
  {
    nameKey: 'nav.admin', href: '/admin', roles: [UserRole.ADMIN], icon: Users,
    children: [
      { nameKey: 'nav.overview', href: '/admin', roles: [UserRole.ADMIN] },
      { nameKey: 'nav.patients', href: '/admin/patients', roles: [UserRole.ADMIN], icon: UserPlus },
      { nameKey: 'nav.doctors', href: '/admin/doctors', roles: [UserRole.ADMIN], icon: UserCog },
      { nameKey: 'nav.doctorRequests', href: '/admin/family-doctor-requests', roles: [UserRole.ADMIN], icon: Heart },
      { nameKey: 'nav.settings', href: '/admin/settings', roles: [UserRole.ADMIN], icon: Settings },
    ]
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = useLanguage();
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['nav.admin']);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <p className="text-white text-sm font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const filteredNav = navigationConfig.filter((item) => item.roles.includes(user.role));

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemKey) ? prev.filter((key) => key !== itemKey) : [...prev, itemKey]
    );
  };

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
    const isExpanded = expandedItems.includes(item.nameKey);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.href}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.nameKey)}
            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl mb-1 transition-all ${
              isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon size={18} strokeWidth={1.5} />}
              <span className="font-medium text-sm">{t(item.nameKey)}</span>
            </div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1 transition-all ${
              isActive ? 'bg-white/20 text-white font-medium' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {Icon && <Icon size={18} strokeWidth={1.5} />}
            <span className="text-sm">{t(item.nameKey)}</span>
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="ml-4 pl-4 border-l border-white/20 space-y-0.5 mb-2">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    pathname === child.href ? 'bg-white/20 text-white font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {ChildIcon && <ChildIcon size={15} strokeWidth={1.5} />}
                  {t(child.nameKey)}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Get the app name based on locale
  const getAppName = () => {
    if (locale === 'ar') {
      return 'طبيبي';
    }
    return 'Tabibi';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between shadow-blue">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-xl">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center shadow-lg">
            <MedicalLogo size={18} />
          </div>
          <h1 className="text-2xl font-logo font-bold text-white">{getAppName()}</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-primary-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Blue gradient background */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-primary-600 via-primary-700 to-primary-800 flex flex-col z-50 shadow-blue-lg transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg">
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-800 rounded-xl flex items-center justify-center shadow-lg">
              <MedicalLogo size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-logo font-bold text-white tracking-wide">{getAppName()}</h1>
              <p className="text-xs text-white/70">
                {user.role === UserRole.ADMIN && t('dashboard.adminPanel')}
                {user.role === UserRole.DOCTOR && t('dashboard.doctorPortal')}
                {user.role === UserRole.PATIENT && t('dashboard.patientPortal')}
                {user.role === UserRole.ASSISTANT && t('dashboard.assistantPortal')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1">{filteredNav.map(renderNavItem)}</div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10 bg-primary-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white font-medium text-sm">{user.firstName[0]}{user.lastName[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white text-sm truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-white/60 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
          >
            <LogOut size={16} strokeWidth={1.5} />
            {t('auth.signOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 pb-24">{children}</div>
      </main>

      <LanguageSwitcher />
    </div>
  );
}

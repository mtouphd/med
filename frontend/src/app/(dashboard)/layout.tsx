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
  X
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface NavigationItem {
  nameKey: string;
  href: string;
  roles: UserRole[];
  icon?: any;
  children?: NavigationItem[];
}

const navigationConfig: NavigationItem[] = [
  { nameKey: 'nav.dashboard', href: '/dashboard', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT], icon: LayoutDashboard },
  { nameKey: 'nav.appointments', href: '/appointments', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT], icon: Calendar },
  { nameKey: 'nav.consultations', href: '/consultations', roles: [UserRole.PATIENT, UserRole.DOCTOR], icon: FileText },
  { nameKey: 'nav.requests', href: '/requests', roles: [UserRole.DOCTOR], icon: Inbox },
  { nameKey: 'nav.availability', href: '/availability', roles: [UserRole.DOCTOR], icon: CalendarDays },
  { nameKey: 'nav.patientFolder', href: '/patients', roles: [UserRole.DOCTOR], icon: FolderOpen },
  { nameKey: 'nav.doctors', href: '/doctors', roles: [UserRole.PATIENT], icon: Stethoscope },
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
  const { t } = useLanguage();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-midnight-600 text-sm font-medium">{t('common.loading')}</p>
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
              isActive ? 'bg-primary-50 text-primary-600' : 'text-midnight-700 hover:bg-slate-50 hover:text-midnight-900'
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
              isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-midnight-700 hover:bg-slate-50 hover:text-midnight-900'
            }`}
          >
            {Icon && <Icon size={18} strokeWidth={1.5} />}
            <span className="text-sm">{t(item.nameKey)}</span>
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="ml-4 pl-4 border-l border-slate-100 space-y-0.5 mb-2">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    pathname === child.href ? 'bg-primary-50 text-primary-600 font-medium' : 'text-midnight-600 hover:bg-slate-50 hover:text-midnight-900'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-midnight-700 hover:bg-slate-100 rounded-xl">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-midnight-900">{t('common.appName')}</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200/50 flex flex-col z-50 shadow-xl lg:shadow-none transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 p-1.5 text-slate-400 hover:text-midnight-700 hover:bg-slate-100 rounded-lg">
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-midnight-900">{t('common.appName')}</h1>
              <p className="text-xs text-midnight-500">
                {user.role === UserRole.ADMIN && t('dashboard.adminPanel')}
                {user.role === UserRole.DOCTOR && t('dashboard.doctorPortal')}
                {user.role === UserRole.PATIENT && t('dashboard.patientPortal')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">{filteredNav.map(renderNavItem)}</div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <span className="text-white font-medium text-sm">{user.firstName[0]}{user.lastName[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-midnight-900 text-sm truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-midnight-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-2 text-midnight-600 hover:text-red-500 transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-red-50 text-sm"
          >
            <LogOut size={16} strokeWidth={1.5} />
            {t('auth.signOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 pb-24">{children}</div>
      </main>

      <LanguageSwitcher />
    </div>
  );
}

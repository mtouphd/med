'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { LayoutDashboard, Calendar, Users, Stethoscope, LogOut, FolderOpen, FileText, Heart, UserCog, UserPlus, ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import { useState } from 'react';

interface NavigationItem {
  name: string;
  href: string;
  roles: UserRole[];
  icon?: any;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT],
    icon: LayoutDashboard
  },
  {
    name: 'Appointments',
    href: '/appointments',
    roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT],
    icon: Calendar
  },
  {
    name: 'Consultations',
    href: '/consultations',
    roles: [UserRole.PATIENT],
    icon: FileText
  },
  {
    name: 'Requests',
    href: '/requests',
    roles: [UserRole.DOCTOR],
    icon: Inbox
  },
  {
    name: 'Patient Folder',
    href: '/patients',
    roles: [UserRole.DOCTOR],
    icon: FolderOpen
  },
  {
    name: 'Doctors',
    href: '/doctors',
    roles: [UserRole.PATIENT],
    icon: Stethoscope
  },
  {
    name: 'Admin',
    href: '/admin',
    roles: [UserRole.ADMIN],
    icon: Users,
    children: [
      { name: 'Overview', href: '/admin', roles: [UserRole.ADMIN] },
      { name: 'Patients', href: '/admin/patients', roles: [UserRole.ADMIN], icon: UserPlus },
      { name: 'Doctors', href: '/admin/doctors', roles: [UserRole.ADMIN], icon: UserCog },
      { name: 'Doctor Requests', href: '/admin/family-doctor-requests', roles: [UserRole.ADMIN], icon: Heart },
    ]
  },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Admin']);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const filteredNav = navigation.filter((item) => item.roles.includes(user.role));

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.name}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg mb-1 transition-colors ${
              isActive
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon size={20} />}
              {item.name}
            </div>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              isActive
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {Icon && <Icon size={20} />}
            {item.name}
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="ml-6 space-y-1 mb-2">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                    pathname === child.href
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {ChildIcon && <ChildIcon size={16} />}
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600">MedApp</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.role === UserRole.ADMIN && 'Admin Panel'}
            {user.role === UserRole.DOCTOR && 'Doctor Portal'}
            {user.role === UserRole.PATIENT && 'Patient Portal'}
          </p>
        </div>

        <nav className="px-4 flex-1 overflow-y-auto">
          {filteredNav.map(renderNavItem)}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}

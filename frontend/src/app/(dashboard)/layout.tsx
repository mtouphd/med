'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { LayoutDashboard, Calendar, Users, Stethoscope, LogOut } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
  { name: 'Appointments', href: '/appointments', roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT] },
  { name: 'Doctors', href: '/doctors', roles: [UserRole.ADMIN, UserRole.PATIENT] },
  { name: 'Patients', href: '/patients', roles: [UserRole.ADMIN, UserRole.DOCTOR] },
  { name: 'Admin', href: '/admin', roles: [UserRole.ADMIN] },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

        <nav className="px-4 flex-1">
          {filteredNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                pathname === item.href
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.name === 'Dashboard' && <LayoutDashboard size={20} />}
              {item.name === 'Appointments' && <Calendar size={20} />}
              {item.name === 'Doctors' && <Stethoscope size={20} />}
              {item.name === 'Patients' && <Users size={20} />}
              {item.name === 'Admin' && <Users size={20} />}
              {item.name}
            </Link>
          ))}
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

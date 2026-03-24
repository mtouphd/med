import type { Metadata } from 'next';
import { Nunito, Amatic_SC } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';

// Police principale - claire et médicale
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-nunito',
});

// Police calligraphique pour le logo
const amatic = Amatic_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-logo',
});

export const metadata: Metadata = {
  title: 'Tabibi - Gestion des Rendez-vous Médicaux',
  description: 'Gérez vos rendez-vous médicaux facilement',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${amatic.variable} font-sans`}>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

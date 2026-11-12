import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '../components/navigation';

export const metadata: Metadata = {
  title: 'Handloom Operations Management Platform',
  description:
    'Enterprise operations, inventory, and lifecycle management for handloom cooperatives and manufacturing units.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navigation />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  UserCheck,
  Tags,
  ClipboardList,
  Home,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/', icon: Home },
    { label: 'Organization', href: '/organization', icon: Building2 },
    { label: 'Users & Staff', href: '/users', icon: Users },
    { label: 'Worker Directory', href: '/workers', icon: UserCheck },
    { label: 'Skill Categories', href: '/worker-categories', icon: Tags },
    { label: 'Assignments', href: '/worker-assignments', icon: ClipboardList },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              HL
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
              Handloom Operations
            </span>
          </div>

          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

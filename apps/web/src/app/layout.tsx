import type { Metadata } from 'next';
import './globals.css';

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
      <body className="antialiased min-h-screen flex flex-col">{children}</body>
    </html>
  );
}


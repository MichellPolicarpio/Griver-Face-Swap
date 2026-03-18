import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Griver — Simula tu presencia en escenarios',
  description: 'Simula cómo te verías en escenarios logísticos. Griver.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

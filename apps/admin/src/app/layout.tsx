import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Next Portal | 관리자', description: '데이터 포털 운영 콘솔' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

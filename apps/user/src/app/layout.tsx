import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Next Portal', description: '데이터로 연결되는 새로운 가능성' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

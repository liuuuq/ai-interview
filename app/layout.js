import './globals.css';
import { Press_Start_2P, Noto_Sans_SC } from 'next/font/google';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '700'],
  preload: false,
  variable: '--font-noto-sans',
  display: 'swap',
});

export const metadata = {
  title: 'AI 访谈 - 像素风AI采访官',
  description: '一个像素风格的AI实时访谈应用，支持语音输入、实时字幕和多种访谈模式。',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={`${pressStart2P.variable} ${notoSansSC.variable}`}>
      <head>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

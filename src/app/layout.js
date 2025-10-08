import "./globals.css";
import localFont from "next/font/local"; // keep if you still use any local font
import { Allura, Spectral } from 'next/font/google';

const titleFont =  Allura({
  subsets: ['latin'],
  weight: ['400'],      // 400 for regular, 700 if you want bold titles
  variable: '--font-title',
  display: 'swap',
});



             

const bodyFont = Spectral({
  subsets: ['latin'],
  weight: ['400','500','600'],
  variable: '--font-body',
  display: 'swap',
});


export const metadata = {
  title: 'John & Kristen',
  description: 'Wedding Website',
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${titleFont.variable} ${bodyFont.variable}`}>
        {children}
      </body>
    </html>
  );
}

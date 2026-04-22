import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Ultron | Futuristic Robotic Tour Guide",
  description: "Experience the future of tourism. Rent a robotic guide instantly by scanning the QR code at any station. Secure, smart, and fully autonomous.",
  keywords: "Robot tour guide, Tourism, Autonomous robot tech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 5V13C7 15.7614 9.23858 18 12 18C14.7614 18 17 15.7614 17 13V5' stroke='white' stroke-width='2.4' stroke-linecap='round' /%3E%3Ccircle cx='12' cy='11' r='2.2' fill='%234A90E2' /%3E%3Cpath d='M12 18V21' stroke='%234A90E2' stroke-width='2.4' stroke-linecap='round' /%3E%3Cpath d='M8 21H16' stroke='%234A90E2' stroke-width='2.4' stroke-linecap='round' /%3E%3C/svg%3E" />
      </head>
      <body
        className={`font-sans bg-black text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

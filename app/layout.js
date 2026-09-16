import "./globals.css";

export const metadata = {
  title: "VibeNet",
  description: "Реальная социальная сеть на Next.js и Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}


import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { UserProvider } from "./lib/UserContext"; // 👈 importa el contexto


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Asistente SMV",
  description: "Asistente inteligente para la Superintendencia del Mercado de Valores del Perú",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <UserProvider>{children}</UserProvider> {/* 👈 envolver todo */}
      </body>
    </html>
  );
}

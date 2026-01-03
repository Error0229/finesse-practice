import type { Metadata } from "next";
import { JetBrains_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GameSettingsProvider } from "@/components/game-settings-provider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display'
});

export const metadata: Metadata = {
  title: "Finesse Therapy - Tetris Finesse Trainer",
  description: "Master Tetris finesse with keyboard remapping and real-time feedback",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💊</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${orbitron.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-mono">
        <ThemeProvider>
          <GameSettingsProvider>
            {children}
          </GameSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const themes = [
  { value: "cyberpunk", label: "CYBERPUNK", icon: "⚡" },
  { value: "terminal", label: "TERMINAL", icon: "▓" },
  { value: "synthwave", label: "SYNTHWAVE", icon: "◭" },
  { value: "arctic", label: "ARCTIC", icon: "❄" },
  { value: "brutalist", label: "BRUTALIST", icon: "■" },
  { value: "original", label: "ORIGINAL", icon: "◉" },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Switch theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 font-mono">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value as any)}
            className={`cursor-pointer font-bold ${
              theme === t.value ? "bg-primary text-primary-foreground" : ""
            }`}
          >
            <span className="mr-2">{t.icon}</span>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

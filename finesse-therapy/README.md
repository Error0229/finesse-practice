# FINESSE.IO - Tetris Finesse Trainer

A modern, visually striking Tetris finesse practice tool built with Next.js, TypeScript, and shadcn/ui.

## ✨ Features

### 🎨 **5 Bold Themes**
- **CYBERPUNK** ⚡ - Electric blues, hot pinks, neon accents
- **TERMINAL** ▓ - Classic hacker aesthetic with CRT effects
- **SYNTHWAVE** ◭ - Sunset vibes with pink/purple/orange gradients
- **ARCTIC** ❄ - Icy blues and whites with sharp contrast
- **BRUTALIST** ■ - Raw, high-contrast monochrome

Each theme has custom colors, animations, and visual effects!

### ⌨️ **Advanced Keyboard Remapping**
- **Click any binding** to remap it
- **Real-time key capture** - press any key to assign
- **LocalStorage persistence** - your bindings are saved
- **Visual feedback** with pulsing animations while remapping
- **Reset to defaults** with one click

All game controls are fully remappable:
- Movement (Left, Right, Soft Drop, Hard Drop)
- Rotation (CW, CCW, 180°)
- Hold
- Reset & Mode changing

### 🎮 **Game Features** (UI Complete)
- Tetris grid with glow effects
- Hold piece display
- Next queue (5 pieces)
- Target finesse display
- Real-time statistics:
  - Mode selection
  - Top combo tracker
  - Current combo
  - Total pieces
  - Finesse percentage
  - Keys Per Piece (KPP)

### 🎯 **Visual Effects**
- **CRT scanline overlay**
- **Grid glow animations**
- **Glitch hover effects** on title
- **Pulse animations** on highlighted stats
- **Flash animations** for correct/incorrect moves
- **Smooth theme transitions**

## 🚀 Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🎨 Changing Themes

Click the palette icon in the top-right corner to switch between themes. Your preference is saved automatically!

## ⌨️ Remapping Keys

1. Click the settings (⚙️) icon in the top-right
2. Click any key binding you want to change
3. Press the key you want to assign
4. Press ESC to cancel if needed
5. Click "Reset" to restore defaults

## 🏗️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui with custom theming
- **Icons**: Lucide React
- **Runtime**: Bun
- **Fonts**:
  - JetBrains Mono (monospace)
  - Orbitron (display)

## 📁 Project Structure

```
finesse-therapy/
├── app/
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx             # Main game page
│   └── globals.css          # Global styles & theme definitions
├── components/
│   ├── theme-provider.tsx   # Theme context & management
│   ├── theme-switcher.tsx   # Theme selector dropdown
│   ├── keyboard-remapper.tsx # Key binding UI
│   └── ui/                  # shadcn/ui components
├── hooks/
│   └── use-key-bindings.ts  # Keyboard remapping logic
└── lib/
    └── types.ts             # TypeScript types & game constants
```

## 🎯 Game Logic Status

This build focuses on the **visual design** and **keyboard remapping system**. The full Tetris game logic with finesse checking can be implemented using the types and structures in `lib/types.ts`.

Key systems ready for game logic:
- ✅ Theme system with 5 distinctive themes
- ✅ Keyboard remapping with localStorage persistence
- ✅ UI layout for game board, hold, queue, stats
- ✅ Type definitions for game state & finesse tracking
- ⏳ Game loop & piece movement (next phase)
- ⏳ Finesse checking algorithm (next phase)
- ⏳ SRS rotation system (next phase)

## 🎨 Design Philosophy

This app uses a **Neo-Brutalist Cyberpunk** aesthetic with:
- High contrast colors
- Geometric shapes
- CRT/retro computer effects
- Bold typography
- Glow and pulse animations
- Theme-specific color palettes

Each theme tells a different visual story while maintaining excellent readability and usability.

## 📝 License

Based on the original finesse.io by kb_z

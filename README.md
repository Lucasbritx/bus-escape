# Bus Escape

A mobile-first tap-to-slide traffic puzzle game built with React + Vite and HTML Canvas.

## How to Play

Tap any bus to slide it in its arrow direction. It will travel until it hits another vehicle or the wall — if the path is clear all the way to the edge, it exits the grid. Clear every vehicle off the board to win.

## Features

- 3 hand-crafted levels (easy → medium → hard) with guaranteed solutions
- Procedurally generated levels from level 4 onwards (BFS-verified solvable)
- Smooth slide and exit animations with fade-out
- Bus-styled vehicles: windshield, passenger windows, headlights
- Move counter and level display
- Win screen with star rating and next level / replay options
- Mobile-first dark theme, works on desktop too

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- HTML Canvas 2D for all rendering
- No external game libraries

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Project Structure

```
src/
├── game/
│   ├── gameEngine.js      # Grid logic, slide, exit, win detection
│   ├── drawVehicle.js     # Canvas drawing helpers
│   ├── levels.js          # Hand-crafted level definitions
│   └── levelGenerator.js  # BFS-guaranteed procedural generator
├── components/
│   ├── GameCanvas.jsx     # Canvas rendering + tap input + animation loop
│   ├── HUD.jsx            # Level label + move counter
│   └── WinScreen.jsx      # Win overlay
├── App.jsx                # Game loop and level state management
└── index.css              # Mobile-first dark theme
```

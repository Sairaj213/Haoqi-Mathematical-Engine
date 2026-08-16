import React, { useEffect, useState } from 'react';
import { AngleUnit, AppTheme } from '../types';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Moon, Sun, Terminal, Compass } from 'lucide-react';
import { useScramble } from '../utils/scramble';

interface HeaderProps {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  angleUnit: AngleUnit;
  setAngleUnit: (u: AngleUnit) => void;
  soundEnabled: boolean;
  setSoundEnabled: (s: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  angleUnit,
  setAngleUnit,
  soundEnabled,
  setSoundEnabled,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [msStr, setMsStr] = useState('000');
  const [coords, setCoords] = useState('40.7128° N, 74.0060° W');

  const { displayText: titleDisplay } = useScramble('HAOQI // MATHEMATICAL SYSTEM v3.4', { speed: 25, iterations: 10 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
      setMsStr(String(now.getMilliseconds()).padStart(3, '0'));
    }, 47);

    // Subtle drift in coordinates
    const geoTimer = setInterval(() => {
      const lat = 40.7128 + (Math.sin(Date.now() / 10000) * 0.0008);
      const lng = -74.0060 + (Math.cos(Date.now() / 12000) * 0.0008);
      setCoords(`${lat.toFixed(4)}° N, ${Math.abs(lng).toFixed(4)}° W`);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(geoTimer);
    };
  }, []);

  const cycleTheme = () => {
    sound.playSwitch();
    const themes: AppTheme[] = ['light', 'obsidian', 'blueprint', 'amber'];
    const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIdx]);
  };

  const toggleAngle = () => {
    sound.playSwitch();
    setAngleUnit(angleUnit === 'rad' ? 'deg' : 'rad');
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.enabled = next;
    setSoundEnabled(next);
    if (next) sound.playSuccess();
  };

  return (
    <header className="w-full border-b border-[var(--border-main)] bg-[var(--bg-plate)] px-4 py-2.5 transition-colors duration-150 relative">
      {/* Precision corner crosshair markers */}
      <div className="absolute -bottom-1 -left-1 text-[var(--crosshair)] font-mono text-[10px] select-none pointer-events-none">+</div>
      <div className="absolute -bottom-1 -right-1 text-[var(--crosshair)] font-mono text-[10px] select-none pointer-events-none">+</div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left: Brand Identity & Telemetry */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 font-mono font-bold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--text-main)] tracking-wider">{titleDisplay}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-3">
            <span>[SYS: OPTIMAL]</span>
            <span className="opacity-40">//</span>
            <span className="tabular-nums font-mono">{coords}</span>
          </div>
        </div>

        {/* Right: Controls & Clocks */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between md:justify-end">
          {/* UTC Clock with milliseconds */}
          <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)] bg-[var(--bg-plate-subtle)] px-2 py-1 rounded-[2px] border border-[var(--border-subtle)]">
            <span className="tabular-nums text-[var(--text-main)] font-semibold">{timeStr}</span>
            <span className="tabular-nums text-[9px] opacity-70">.{msStr}</span>
            <span className="text-[9px] ml-0.5 text-[var(--text-muted)]">UTC</span>
          </div>

          {/* Angle Mode Toggle */}
          <button
            onClick={toggleAngle}
            title="Toggle Radians / Degrees [R]"
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono border border-[var(--border-main)] rounded-[2px] hover:bg-[var(--bg-hover)] transition-all"
          >
            <Compass className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="font-semibold text-[var(--text-main)] uppercase">{angleUnit}</span>
            <span className="text-[9px] text-[var(--text-muted)] opacity-70">[R]</span>
          </button>

          {/* Sound Synthesizer Toggle */}
          <button
            onClick={toggleSound}
            title="Toggle Web Audio Synthesizer [S]"
            className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono border border-[var(--border-main)] rounded-[2px] transition-all ${
              soundEnabled ? 'bg-[var(--bg-plate-subtle)]' : 'opacity-60'
            } hover:bg-[var(--bg-hover)]`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <VolumeX className="w-3 h-3 text-[var(--text-muted)]" />
            )}
            <span className="hidden sm:inline">SOUND</span>
            <span className="text-[9px] text-[var(--text-muted)] opacity-70">[S]</span>
          </button>

          {/* Theme Cycler */}
          <button
            onClick={cycleTheme}
            title="Cycle Workspace Visual Themes [T]"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border border-[var(--border-main)] rounded-[2px] hover:bg-[var(--bg-hover)] transition-all bg-[var(--bg-plate-subtle)]"
          >
            {theme === 'light' && <Sun className="w-3 h-3 text-amber-500" />}
            {theme === 'obsidian' && <Moon className="w-3 h-3 text-cyan-400" />}
            {theme === 'blueprint' && <Terminal className="w-3 h-3 text-sky-400" />}
            {theme === 'amber' && <Terminal className="w-3 h-3 text-amber-400" />}
            <span className="font-semibold uppercase tracking-wider">{theme}</span>
            <span className="text-[9px] text-[var(--text-muted)] opacity-70">[T]</span>
          </button>
        </div>
      </div>
    </header>
  );
};

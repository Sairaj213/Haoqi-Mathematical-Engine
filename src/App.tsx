import React, { useState, useEffect } from 'react';
import { TabMode, AngleUnit, AppTheme, HistoryItem } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ExpressionView } from './components/ExpressionView';
import { GraphView } from './components/GraphView';
import { MatrixView } from './components/MatrixView';
import { CalculusView } from './components/CalculusView';
import { BaseBitsView } from './components/BaseBitsView';
import { StatsView } from './components/StatsView';
import { sound } from './utils/audio';

export default function App() {
  const [theme, setTheme] = useState<AppTheme>('light');
  const [activeTab, setActiveTab] = useState<TabMode>('calc');
  const [angleUnit, setAngleUnit] = useState<AngleUnit>('rad');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [variables, setVariables] = useState<Record<string, unknown>>({
    ans: 1,
    x: 10,
    y: 5,
  });

  const [uptime, setUptime] = useState<number>(0);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // System uptime counter
  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcuts (haoqi.design style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in an input or textarea, don't trigger global navigation hotkeys
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === '1') {
        setActiveTab('calc');
        sound.playSwitch();
      } else if (e.key === '2') {
        setActiveTab('graph');
        sound.playSwitch();
      } else if (e.key === '3') {
        setActiveTab('matrix');
        sound.playSwitch();
      } else if (e.key === '4') {
        setActiveTab('calculus');
        sound.playSwitch();
      } else if (e.key === '5') {
        setActiveTab('bits');
        sound.playSwitch();
      } else if (e.key === '6') {
        setActiveTab('stats');
        sound.playSwitch();
      } else if (e.key === 't' || e.key === 'T') {
        const themes: AppTheme[] = ['light', 'obsidian', 'blueprint', 'amber'];
        setTheme((prev) => {
          const nextIdx = (themes.indexOf(prev) + 1) % themes.length;
          return themes[nextIdx];
        });
        sound.playSwitch();
      } else if (e.key === 's' || e.key === 'S') {
        setSoundEnabled((prev) => {
          const next = !prev;
          sound.enabled = next;
          if (next) sound.playSuccess();
          return next;
        });
      } else if (e.key === 'r' || e.key === 'R') {
        setAngleUnit((prev) => (prev === 'rad' ? 'deg' : 'rad'));
        sound.playSwitch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatUptime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-main)] flex flex-col font-mono selection:bg-[var(--text-accent)] selection:text-white bg-tech-grid relative">
      {/* Precision Frame Accents */}
      <div className="fixed top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[var(--crosshair)] pointer-events-none z-50 select-none" />
      <div className="fixed top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[var(--crosshair)] pointer-events-none z-50 select-none" />
      <div className="fixed bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[var(--crosshair)] pointer-events-none z-50 select-none" />
      <div className="fixed bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[var(--crosshair)] pointer-events-none z-50 select-none" />

      {/* Header */}
      <Header
        theme={theme}
        setTheme={setTheme}
        angleUnit={angleUnit}
        setAngleUnit={setAngleUnit}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Navigation Modes Bar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Active Mode Workspace */}
      <main className="flex-1 w-full pb-16 pt-2">
        {activeTab === 'calc' && (
          <ExpressionView
            angleUnit={angleUnit}
            history={history}
            setHistory={setHistory}
            variables={variables}
            setVariables={setVariables}
          />
        )}

        {activeTab === 'graph' && <GraphView />}

        {activeTab === 'matrix' && <MatrixView />}

        {activeTab === 'calculus' && <CalculusView />}

        {activeTab === 'bits' && <BaseBitsView />}

        {activeTab === 'stats' && <StatsView />}
      </main>

      {/* Bottom Telemetry Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-main)] bg-[var(--bg-plate)]/95 backdrop-blur-xs px-4 py-1.5 z-40 text-[11px] text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Shortcuts Quick Hint */}
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            <span className="text-[var(--text-main)] font-semibold">SHORTCUTS:</span>
            <span>[1..6] Tabs</span>
            <span className="opacity-40">//</span>
            <span>[T] Theme</span>
            <span className="opacity-40">//</span>
            <span>[S] Sound</span>
            <span className="opacity-40">//</span>
            <span>[R] Rad/Deg</span>
            <span className="opacity-40">//</span>
            <span>[ENTER] Solve</span>
          </div>

          {/* Engine Status */}
          <div className="flex items-center gap-3 tabular-nums text-[10px]">
            <span>UPTIME: {formatUptime(uptime)}</span>
            <span className="opacity-40">//</span>
            <span>KERNEL: MATHJS v14.0</span>
            <span className="opacity-40">//</span>
            <span className="text-emerald-500 font-bold">● SYSTEM READY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

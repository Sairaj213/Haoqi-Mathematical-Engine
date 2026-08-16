import React from 'react';
import { TabMode } from '../types';
import { sound } from '../utils/audio';
import { Calculator, LineChart, Grid3X3, Sigma, Binary, BarChart2 } from 'lucide-react';

interface NavigationProps {
  activeTab: TabMode;
  setActiveTab: (tab: TabMode) => void;
}

const TABS: { id: TabMode; label: string; num: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'calc', label: 'EXPRESSION', num: '01', icon: Calculator },
  { id: 'graph', label: '2D GRAPH', num: '02', icon: LineChart },
  { id: 'matrix', label: 'MATRIX LAB', num: '03', icon: Grid3X3 },
  { id: 'calculus', label: 'CALCULUS', num: '04', icon: Sigma },
  { id: 'bits', label: 'BITS & BASE', num: '05', icon: Binary },
  { id: 'stats', label: 'STATISTICS', num: '06', icon: BarChart2 },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const handleSelect = (id: TabMode) => {
    sound.playSwitch();
    setActiveTab(id);
  };

  return (
    <nav className="w-full border-b border-[var(--border-main)] bg-[var(--bg-root)] px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`group flex items-center gap-2 px-3 py-2 text-xs font-mono border rounded-[2px] transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--bg-plate)] text-[var(--text-main)] border-[var(--text-main)] shadow-xs font-bold'
                  : 'bg-[var(--bg-plate-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)] hover:border-[var(--border-main)]'
              }`}
            >
              <span className={`text-[10px] ${isActive ? 'text-[var(--text-accent)]' : 'opacity-50 group-hover:opacity-100'}`}>
                [{tab.num}]
              </span>
              <Icon className="w-3.5 h-3.5" />
              <span className="tracking-tight">{tab.label}</span>
              <span className="text-[9px] opacity-40 hidden md:inline ml-0.5">({tab.num.replace('0', '')})</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

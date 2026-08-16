import React from 'react';
import { sound } from '../utils/audio';

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'key' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  soundPitch?: number;
  badge?: string;
  active?: boolean;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  soundPitch = 1.0,
  badge,
  active = false,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      sound.playClick(soundPitch);
      onClick?.(e);
    }
  };

  const getVariantStyles = () => {
    if (disabled) {
      return 'opacity-40 cursor-not-allowed bg-[var(--bg-plate-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]';
    }

    if (active) {
      return 'bg-[var(--text-main)] text-[var(--bg-root)] border-[var(--text-main)] shadow-xs';
    }

    switch (variant) {
      case 'primary':
        return 'bg-[var(--text-main)] text-[var(--bg-root)] border-[var(--text-main)] hover:opacity-90 active:scale-[0.98]';
      case 'accent':
        return 'bg-[var(--text-accent)] text-white border-[var(--text-accent)] hover:opacity-90 active:scale-[0.98] shadow-xs';
      case 'key':
        return 'bg-[var(--bg-plate)] text-[var(--text-main)] border-[var(--border-main)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-plate-subtle)] active:translate-y-[1px] shadow-xs font-mono font-medium';
      case 'ghost':
        return 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] border-transparent';
      case 'danger':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20 active:scale-[0.98]';
      case 'secondary':
      default:
        return 'bg-[var(--bg-plate)] text-[var(--text-main)] border-[var(--border-main)] hover:bg-[var(--bg-hover)] active:translate-y-[0.5px]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs gap-1.5 min-h-[28px]';
      case 'lg':
        return 'px-5 py-2.5 text-sm gap-2.5 min-h-[44px]';
      case 'icon':
        return 'p-2 w-9 h-9 items-center justify-center';
      case 'md':
      default:
        return 'px-3.5 py-1.5 text-xs font-mono gap-2 min-h-[34px]';
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex items-center justify-center tracking-tight border transition-all duration-100 select-none whitespace-nowrap rounded-[2px] ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      {children}
      {badge && (
        <span className="text-[9px] uppercase tracking-widest opacity-60 ml-1 px-1 bg-black/5 dark:bg-white/10 rounded-[1px]">
          {badge}
        </span>
      )}
    </button>
  );
};

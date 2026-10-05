import React from 'react';

interface NeumorphicProgressBarProps {
  current: number;
  total: number;
  showLabels?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NeumorphicProgressBar: React.FC<NeumorphicProgressBarProps> = ({
  current,
  total,
  showLabels = true,
  className = '',
  size = 'md'
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((current / total) * 100)));

  const heightClass = {
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-5'
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2 px-0.5">
          <span className="tracking-wide">
            <strong className="text-gray-800 font-semibold">{current}</strong> / {total} Completed
          </span>
          <span className="font-mono text-gray-700 font-semibold">{percentage}%</span>
        </div>
      )}

      {/* Inset track */}
      <div className={`w-full rounded-full neu-inset p-0.5 overflow-hidden ${heightClass}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

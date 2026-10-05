import React from 'react';

interface NeumorphicCardProps {
  children: React.ReactNode;
  variant?: 'raised' | 'raised-sm' | 'inset' | 'inset-sm' | 'flat';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({
  children,
  variant = 'raised',
  className = '',
  onClick,
  interactive = false
}) => {
  const getShadowClass = () => {
    if (interactive) return 'neu-raised-interactive cursor-pointer';
    switch (variant) {
      case 'raised-sm':
        return 'neu-raised-sm';
      case 'inset':
        return 'neu-inset';
      case 'inset-sm':
        return 'neu-inset-sm';
      case 'flat':
        return 'bg-[#EBECF0]';
      case 'raised':
      default:
        return 'neu-raised';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-200 ${getShadowClass()} ${className}`}
    >
      {children}
    </div>
  );
};

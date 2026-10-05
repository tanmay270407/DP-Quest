import React from 'react';

interface NeumorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'inset' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  active = false,
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-2xl gap-2',
    lg: 'text-base px-6 py-3 rounded-2xl gap-2.5 font-medium'
  }[size];

  const getVariantClasses = () => {
    if (disabled) {
      return 'bg-[#EBECF0] text-gray-400 cursor-not-allowed opacity-60 neu-inset-sm';
    }

    if (active) {
      return 'bg-[#EBECF0] text-gray-900 font-semibold neu-pressed';
    }

    switch (variant) {
      case 'primary':
        return 'neu-btn-primary font-medium tracking-wide';
      case 'inset':
        return 'neu-inset text-gray-700 hover:text-gray-900';
      case 'danger':
        return 'bg-[#EBECF0] text-rose-600 hover:text-rose-700 neu-raised-sm active:neu-pressed';
      case 'subtle':
        return 'text-gray-600 hover:text-gray-900 hover:bg-[#E4E6EA]/50 rounded-xl';
      case 'secondary':
      default:
        return 'neu-raised-interactive text-gray-700 hover:text-gray-900 font-medium';
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${sizeClasses} ${getVariantClasses()} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

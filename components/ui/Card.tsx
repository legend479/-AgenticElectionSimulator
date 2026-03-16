import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-xl shadow-xl transition-all duration-300",
      "hover:border-slate-700/50 hover:shadow-sky-900/10",
      className
    )}>
      {children}
    </div>
  );
};

export default Card;

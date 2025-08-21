import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'text' | 'crest' | 'full';
}

export const Logo = ({ className, variant = 'text' }: LogoProps) => {
  if (variant === 'crest') {
    return (
      <div className={cn("flex items-center", className)}>
        <img 
          src="/lovable-uploads/e891efba-9965-49cd-95fc-2a87b746202f.png" 
          alt="Let The Deed Shaw Crest" 
          className="h-8 w-auto"
        />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <img 
          src="/lovable-uploads/e891efba-9965-49cd-95fc-2a87b746202f.png" 
          alt="Let The Deed Shaw Crest" 
          className="h-8 w-auto"
        />
        <div className="text-2xl font-bold text-primary tracking-tight">
          LET THE DEED SHAW
        </div>
      </div>
    );
  }

  return (
    <div className={cn("text-xl font-bold text-primary tracking-tight", className)}>
      LET THE DEED SHAW
    </div>
  );
};
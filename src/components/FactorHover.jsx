import React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

/**
 * Tooltip for individual growth factor/risk
 */
export const FactorHover = ({ label, score, isDriver = true, children }) => {
  const isPositive = score >= 0;
  const color = isDriver ? '#2D8E6F' : '#D4465E';
  const bgColor = isDriver ? 'bg-emerald-50' : 'bg-rose-50';
  
  return (
    <HoverCardPrimitive.Root>
      <HoverCardPrimitive.Trigger asChild>
        {children}
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Content
        className={`w-64 rounded-lg ${bgColor} p-4 shadow-lg border ${isDriver ? 'border-emerald-200' : 'border-rose-200'} z-50`}
        side="top"
        align="center"
        sideOffset={8}
      >
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Contribution:</span>
              <span className={`text-sm font-bold ${isDriver ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositive ? '+' : ''}{score.toFixed(1)} pts
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isDriver 
                ? `This factor is contributing positively to your growth score.`
                : `This factor is reducing your neighborhood score due to risk indicators.`
              }
            </p>
          </div>
        </div>
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Root>
  );
};

FactorHover.displayName = 'FactorHover';

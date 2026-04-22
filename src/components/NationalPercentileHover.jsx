import React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

/**
 * National Percentile HoverCard - shows ranking and comparison
 */
export const NationalPercentileHover = ({ percentile, rankLabel, topPercentage, children }) => {
  // Position the "This Zip" marker based on percentile (0-100%)
  const markerPosition = percentile;
  
  return (
    <HoverCardPrimitive.Root>
      <HoverCardPrimitive.Trigger asChild>
        {children}
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Content
        className="w-80 rounded-xl bg-white p-6 shadow-xl border border-slate-200 z-50"
        side="top"
        align="center"
        sideOffset={12}
      >
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              {percentile}% National Rank
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              This Zip Code ranks in the top {topPercentage}% of neighborhoods across the US based on your current growth factors.
            </p>
          </div>

          {/* Visual Comparison Bar */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              National Comparison
            </p>
            <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 px-2">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-amber-100 to-emerald-100 opacity-40"></div>

              {/* Labels */}
              <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold pointer-events-none">
                <span className="text-rose-600">Developing</span>
                <span className="text-amber-600">Average</span>
                <span className="text-emerald-600">Elite</span>
              </div>

              {/* Average marker (center at 50%) */}
              <div className="absolute top-0 bottom-0 w-1 bg-amber-400 left-1/2 transform -translate-x-1/2 opacity-80"></div>

              {/* This Zip marker (positioned by percentile) */}
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-[#2D8E6F] shadow-lg"
                style={{ left: `${markerPosition}%`, transform: 'translateX(-50%)' }}
              ></div>
            </div>
          </div>

          {/* Rank Label Badge */}
          <div className="pt-3 border-t border-slate-100">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold
              ${percentile > 95 ? 'bg-emerald-100 text-emerald-700' : 
                percentile > 75 ? 'bg-cyan-100 text-cyan-700' : 
                percentile > 40 ? 'bg-amber-100 text-amber-700' : 
                'bg-slate-100 text-slate-700'}`}>
              {rankLabel}
            </span>
          </div>
        </div>
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Root>
  );
};

NationalPercentileHover.displayName = 'NationalPercentileHover';

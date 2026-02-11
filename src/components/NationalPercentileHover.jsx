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
        <div className="cursor-help">
          {children}
        </div>
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Content
        className="w-72 rounded-xl bg-white p-6 shadow-lg border border-slate-100 z-50"
        side="top"
        align="center"
        sideOffset={8}
      >
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {percentile}% National Rank
            </h3>
            <p className="text-sm text-slate-600">
              This Zip Code ranks in the top {topPercentage}% of neighborhoods across the US based on your current growth factors.
            </p>
          </div>

          {/* Visual Comparison Bar */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              National Comparison
            </p>
            <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-amber-100 to-emerald-100 opacity-50"></div>

              {/* Average marker (center at 50%) */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400 left-1/2 transform -translate-x-1/2">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Average
                </div>
              </div>

              {/* This Zip marker (positioned by percentile) */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-[#2D8E6F] transition-all duration-300"
                style={{ left: `${markerPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-[#2D8E6F] whitespace-nowrap">
                  This Zip
                </div>
              </div>
            </div>
          </div>

          {/* Rank Label Badge */}
          <div className="pt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
              {rankLabel}
            </span>
          </div>
        </div>
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Root>
  );
};

NationalPercentileHover.displayName = 'NationalPercentileHover';

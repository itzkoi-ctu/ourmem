import React from 'react';
import { Calendar, Flame, Target } from 'lucide-react';
import { Countdown } from '../types';

interface CountdownWidgetProps {
  data: Countdown;
}

const CountdownWidget: React.FC<CountdownWidgetProps> = ({ data }) => {
  const { daysTogether, anniversaryDate, coupleName, nextMilestone } = data;

  return (
    <div className="w-full glassmorphism rounded-3xl p-6 shadow-md border border-couple-100/50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
      {/* Visual background heart decor */}
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 text-[#FFB6C1]/5 dark:text-couple-500/5 pointer-events-none select-none">
        <Flame className="w-64 h-64 fill-current" />
      </div>

      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <span className="text-stone-400 text-sm font-semibold tracking-wider uppercase mb-1">
          {coupleName}
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight dark:text-white flex items-center gap-2">
          <span>We've been together for</span>
        </h2>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-5xl font-extrabold bg-gradient-to-r from-couple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
            {daysTogether.toLocaleString()}
          </span>
          <span className="text-2xl font-semibold text-stone-500">days</span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-400 text-xs mt-3 bg-stone-50 dark:bg-stone-900/50 py-1.5 px-3 rounded-full">
          <Calendar className="w-3.5 h-3.5" />
          <span>Anniversary: {new Date(anniversaryDate).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
        </div>
      </div>

      {nextMilestone ? (
        <div className="bg-couple-50/75 dark:bg-couple-950/20 border border-couple-100 dark:border-couple-900/50 rounded-2xl p-4 w-full md:w-80 flex flex-col gap-2 shadow-inner relative z-10">
          <div className="flex items-center gap-2 text-couple-600 dark:text-couple-400">
            <Target className="w-4 h-4 fill-current animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider">Next Milestone</span>
          </div>
          <span className="font-bold text-stone-800 dark:text-stone-100 text-base leading-tight">
            {nextMilestone.title}
          </span>
          <div className="flex items-center justify-between border-t border-couple-100 dark:border-couple-900/50 pt-2 mt-1">
            <span className="text-xs text-stone-400 font-semibold">{nextMilestone.targetDate}</span>
            <span className="text-sm font-bold text-couple-500">
              {nextMilestone.daysUntil > 0 ? (
                `${nextMilestone.daysUntil} days left`
              ) : nextMilestone.daysUntil === 0 ? (
                'Today! 🎉'
              ) : (
                `${Math.abs(nextMilestone.daysUntil)} days ago`
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 px-4 bg-stone-50 dark:bg-stone-900/50 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl w-full md:w-80 relative z-10 flex flex-col items-center justify-center">
          <span className="text-xs text-stone-400 font-medium">No upcoming milestone set.</span>
        </div>
      )}
    </div>
  );
};

export default CountdownWidget;

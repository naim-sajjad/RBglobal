'use client';

import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepMeta = { id: number; label: string; short: string };

type Props = {
  steps: StepMeta[];
  currentStep: number;
  className?: string;
};

export function getEncouragementMessage(
  currentStep: number,
  totalSteps: number,
  percentRounded: number,
): string {
  if (currentStep === 1) {
    return "Let's get you started — we'll guide you through each step.";
  }
  if (currentStep >= totalSteps - 1) {
    return "You're almost there — double-check and finish up.";
  }
  if (percentRounded >= 70) {
    return 'Almost done!';
  }
  const left = totalSteps - currentStep;
  if (left <= 2 && left > 0) {
    return `Just ${left} step${left > 1 ? 's' : ''} left.`;
  }
  return 'Take your time — you can go back to edit any step.';
}

export const RegistrationProgress = memo(
  function RegistrationProgress({
    steps,
    currentStep,
    className,
  }: Props) {
  const total = steps.length;
  const pct = Math.min(100, Math.round((currentStep / total) * 100));
  const encouragement = getEncouragementMessage(currentStep, total, pct);

  return (
    <div className={cn('space-y-4', className)}>
      <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-[#111827]'>
            Step {currentStep} of {total}
          </p>
          <p className='text-xs text-gray-600 mt-0.5'>{encouragement}</p>
        </div>
        <p className='text-sm font-medium tabular-nums text-[#D4AF37]'>
          {pct}% completed
        </p>
      </div>

      <div className='h-2.5 w-full overflow-hidden rounded-full bg-gray-200'>
        <div
          className='h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#c49a2e] transition-all duration-500 ease-out'
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className='flex w-full min-w-0 items-center gap-0 overflow-x-auto pb-1 pt-1'>
        {steps.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <div className='flex min-w-[56px] flex-col items-center gap-1'>
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                    done && 'bg-emerald-500 text-white shadow-sm',
                    active &&
                      !done &&
                      'scale-105 bg-[#D4AF37] text-[#111827] ring-2 ring-[#D4AF37]/40',
                    !active && !done && 'bg-gray-200 text-gray-500',
                  )}
                  title={step.short}
                >
                  {done ? (
                    <Check className='h-4 w-4' strokeWidth={3} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    'max-w-[72px] truncate text-center text-[10px] font-medium leading-tight sm:text-xs',
                    active ? 'text-[#111827]' : 'text-gray-500',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-0.5 min-w-[10px] flex-1 rounded-full transition-colors duration-300',
                    currentStep > step.id ? 'bg-emerald-400' : 'bg-gray-200',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
  },
  (prev, next) =>
    prev.currentStep === next.currentStep &&
    prev.steps === next.steps &&
    prev.className === next.className,
);

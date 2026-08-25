'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PencilLine, Trash2 } from 'lucide-react';
import type { Timesheet, TimesheetTrip } from '@/lib/types';
import {
  applyBillingTaxToSubtotal,
  flattenTimesheetLineItems,
  formatPayDisplay,
  formatTripDateDisplay,
  sumPayableLinePays,
  type BillingTaxRule,
} from '@/lib/timesheet-lines';
import { cn } from '@/lib/utils';

type TimesheetLineItemsTableProps = {
  timesheet: Timesheet;
  taxRules: BillingTaxRule[];
  canAdjust: boolean;
  canManageTrips: boolean;
  onOpenAdjust: (trip: TimesheetTrip) => void;
  onDeleteTrip: (tripId: number) => void;
  onFocusTrip?: (tripId: number) => void;
};

export function TimesheetLineItemsTable({
  timesheet,
  taxRules,
  canAdjust,
  canManageTrips,
  onOpenAdjust,
  onDeleteTrip,
  onFocusTrip,
}: TimesheetLineItemsTableProps) {
  const rows = useMemo(
    () => flattenTimesheetLineItems(timesheet),
    [timesheet],
  );
  const tripsById = useMemo(() => {
    const map = new Map<number, TimesheetTrip>();
    for (const trip of timesheet.trips ?? []) {
      map.set(trip.id, trip);
    }
    return map;
  }, [timesheet.trips]);

  const totals = useMemo(() => {
    const subtotal = sumPayableLinePays(rows);
    return applyBillingTaxToSubtotal(subtotal, taxRules);
  }, [rows, taxRules]);

  let lastGroup = '';
  let groupIndex = -1;

  if (rows.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-slate-400 border border-dashed border-slate-600 rounded-md'>
        No line items yet. Add a trip or import a customer timesheet Excel/CSV.
      </p>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='overflow-x-auto rounded-md border border-slate-700'>
        <Table>
          <TableHeader>
            <TableRow className='border-slate-700 hover:bg-transparent bg-slate-900/80'>
              <TableHead className='text-slate-300 whitespace-nowrap'>Driver No</TableHead>
              <TableHead className='text-slate-300 whitespace-nowrap'>Driver Name</TableHead>
              <TableHead className='text-slate-300 whitespace-nowrap'>Customer</TableHead>
              <TableHead className='text-slate-300 whitespace-nowrap'>Trip #</TableHead>
              <TableHead className='text-slate-300 whitespace-nowrap'>Trip Date</TableHead>
              <TableHead className='text-slate-300 whitespace-nowrap'>Pay Item</TableHead>
              <TableHead className='text-slate-300 text-right whitespace-nowrap'>Qty</TableHead>
              <TableHead className='text-slate-300 text-right whitespace-nowrap'>Rate</TableHead>
              <TableHead className='text-slate-300 text-right whitespace-nowrap'>Pay</TableHead>
              {(canAdjust || canManageTrips) && (
                <TableHead className='w-10' />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => {
              if (row.tripGroupKey !== lastGroup) {
                lastGroup = row.tripGroupKey;
                groupIndex += 1;
              }
              const isContinuation =
                idx > 0 && rows[idx - 1]?.tripGroupKey === row.tripGroupKey;
              const trip = tripsById.get(row.tripId);
              const showActions =
                !isContinuation && (canAdjust || canManageTrips) && trip;

              return (
                <TableRow
                  key={row.key}
                  className={cn(
                    'border-slate-700',
                    groupIndex % 2 === 0
                      ? 'bg-slate-800/40'
                      : 'bg-slate-900/30',
                  )}
                >
                  <TableCell
                    className={cn(
                      'text-slate-200 whitespace-nowrap text-xs',
                      isContinuation && 'text-slate-500',
                    )}
                  >
                    {isContinuation ? '' : row.driverNo}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-slate-200 whitespace-nowrap text-xs',
                      isContinuation && 'text-slate-500',
                    )}
                  >
                    {isContinuation ? '' : row.driverName}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-slate-300 whitespace-nowrap text-xs max-w-[160px] truncate',
                      isContinuation && 'text-slate-500',
                    )}
                    title={row.customer}
                  >
                    {isContinuation ? '' : row.customer}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-white whitespace-nowrap text-xs font-medium',
                      isContinuation && 'text-slate-400 font-normal',
                    )}
                  >
                    {isContinuation ? '' : row.tripNumber}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-slate-300 whitespace-nowrap text-xs',
                      isContinuation && 'text-slate-500',
                    )}
                  >
                    {isContinuation ? '' : formatTripDateDisplay(row.tripDate)}
                  </TableCell>
                  <TableCell className='text-slate-200 text-xs'>
                    {row.payItem}
                  </TableCell>
                  <TableCell className='text-right text-slate-200 tabular-nums text-xs'>
                    {Number(row.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell className='text-right text-slate-200 tabular-nums text-xs'>
                    ${Number(row.rate).toFixed(2)}
                  </TableCell>
                  <TableCell className='text-right text-white tabular-nums text-xs font-medium'>
                    {formatPayDisplay(row.pay)}
                  </TableCell>
                  {(canAdjust || canManageTrips) && (
                    <TableCell className='p-1'>
                      {showActions ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='h-7 w-7 text-slate-400 hover:text-white'
                            >
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='bg-slate-800 border-slate-700 text-white'
                          >
                            {onFocusTrip && (
                              <DropdownMenuItem
                                className='focus:bg-slate-700 cursor-pointer'
                                onClick={() => onFocusTrip(row.tripId)}
                              >
                                View trip
                              </DropdownMenuItem>
                            )}
                            {canAdjust && (
                              <DropdownMenuItem
                                className='focus:bg-slate-700 cursor-pointer'
                                onClick={() => onOpenAdjust(trip)}
                              >
                                <PencilLine className='h-4 w-4 mr-2' />
                                Adjust
                              </DropdownMenuItem>
                            )}
                            {canManageTrips && (
                              <DropdownMenuItem
                                className='focus:bg-slate-700 cursor-pointer text-red-300'
                                onClick={() => onDeleteTrip(row.tripId)}
                              >
                                <Trash2 className='h-4 w-4 mr-2' />
                                Delete trip
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className='flex justify-end'>
        <table className='text-sm border-collapse min-w-[240px]'>
          <tbody>
            <tr>
              <td className='py-1 pr-6 text-slate-400'>Subtotal</td>
              <td className='py-1 text-right text-white font-medium tabular-nums'>
                ${totals.subtotal.toFixed(2)}
              </td>
            </tr>
            {totals.taxRows.map((tr) => (
              <tr key={tr.label}>
                <td className='py-1 pr-6 text-slate-400'>{tr.label}</td>
                <td className='py-1 text-right text-slate-200 tabular-nums'>
                  ${tr.amount.toFixed(2)}
                </td>
              </tr>
            ))}
            {totals.taxRows.length === 0 && totals.taxAmount === 0 ? (
              <tr>
                <td className='py-1 pr-6 text-slate-500'>Tax</td>
                <td className='py-1 text-right text-slate-500 tabular-nums'>
                  $0.00
                </td>
              </tr>
            ) : null}
            <tr>
              <td className='py-1.5 pr-6 text-slate-200 font-semibold border-t border-slate-600'>
                Total
              </td>
              <td className='py-1.5 text-right text-white font-semibold tabular-nums border-t border-slate-600'>
                ${totals.total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

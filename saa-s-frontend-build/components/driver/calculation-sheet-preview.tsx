'use client';

import React from 'react';
import { CalculationSheetPreview } from '@/lib/types';

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `$${Number(value).toFixed(2)}`;
}

export function CalculationSheetPreviewView({
  preview,
}: {
  preview: CalculationSheetPreview;
}) {
  const lines = (preview.lines ?? []).filter((line) => !line.is_tax);
  const tax =
    preview.tax != null
      ? Number(preview.tax)
      : (preview.lines ?? [])
          .filter((line) => line.is_tax)
          .reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const headers = preview.headers ?? [];
  const displayRows = preview.display_rows ?? [];
  const meta = preview.meta ?? {};

  return (
    <div className='min-w-0 max-w-full space-y-4'>
      {(meta.driver || meta.employer || meta.period) && (
        <dl className='grid gap-2 sm:grid-cols-3 text-sm'>
          {meta.driver ? (
            <div className='min-w-0 rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2'>
              <dt className='text-xs uppercase tracking-wide text-slate-500'>
                Driver
              </dt>
              <dd className='mt-0.5 break-words text-white'>{meta.driver}</dd>
            </div>
          ) : null}
          {meta.employer ? (
            <div className='min-w-0 rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2'>
              <dt className='text-xs uppercase tracking-wide text-slate-500'>
                Customer
              </dt>
              <dd className='mt-0.5 break-words text-white'>{meta.employer}</dd>
            </div>
          ) : null}
          {meta.period ? (
            <div className='min-w-0 rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2'>
              <dt className='text-xs uppercase tracking-wide text-slate-500'>
                Period
              </dt>
              <dd className='mt-0.5 break-words text-white'>{meta.period}</dd>
            </div>
          ) : null}
        </dl>
      )}

      {lines.length > 0 ? (
        <div className='max-h-[min(24rem,55vh)] max-w-full overflow-auto rounded-md border border-slate-700'>
          <table className='w-full table-fixed text-sm'>
            <colgroup>
              <col />
              <col className='w-16' />
              <col className='w-20' />
              <col className='w-24' />
            </colgroup>
            <thead className='sticky top-0 bg-slate-900 text-slate-300'>
              <tr>
                <th className='px-3 py-2 text-left font-medium'>Item</th>
                <th className='px-3 py-2 text-right font-medium'>Qty</th>
                <th className='px-3 py-2 text-right font-medium'>Rate</th>
                <th className='px-3 py-2 text-right font-medium'>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`${line.label}-${index}`} className='border-t border-slate-700'>
                  <td className='px-3 py-2 break-words text-white'>{line.label}</td>
                  <td className='px-3 py-2 text-right tabular-nums text-slate-300'>
                    {line.quantity == null ? '—' : Number(line.quantity)}
                  </td>
                  <td className='px-3 py-2 text-right tabular-nums text-slate-300'>
                    {line.rate == null ? '—' : money(line.rate)}
                  </td>
                  <td className='px-3 py-2 text-right tabular-nums text-white'>
                    {money(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className='sticky bottom-0'>
              <tr className='border-t border-slate-600 bg-slate-900'>
                <td
                  colSpan={3}
                  className='px-3 py-2 text-right font-medium text-slate-400'
                >
                  Subtotal
                </td>
                <td className='px-3 py-2 text-right font-semibold tabular-nums text-white'>
                  {money(preview.subtotal)}
                </td>
              </tr>
              {tax > 0.0001 ? (
                <tr className='border-t border-slate-700 bg-slate-900'>
                  <td
                    colSpan={3}
                    className='px-3 py-2 text-right font-medium text-slate-400'
                  >
                    HST
                  </td>
                  <td className='px-3 py-2 text-right tabular-nums text-slate-200'>
                    {money(tax)}
                  </td>
                </tr>
              ) : null}
              {preview.total != null &&
              Number(preview.total) !== Number(preview.subtotal) ? (
                <tr className='border-t border-slate-700 bg-slate-900'>
                  <td
                    colSpan={3}
                    className='px-3 py-2 text-right font-medium text-slate-400'
                  >
                    Total
                  </td>
                  <td className='px-3 py-2 text-right font-semibold tabular-nums text-emerald-300'>
                    {money(preview.total)}
                  </td>
                </tr>
              ) : null}
            </tfoot>
          </table>
        </div>
      ) : displayRows.length > 0 ? (
        <div className='max-h-[min(24rem,55vh)] max-w-full overflow-auto rounded-md border border-slate-700'>
          <table className='w-max min-w-full text-sm'>
            <thead className='sticky top-0 bg-slate-900 text-slate-300'>
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className='px-3 py-2 text-left font-medium whitespace-nowrap'
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, rIdx) => (
                <tr key={rIdx} className='border-t border-slate-700'>
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className='max-w-[12rem] truncate px-3 py-2 text-slate-200'
                      title={row[cIdx] ?? ''}
                    >
                      {row[cIdx] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className='text-sm text-slate-400'>
          No line items were detected in this spreadsheet.
        </p>
      )}
    </div>
  );
}

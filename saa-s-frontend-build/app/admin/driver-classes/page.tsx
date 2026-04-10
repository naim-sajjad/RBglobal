'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  AlertCircle,
  Pencil,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api';
import { DriverClass } from '@/lib/types';
import { toast } from 'sonner';

export default function DriverClassesPage() {
  const [classes, setClasses] = useState<DriverClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchClasses();
  }, [statusFilter]);

  const fetchClasses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await apiClient.getDriverClasses(params);
      setClasses(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Failed to load driver classes';
      setError(message || 'Failed to load driver classes');
      toast.error('Failed to load driver classes');
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (dc: DriverClass) => {
    if (
      !confirm(
        `Delete driver class "${dc.code}"${dc.name ? ` (${dc.name})` : ''}?`,
      )
    )
      return;
    try {
      await apiClient.deleteDriverClass(dc.id);
      toast.success('Driver class deleted');
      await fetchClasses();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Failed to delete';
      toast.error(message as string);
    }
  };

  const getStatusBadge = (status: string) => (
    <Badge className={status === 'active' ? 'bg-green-600' : 'bg-slate-600'}>
      {status}
    </Badge>
  );

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-white'>Driver Classes</h1>
        <p className='text-slate-400 mt-1'>
          Configure pay tiers (e.g. 21, 22, 23) and assign to drivers
        </p>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px] bg-slate-700 border-slate-600 text-white'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent className='bg-slate-800 border-slate-700 text-white'>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Link href='/admin/driver-classes/create'>
            <Button className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='h-4 w-4 mr-2' />
              Create Driver Class
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Spinner className='h-8 w-8 text-blue-500' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700 hover:bg-slate-800'>
                  <TableHead className='text-slate-300'>Class Code</TableHead>
                  <TableHead className='text-slate-300'>Name</TableHead>
                  <TableHead className='text-slate-300'>Description</TableHead>
                  <TableHead className='text-slate-300'>Status</TableHead>
                  <TableHead className='text-slate-300 w-[80px]'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow className='border-slate-700'>
                    <TableCell
                      colSpan={5}
                      className='text-slate-400 text-center py-8'
                    >
                      No driver classes. Create one to use in rate cards and
                      driver assignment.
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((dc) => (
                    <TableRow
                      key={dc.id}
                      className='border-slate-700 hover:bg-slate-700/50'
                    >
                      <TableCell className='font-medium text-white'>
                        {dc.code}
                      </TableCell>
                      <TableCell className='text-slate-300'>
                        {dc.name || '—'}
                      </TableCell>
                      <TableCell className='text-slate-300 max-w-xs truncate'>
                        {dc.description || '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(dc.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-slate-400'
                            >
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='bg-slate-800 border-slate-700'
                          >
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/driver-classes/${dc.id}`}
                                className='text-slate-200 cursor-pointer flex items-center'
                              >
                                <Pencil className='h-4 w-4 mr-2' />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-red-300 cursor-pointer'
                              onClick={() => handleDelete(dc)}
                            >
                              <Trash2 className='h-4 w-4 mr-2' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

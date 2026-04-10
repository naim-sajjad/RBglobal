'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DriverClass, DriverClassFormData } from '@/lib/types';
import { toast } from 'sonner';

export default function EditDriverClassPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [driverClass, setDriverClass] = useState<DriverClass | null>(null);
  const [formData, setFormData] = useState<DriverClassFormData>({
    code: '',
    name: '',
    description: '',
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      apiClient
        .getDriverClass(id)
        .then((dc) => {
          setDriverClass(dc);
          setFormData({
            code: dc.code,
            name: dc.name ?? '',
            description: dc.description ?? '',
            status: dc.status,
          });
        })
        .catch(() => {
          toast.error('Failed to load driver class');
          setError('Failed to load');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    if (!formData.code.trim()) {
      setError('Class code is required.');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.updateDriverClass(id, formData);
      toast.success('Driver class updated');
      router.push('/admin/driver-classes');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Failed to save';
      setError(message as string);
      toast.error(message as string);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !driverClass) {
    return (
      <div className='flex justify-center py-12'>
        <Spinner className='h-8 w-8 text-blue-500' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Link href='/admin/driver-classes'>
          <Button
            variant='ghost'
            size='icon'
            className='text-slate-400 hover:text-white'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
        </Link>
        <div>
          <h1 className='text-3xl font-bold text-white'>Edit Driver Class</h1>
          <p className='text-slate-400 mt-1'>
            {driverClass.code}
            {driverClass.name ? ` — ${driverClass.name}` : ''}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className='bg-slate-800 border-slate-700 max-w-xl'>
        <CardHeader>
          <CardTitle className='text-white'>Driver Class</CardTitle>
          <CardDescription className='text-slate-400'>
            Update class code, name, and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Class Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g. 21, 22, 23'
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Class Name (optional)</Label>
              <Input
                value={formData.name ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='e.g. Senior Driver'
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Description (optional)</Label>
              <Textarea
                value={formData.description ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='e.g. Heavy Equipment'
                rows={3}
                className='bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-200'>Status</Label>
              <Select
                value={formData.status ?? 'active'}
                onValueChange={(v: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: v })
                }
              >
                <SelectTrigger className='bg-slate-700 border-slate-600 text-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='text-white bg-slate-800 border-slate-700'>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex gap-3 justify-end pt-4'>
              <Link href='/admin/driver-classes'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isSaving}
                  className='border-slate-600 bg-transparent text-slate-300'
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type='submit'
                disabled={isSaving}
                className='bg-blue-600 hover:bg-blue-700'
              >
                {isSaving ? (
                  <Spinner className='h-4 w-4 mr-2 animate-spin' />
                ) : null}
                Update
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

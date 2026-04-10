'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, AlertCircle, Pencil, Trash2, ListChecks } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PayItemTemplate } from '@/lib/types';
import { toast } from 'sonner';

const UNIT_OPTIONS = [
  'per_km',
  'per_mile',
  'per_hour',
  'per_stop',
  'flat',
  'other',
];

export default function PayItemTemplatesPage() {
  const [templates, setTemplates] = useState<PayItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PayItemTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    unit: 'per_km',
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getPayItemTemplates({});
      setTemplates(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load pay item templates',
      );
      toast.error('Failed to load pay item templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '', unit: 'per_km', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (t: PayItemTemplate) => {
    setEditing(t);
    setForm({
      code: t.code,
      name: t.name,
      unit: t.unit,
      is_active: t.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiClient.updatePayItemTemplate(editing.id, {
          code: form.code,
          name: form.name,
          unit: form.unit,
          is_active: form.is_active,
        });
        toast.success('Pay item template updated');
      } else {
        await apiClient.createPayItemTemplate({
          code: form.code,
          name: form.name,
          unit: form.unit,
          is_active: form.is_active,
        });
        toast.success('Pay item template created');
      }
      setDialogOpen(false);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: PayItemTemplate) => {
    if (!confirm(`Delete pay item "${t.name}" (${t.code})?`)) return;
    try {
      await apiClient.deletePayItemTemplate(t.id);
      toast.success('Deleted');
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-white flex items-center gap-2'>
          <ListChecks className='h-8 w-8' />
          Pay item templates
        </h1>
        <p className='text-slate-400 mt-1'>
          Define pay item types (e.g. Distance, Delay, Stops) used in driver
          timesheets. Set per-employer rates on each employer page.
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
          <span className='text-slate-400 text-sm'>
            {templates.length} template(s)
          </span>
          <Button
            className='bg-blue-600 hover:bg-blue-700'
            onClick={openCreate}
          >
            <Plus className='h-4 w-4 mr-2' />
            Add pay item template
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center py-12'>
              <Spinner className='h-8 w-8 text-white' />
            </div>
          ) : templates.length === 0 ? (
            <p className='text-slate-400 py-8 text-center'>
              No pay item templates. Create one to use in timesheets.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700'>
                  <TableHead className='text-slate-300'>Code</TableHead>
                  <TableHead className='text-slate-300'>Name</TableHead>
                  <TableHead className='text-slate-300'>Unit</TableHead>
                  <TableHead className='text-slate-300'>Status</TableHead>
                  <TableHead className='text-slate-300 w-[100px]'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id} className='border-slate-700'>
                    <TableCell className='text-white font-mono'>
                      {t.code}
                    </TableCell>
                    <TableCell className='text-white'>{t.name}</TableCell>
                    <TableCell className='text-slate-300'>{t.unit}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          t.is_active ? 'bg-green-600' : 'bg-slate-600'
                        }
                      >
                        {t.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => openEdit(t)}
                          title='Edit'
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-red-400'
                          onClick={() => handleDelete(t)}
                          title='Delete'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='bg-slate-800 border-slate-700'>
          <DialogHeader>
            <DialogTitle className='text-white'>
              {editing ? 'Edit' : 'New'} pay item template
            </DialogTitle>
            <DialogDescription className='text-slate-400'>
              Code must be unique per tenant (e.g. distance_km, delay_hr).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder='e.g. distance_km'
                required
                className='text-white bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder='e.g. Distance (km)'
                required
                className='text-white bg-slate-700 border-slate-600 text-white'
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-slate-300'>Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}
              >
                <SelectTrigger className='text-white bg-slate-700 border-slate-600 text-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-slate-800 border-slate-700'>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editing && (
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='is_active'
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_active: e.target.checked }))
                  }
                  className='rounded border-slate-600 bg-slate-700'
                />
                <Label htmlFor='is_active' className='text-slate-300'>
                  Active
                </Label>
              </div>
            )}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setDialogOpen(false)}
                className='border-slate-600 text-slate-300'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={saving}>
                {saving ? (
                  <Spinner className='h-4 w-4' />
                ) : editing ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  ArrowLeft,
  AlertCircle,
  Plus,
  Pencil,
  Copy,
  PowerOff,
  Eye,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Employer, RateCard, EmployerFormData } from '@/lib/types';
import { toast } from 'sonner';

const defaultForm: EmployerFormData & { name: string } = {
  name: '',
  company_code: '',
  contact_person: '',
  phone: '',
  email: '',
  billing_address: '',
  service_location: '',
  status: 'active',
  notes: '',
  measurement_unit: 'km',
  default_currency: 'CAD',
  minimum_trip_guarantee: '',
  requires_driver_rate_tracking: false,
};

export default function EmployerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [formData, setFormData] = useState<EmployerFormData & { name: string }>(
    defaultForm,
  );
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchEmployer();
      fetchRateCards();
    }
  }, [id]);

  const fetchEmployer = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await apiClient.getEmployer(Number(id));
      setEmployer(data);
      setFormData({
        name: data.name,
        company_code: data.company_code ?? '',
        contact_person: data.contact_person ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        billing_address: data.billing_address ?? '',
        service_location: data.service_location ?? '',
        status: data.status,
        notes: data.notes ?? '',
        measurement_unit: data.measurement_unit,
        default_currency: data.default_currency,
        minimum_trip_guarantee: data.minimum_trip_guarantee ?? '',
        requires_driver_rate_tracking: data.requires_driver_rate_tracking,
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (
              err as {
                response?: { data?: { message?: string }; status?: number };
              }
            ).response?.data?.message
          : 'Failed to load employer';
      setError(message || 'Failed to load employer');
      toast.error('Failed to load employer');
      if (
        (err as { response?: { status?: number } })?.response?.status === 404
      ) {
        router.push('/admin/employers');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRateCards = async () => {
    if (!id) return;
    try {
      const data = await apiClient.getRateCards(Number(id));
      setRateCards(Array.isArray(data) ? data : []);
    } catch {
      setRateCards([]);
    }
  };

  const handleEmployerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employer) return;
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        minimum_trip_guarantee: formData.minimum_trip_guarantee
          ? Number(formData.minimum_trip_guarantee)
          : null,
      };
      const updated = await apiClient.updateEmployer(employer.id, payload);
      const next = updated && typeof updated === 'object' ? updated : null;
      setEmployer({
        ...employer,
        ...(next ?? payload),
      } as typeof employer);
      toast.success(
        `Employer “${formData.name || employer.name}” updated successfully`,
      );
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Failed to save employer';
      setError(message as string);
      toast.error(message as string);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmployer = async () => {
    if (!employer) return;
    if (
      !confirm(
        `Delete employer "${employer.name}"? This will also delete all rate cards.`,
      )
    )
      return;
    try {
      await apiClient.deleteEmployer(employer.id);
      toast.success('Employer deleted');
      router.push('/admin/employers');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : 'Failed to delete employer';
      toast.error(message as string);
    }
  };

  const handleDuplicateRateCard = async (card: RateCard) => {
    if (!employer) return;
    try {
      await apiClient.duplicateRateCard(employer.id, card.id);
      toast.success('Rate card duplicated');
      await fetchRateCards();
    } catch {
      toast.error('Failed to duplicate rate card');
    }
  };

  const handleDeactivateRateCard = async (card: RateCard) => {
    if (!employer) return;
    if (!confirm(`Deactivate rate card "${card.name}"?`)) return;
    try {
      await apiClient.deactivateRateCard(employer.id, card.id);
      toast.success('Rate card deactivated');
      await fetchRateCards();
    } catch {
      toast.error('Failed to deactivate rate card');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-600',
      draft: 'bg-slate-500',
      scheduled: 'bg-amber-600',
      expired: 'bg-red-600',
    };
    return <Badge className={map[status] || 'bg-slate-600'}>{status}</Badge>;
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : '—';

  if (isLoading || !employer) {
    return (
      <div className='flex justify-center py-12'>
        <Spinner className='h-8 w-8 text-blue-500' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/admin/employers'>
            <Button
              variant='ghost'
              size='icon'
              className='text-slate-400 hover:text-white'
            >
              <ArrowLeft className='h-5 w-5' />
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold text-white'>{employer.name}</h1>
            <p className='text-slate-400 mt-1'>
              Edit employer and manage rate cards
            </p>
          </div>
        </div>
        <Button
          variant='outline'
          onClick={handleDeleteEmployer}
          className='border-red-600 text-red-400 hover:bg-red-600/20'
        >
          <Trash2 className='h-4 w-4 mr-2' />
          Delete Employer
        </Button>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleEmployerSubmit}>
        <div className='space-y-8'>
          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white'>Basic Information</CardTitle>
              <CardDescription className='text-slate-400'>
                Company and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='md:col-span-2 space-y-2'>
                  <Label className='text-slate-200'>Employer Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder='Employer / company name'
                    className='text-white bg-slate-700 border-slate-600 text-white'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-slate-200'>Company Code / ID</Label>
                  <Input
                    value={formData.company_code ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, company_code: e.target.value })
                    }
                    placeholder='e.g. EMP-001'
                    className='text-white bg-slate-700 border-slate-600 text-white'
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-slate-200'>Contact Person</Label>
                  <Input
                    value={formData.contact_person ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                    placeholder='Full name'
                    className='text-white bg-slate-700 border-slate-600 text-white'
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-slate-200'>Phone Number</Label>
                  <Input
                    value={formData.phone ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder='Phone'
                    className='text-white bg-slate-700 border-slate-600 text-white'
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-slate-200'>Email</Label>
                  <Input
                    type='email'
                    value={formData.email ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder='email@company.com'
                    className='text-white bg-slate-700 border-slate-600 text-white'
                  />
                </div>
                <div className='md:col-span-2 space-y-2'>
                  <Label className='text-slate-200'>Billing Address</Label>
                  <Textarea
                    value={formData.billing_address ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billing_address: e.target.value,
                      })
                    }
                    placeholder='Full address'
                    rows={2}
                    className='text-white bg-slate-700 border-slate-600 text-white'
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-slate-200'>
                    Service Location / Depot Name
                  </Label>
                  <Input
                    value={formData.service_location ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_location: e.target.value,
                      })
                    }
                    placeholder='Depot or location name'
                    className='text-white bg-slate-700 border-slate-600 text-white'
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
                    <SelectTrigger className='text-white bg-slate-700 border-slate-600 text-white'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-slate-800 border-slate-700'>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='md:col-span-2 space-y-2'>
                  <Label className='text-slate-200'>Notes</Label>
                  <Textarea
                    value={formData.notes ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder='Internal notes'
                    rows={2}
                    className='text-white bg-slate-700 border-slate-600 text-white'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-slate-800 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white'>Operational Settings</CardTitle>
              <CardDescription className='text-slate-400'>
                Measurement, currency, and trip settings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-slate-200'>Measurement Unit</Label>
                  <Select
                    value={formData.measurement_unit ?? 'km'}
                    onValueChange={(v: 'miles' | 'km') =>
                      setFormData({ ...formData, measurement_unit: v })
                    }
                  >
                    <SelectTrigger className='text-white bg-slate-700 border-slate-600 text-white'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-slate-800 border-slate-700'>
                      <SelectItem value='miles'>Miles</SelectItem>
                      <SelectItem value='km'>KM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label className='text-slate-200'>Default Currency</Label>
                  <Input
                    value={formData.default_currency ?? 'CAD'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_currency: e.target.value,
                      })
                    }
                    placeholder='CAD'
                    maxLength={3}
                    className='text-white bg-slate-700 border-slate-600 text-white'
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='text-slate-200'>
                    Minimum Trip Guarantee (optional)
                  </Label>
                  <Input
                    type='number'
                    min={0}
                    step='0.01'
                    value={formData.minimum_trip_guarantee ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimum_trip_guarantee: e.target.value || undefined,
                      })
                    }
                    placeholder='0.00'
                    className='text-white bg-slate-700 border-slate-600 text-white'
                  />
                </div>
                <div className='space-y-2 flex items-end pb-2'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      id='requires_driver_rate_tracking'
                      checked={formData.requires_driver_rate_tracking ?? false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requires_driver_rate_tracking: e.target.checked,
                        })
                      }
                      className='rounded border-slate-600 bg-slate-700'
                    />
                    <Label
                      htmlFor='requires_driver_rate_tracking'
                      className='text-slate-200 cursor-pointer'
                    >
                      Requires Driver Rate Tracking
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={isSaving}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {isSaving ? (
                <>
                  <Spinner className='h-4 w-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                'Update Employer'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Rate Cards */}
      <Card className='bg-slate-800 border-slate-700'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <div>
            <CardTitle className='text-white'>Rate Cards</CardTitle>
            <CardDescription className='text-slate-400'>
              Manage rate cards for this employer
            </CardDescription>
          </div>
          <Link href={`/admin/employers/${id}/rate-cards/new`}>
            <Button className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='h-4 w-4 mr-2' />
              Create New Rate Card
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border border-slate-700 overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='border-slate-700 bg-slate-700/50'>
                  <TableHead className='text-slate-300'>
                    Rate Card Name
                  </TableHead>
                  <TableHead className='text-slate-300'>
                    Effective From
                  </TableHead>
                  <TableHead className='text-slate-300'>Effective To</TableHead>
                  <TableHead className='text-slate-300'>Status</TableHead>
                  <TableHead className='text-slate-300 w-[200px]'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateCards.length === 0 ? (
                  <TableRow className='border-slate-700'>
                    <TableCell
                      colSpan={5}
                      className='text-slate-400 text-center py-8'
                    >
                      No rate cards. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  rateCards.map((card) => (
                    <TableRow key={card.id} className='border-slate-700'>
                      <TableCell className='text-white'>{card.name}</TableCell>
                      <TableCell className='text-slate-300'>
                        {formatDate(card.effective_from)}
                      </TableCell>
                      <TableCell className='text-slate-300'>
                        {formatDate(card.effective_to)}
                      </TableCell>
                      <TableCell>{getStatusBadge(card.status)}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Link
                            href={`/admin/employers/${id}/rate-cards/${card.id}`}
                          >
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              title='View'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                          </Link>
                          <Link
                            href={`/admin/employers/${id}/rate-cards/${card.id}/edit`}
                          >
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              title='Edit'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                          </Link>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() => handleDuplicateRateCard(card)}
                            title='Duplicate'
                          >
                            <Copy className='h-4 w-4' />
                          </Button>
                          {card.status !== 'expired' && (
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-red-400'
                              onClick={() => handleDeactivateRateCard(card)}
                              title='Deactivate'
                            >
                              <PowerOff className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

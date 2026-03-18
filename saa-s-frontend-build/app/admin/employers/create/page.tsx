'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { EmployerFormData } from '@/lib/types';
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

export default function CreateEmployerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<EmployerFormData & { name: string }>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        minimum_trip_guarantee: formData.minimum_trip_guarantee
          ? Number(formData.minimum_trip_guarantee)
          : null,
      };
      const employer = await apiClient.createEmployer(payload);
      toast.success('Employer created successfully');
      router.push(`/admin/employers/${employer.id}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to save employer';
      setError(message as string);
      toast.error(message as string);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/employers">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Create Employer</h1>
          <p className="text-slate-400 mt-1">Add a new client employer</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
              <CardDescription className="text-slate-400">
                Company and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-slate-200">Employer Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Employer / company name"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Company Code / ID</Label>
                  <Input
                    value={formData.company_code ?? ''}
                    onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                    placeholder="e.g. EMP-001"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Contact Person</Label>
                  <Input
                    value={formData.contact_person ?? ''}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Full name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Phone Number</Label>
                  <Input
                    value={formData.phone ?? ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Email</Label>
                  <Input
                    type="email"
                    value={formData.email ?? ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@company.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-slate-200">Billing Address</Label>
                  <Textarea
                    value={formData.billing_address ?? ''}
                    onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                    placeholder="Full address"
                    rows={2}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Service Location / Depot Name</Label>
                  <Input
                    value={formData.service_location ?? ''}
                    onChange={(e) => setFormData({ ...formData, service_location: e.target.value })}
                    placeholder="Depot or location name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Status</Label>
                  <Select
                    value={formData.status ?? 'active'}
                    onValueChange={(v: 'active' | 'inactive') =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-slate-200">Notes</Label>
                  <Textarea
                    value={formData.notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes"
                    rows={2}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Operational Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Measurement, currency, and trip settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Measurement Unit</Label>
                  <Select
                    value={formData.measurement_unit ?? 'km'}
                    onValueChange={(v: 'miles' | 'km') =>
                      setFormData({ ...formData, measurement_unit: v })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="miles">Miles</SelectItem>
                      <SelectItem value="km">KM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Default Currency</Label>
                  <Input
                    value={formData.default_currency ?? 'CAD'}
                    onChange={(e) =>
                      setFormData({ ...formData, default_currency: e.target.value })
                    }
                    placeholder="CAD"
                    maxLength={3}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Minimum Trip Guarantee (optional)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.minimum_trip_guarantee ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimum_trip_guarantee: e.target.value || undefined,
                      })
                    }
                    placeholder="0.00"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2 flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requires_driver_rate_tracking"
                      checked={formData.requires_driver_rate_tracking ?? false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requires_driver_rate_tracking: e.target.checked,
                        })
                      }
                      className="rounded border-slate-600 bg-slate-700"
                    />
                    <Label
                      htmlFor="requires_driver_rate_tracking"
                      className="text-slate-200 cursor-pointer"
                    >
                      Requires Driver Rate Tracking
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Link href="/admin/employers">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                className="border-slate-600 bg-transparent text-slate-300"
              >
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Employer'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

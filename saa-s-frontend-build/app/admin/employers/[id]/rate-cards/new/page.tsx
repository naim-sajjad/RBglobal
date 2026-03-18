'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Employer, RateCardFormData } from '@/lib/types';
import { toast } from 'sonner';
import { RateCardConfigForm } from '@/components/rate-card/RateCardConfigForm';

export default function NewRateCardPage() {
  const router = useRouter();
  const params = useParams();
  const employerId = params?.id as string;

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [existingRateCards, setExistingRateCards] = useState<Awaited<ReturnType<typeof apiClient.getRateCards>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (employerId) {
      Promise.all([
        apiClient.getEmployer(Number(employerId)),
        apiClient.getRateCards(employerId),
      ])
        .then(([emp, cards]) => {
          setEmployer(emp);
          setExistingRateCards(Array.isArray(cards) ? cards : []);
        })
        .catch(() => setIsLoading(false))
        .finally(() => setIsLoading(false));
    }
  }, [employerId]);

  const handleSaveDraft = async (data: RateCardFormData) => {
    await apiClient.createRateCard(Number(employerId), { ...data, status: 'draft' });
    toast.success('Rate card saved as draft');
    router.push(`/admin/employers/${employerId}`);
  };

  const handleActivate = async (data: RateCardFormData) => {
    await apiClient.createRateCard(Number(employerId), { ...data, status: 'active' });
    toast.success('Rate card activated');
    router.push(`/admin/employers/${employerId}`);
  };

  const handleCancel = () => {
    router.push(`/admin/employers/${employerId}`);
  };

  if (isLoading || !employer) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/employers/${employerId}`}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Rate Card Configuration</h1>
          <p className="text-slate-400 mt-1">Create a new rate card for {employer.name}</p>
        </div>
      </div>

      <RateCardConfigForm
        employerId={employerId}
        employerName={employer.name}
        employerMeasurementUnit={employer.measurement_unit}
        employerCurrency={employer.default_currency}
        mode="create"
        existingRateCards={existingRateCards}
        onSaveDraft={handleSaveDraft}
        onActivate={handleActivate}
        onCancel={handleCancel}
      />
    </div>
  );
}

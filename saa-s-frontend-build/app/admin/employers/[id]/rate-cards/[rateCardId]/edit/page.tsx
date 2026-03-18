'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Employer, RateCard, RateCardFormData } from '@/lib/types';
import { toast } from 'sonner';
import { RateCardConfigForm } from '@/components/rate-card/RateCardConfigForm';

export default function EditRateCardPage() {
  const router = useRouter();
  const params = useParams();
  const employerId = params?.id as string;
  const rateCardId = params?.rateCardId as string;

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [rateCard, setRateCard] = useState<RateCard | null>(null);
  const [existingRateCards, setExistingRateCards] = useState<RateCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (employerId && rateCardId) {
      Promise.all([
        apiClient.getEmployer(Number(employerId)),
        apiClient.getRateCard(Number(employerId), Number(rateCardId)),
        apiClient.getRateCards(employerId),
      ])
        .then(([emp, card, cards]) => {
          setEmployer(emp);
          setRateCard(card);
          const list = Array.isArray(cards) ? cards : [];
          setExistingRateCards(list.filter((c) => c.id !== Number(rateCardId)));
        })
        .catch(() => {
          toast.error('Failed to load rate card');
          setIsLoading(false);
        })
        .finally(() => setIsLoading(false));
    }
  }, [employerId, rateCardId]);

  const initialData: RateCardFormData | null = rateCard
    ? {
        name: rateCard.name,
        effective_from: rateCard.effective_from.slice(0, 10),
        effective_to: rateCard.effective_to.slice(0, 10),
        rates: rateCard.rates ?? undefined,
      }
    : null;

  const handleSaveDraft = async (data: RateCardFormData) => {
    await apiClient.updateRateCard(Number(employerId), Number(rateCardId), { ...data, status: 'draft' });
    toast.success('Rate card saved as draft');
    router.push(`/admin/employers/${employerId}`);
  };

  const handleActivate = async (data: RateCardFormData) => {
    await apiClient.updateRateCard(Number(employerId), Number(rateCardId), { ...data, status: 'active' });
    toast.success('Rate card activated');
    router.push(`/admin/employers/${employerId}`);
  };

  const handleCancel = () => {
    router.push(`/admin/employers/${employerId}/rate-cards/${rateCardId}`);
  };

  if (isLoading || !employer || !rateCard) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/employers/${employerId}/rate-cards/${rateCardId}`}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Rate Card Configuration</h1>
          <p className="text-slate-400 mt-1">Edit rate card for {employer.name}</p>
        </div>
      </div>

      <RateCardConfigForm
        employerId={employerId}
        employerName={employer.name}
        employerMeasurementUnit={employer.measurement_unit}
        employerCurrency={employer.default_currency}
        mode="edit"
        initialData={initialData}
        rateCardId={rateCard.id}
        existingRateCards={existingRateCards}
        onSaveDraft={handleSaveDraft}
        onActivate={handleActivate}
        onCancel={handleCancel}
      />
    </div>
  );
}

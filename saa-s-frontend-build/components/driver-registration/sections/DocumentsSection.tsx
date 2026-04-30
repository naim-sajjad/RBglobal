'use client';

import React, { useCallback } from 'react';
import type { DocumentsSectionState } from '@/lib/driver-register-section-merge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DocumentDropzone } from '@/components/driver-registration/DocumentDropzone';
import { useDebouncedStringField } from '@/components/driver-registration/sections/useDebouncedStringField';

export type DocumentsSectionProps = {
  data: DocumentsSectionState;
  setData: React.Dispatch<React.SetStateAction<DocumentsSectionState>>;
};

function DocumentsFieldsInner({ data, setData }: DocumentsSectionProps) {
  const complianceNotes = useDebouncedStringField(
    data.compliance_notes,
    useCallback(
      (v) =>
        setData((prev) => ({
          ...prev,
          compliance_notes: v,
        })),
      [setData],
    ),
  );

  return (
    <div className='space-y-6'>
      <DocumentDropzone
        label='PCC / Criminal Background Check'
        file={data.pcc_document}
        onFileChange={(f) =>
          setData((prev) => ({
            ...prev,
            pcc_document: f,
          }))
        }
        required
      />

      <DocumentDropzone
        label='Abstract Document'
        file={data.abstract_document}
        onFileChange={(f) =>
          setData((prev) => ({
            ...prev,
            abstract_document: f,
          }))
        }
      />

      <DocumentDropzone
        label='CVOR Document'
        file={data.cvor_document}
        onFileChange={(f) =>
          setData((prev) => ({
            ...prev,
            cvor_document: f,
          }))
        }
      />

      <DocumentDropzone
        label='Safety Certificate'
        file={data.safety_certificate}
        onFileChange={(f) =>
          setData((prev) => ({
            ...prev,
            safety_certificate: f,
          }))
        }
      />

      <div className='space-y-2'>
        <Label className='text-[#111827] font-medium'>Compliance Notes</Label>
        <Textarea
          name='compliance_notes'
          value={complianceNotes.value}
          onChange={(e) => complianceNotes.onChangeValue(e.target.value)}
          onBlur={complianceNotes.onBlur}
          rows={3}
          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
          placeholder='Any additional compliance information...'
        />
      </div>
    </div>
  );
}

export const DocumentsSection = React.memo(function DocumentsSection(
  props: DocumentsSectionProps,
) {
  return <DocumentsFieldsInner {...props} />;
});

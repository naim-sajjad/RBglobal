'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/web/Header';
import { SiteFooter } from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  Truck,
  Shield,
  ArrowRight,
  ArrowLeft,
  User,
  Home,
  IdCard,
  Briefcase,
  ClipboardCheck,
  Lock,
} from 'lucide-react';
import {
  RegistrationProgress,
  type StepMeta,
} from '@/components/driver-registration/RegistrationProgress';
import {
  PersonalSection,
  AddressSection,
  LicenseSection,
  DrivingSection,
  EmploymentSection,
  DocumentsSection,
  ReviewSection,
  PasswordSection,
} from '@/components/driver-registration/sections';
import {
  getDriverRegisterInitialFormState,
  validateDriverRegisterSection,
} from '@/lib/driver-register';
import {
  getInitialDriverRegisterSectionSlices,
  mergeDriverRegisterSections,
} from '@/lib/driver-register-section-merge';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
function getHeroSubtitle(step: number): string {
  const lines: Record<number, string> = {
    1: "Let's get you started — we'll guide you step by step.",
    2: 'Where do you live? We need your current and recent addresses.',
    3: "Your driver's licence — details and a clear upload.",
    4: 'Tell us about your driving experience and equipment.',
    5: 'Employment history helps us stay compliant.',
    6: 'Upload documents securely — drag files in or browse.',
    7: 'Review your answers — edit any section before you finish.',
    8: 'Create a strong password to protect your account.',
  };
  return (
    lines[step] ?? 'Work through each step — you can go back to edit anytime.'
  );
}

function getCardDescription(step: number): string {
  if (step === 7) {
    return 'Check the summary — use Edit to jump to a section. Nothing is lost when you go back.';
  }
  if (step === 8) {
    return 'Choose a password you don’t use elsewhere. Required fields are marked with *.';
  }
  return 'Required fields are marked with * — fix issues before tapping Next.';
}

const REGISTRATION_STEPS: StepMeta[] = [
  { id: 1, label: 'Personal', short: 'You' },
  { id: 2, label: 'Address', short: 'Home' },
  { id: 3, label: 'License', short: 'ID' },
  { id: 4, label: 'Driving', short: 'Drive' },
  { id: 5, label: 'Work', short: 'Jobs' },
  { id: 6, label: 'Documents', short: 'Docs' },
  { id: 7, label: 'Review', short: 'Check' },
  { id: 8, label: 'Password', short: 'Done' },
];

export default function DriverRegisterPage() {
  const router = useRouter();

  const fullInit = getDriverRegisterInitialFormState();
  const initSlices = getInitialDriverRegisterSectionSlices(fullInit);
  const [tenantId] = useState(fullInit.tenant_id);
  const [personal, setPersonal] = useState(initSlices.personal);
  const [address, setAddress] = useState(initSlices.address);
  const [license, setLicense] = useState(initSlices.license);
  const [driving, setDriving] = useState(initSlices.driving);
  const [employment, setEmployment] = useState(initSlices.employment);
  const [documents, setDocuments] = useState(initSlices.documents);
  const [password, setPassword] = useState(initSlices.password);

  const mergedFormData = useMemo(
    () =>
      mergeDriverRegisterSections(
        {
          personal,
          address,
          license,
          driving,
          employment,
          documents,
          password,
        },
        tenantId,
      ),
    [
      personal,
      address,
      license,
      driving,
      employment,
      documents,
      password,
      tenantId,
    ],
  );

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const totalSections = 8;

  const validateCurrentSection = useCallback((): {
    isValid: boolean;
    errorMessage: string;
  } => validateDriverRegisterSection(currentSection, mergedFormData), [
    currentSection,
    mergedFormData,
  ]);

  const nextSection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate current section before proceeding
    const validation = validateCurrentSection();
    if (!validation.isValid) {
      setError(validation.errorMessage);
      toast.error(validation.errorMessage);
      // Scroll to error message
      setTimeout(() => {
        const formContainer = document.querySelector('[data-form-container]');
        if (formContainer) {
          formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }

    // Clear any previous errors
    setError('');

    if (currentSection < totalSections) {
      setCurrentSection(currentSection + 1);
      // Scroll to top of form so the new section is visible
      setTimeout(() => {
        const formContainer = document.querySelector('[data-form-container]');
        if (formContainer) {
          formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const prevSection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const currentSectionNode = useMemo(() => {
    switch (currentSection) {
      case 1:
        return <PersonalSection data={personal} setData={setPersonal} />;
      case 2:
        return <AddressSection data={address} setData={setAddress} />;
      case 3:
        return <LicenseSection data={license} setData={setLicense} />;
      case 4:
        return <DrivingSection data={driving} setData={setDriving} />;
      case 5:
        return <EmploymentSection data={employment} setData={setEmployment} />;
      case 6:
        return <DocumentsSection data={documents} setData={setDocuments} />;
      case 7:
        return (
          <ReviewSection
            merged={mergedFormData}
            onEditSection={(section) => {
              setError('');
              setCurrentSection(section);
            }}
          />
        );
      case 8:
        return (
          <PasswordSection
            data={password}
            setData={setPassword}
            accountEmail={personal.email}
          />
        );
      default:
        return null;
    }
  }, [
    currentSection,
    personal,
    address,
    license,
    driving,
    employment,
    documents,
    password,
    mergedFormData,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate all sections before submit
    for (let s = 1; s <= totalSections; s++) {
      const result = validateDriverRegisterSection(s, mergedFormData);
      if (!result.isValid) {
        setError(result.errorMessage);
        toast.error(result.errorMessage);
        setIsLoading(false);
        return;
      }
    }

    try {
      // Combine first, middle, last name for the name field
      const fullName =
        `${mergedFormData.first_name} ${mergedFormData.middle_initial ? mergedFormData.middle_initial + '. ' : ''}${mergedFormData.last_name}`.trim();

      // Combine all additional information into compliance_notes
      const additionalInfo = {
        personal: {
          middle_initial: mergedFormData.middle_initial,
          gender: mergedFormData.gender,
          date_of_birth: mergedFormData.date_of_birth,
          work_eligibility_canada: mergedFormData.work_eligibility_canada,
          education: mergedFormData.education,
          medical_limitations: mergedFormData.medical_limitations,
          medical_limitations_explanation:
            mergedFormData.medical_limitations_explanation,
        },
        address: {
          current_address: mergedFormData.current_address,
          current_address_living_since:
            mergedFormData.current_address_living_since,
          city: mergedFormData.city,
          province: mergedFormData.province,
          postal_code: mergedFormData.postal_code,
          cell_phone: mergedFormData.cell_phone,
          previous_addresses: mergedFormData.previous_addresses
            .filter((a) => a.address.trim())
            .map((a) => ({
              address: a.address.trim(),
              from_date: a.from_date.trim(),
              to_date: a.to_date.trim(),
            })),
        },
        license: {
          license_province: mergedFormData.license_province,
          license_class: mergedFormData.license_class,
          license_endorsements: mergedFormData.license_endorsements,
          license_conditions: mergedFormData.license_conditions,
        },
        questions: {
          license_denied: mergedFormData.license_denied,
          privileges_revoked: mergedFormData.privileges_revoked,
          dangerous_goods_certificate: mergedFormData.dangerous_goods_certificate,
        },
        driving_experience: {
          equipment_used: mergedFormData.equipment_used,
          accident_history: {
            ever_had_accidents: mergedFormData.ever_had_accidents,
            number_of_incidents: mergedFormData.number_of_incidents,
            accident_explanation: mergedFormData.accident_explanation,
          },
          traffic_violations: mergedFormData.traffic_violations,
        },
        employment_history: {
          current_employer: mergedFormData.current_employer,
          previous_employers: mergedFormData.previous_employers,
        },
        existing_notes: mergedFormData.compliance_notes,
      };

      const submitData: any = {
        name: fullName,
        email: mergedFormData.email,
        password: mergedFormData.password,
        license_number: mergedFormData.license_number,
        license_type: mergedFormData.license_type,
        license_issue_date: mergedFormData.license_issue_date,
        issuing_authority:
          mergedFormData.issuing_authority || mergedFormData.license_province,
        license_expiry_date: mergedFormData.license_expiry_date,
        vehicle_types: mergedFormData.vehicle_types,
        compliance_notes: JSON.stringify(additionalInfo),
      };

      if (mergedFormData.tenant_id) {
        submitData.tenant_id = mergedFormData.tenant_id;
      }

      if (mergedFormData.license_type === 'Other' && mergedFormData.license_other) {
        submitData.license_other = mergedFormData.license_other;
      }

      // Add file uploads
      if (mergedFormData.pcc_document) {
        submitData.pcc_document = mergedFormData.pcc_document;
      }
      if (mergedFormData.license_front_image) {
        submitData.license_front_image = mergedFormData.license_front_image;
      }
      if (mergedFormData.license_back_image) {
        submitData.license_back_image = mergedFormData.license_back_image;
      }
      if (mergedFormData.abstract_document) {
        submitData.abstract_document = mergedFormData.abstract_document;
      }
      if (mergedFormData.cvor_document) {
        submitData.cvor_document = mergedFormData.cvor_document;
      }
      if (mergedFormData.safety_certificate) {
        submitData.safety_certificate = mergedFormData.safety_certificate;
      }
      console.log('submitData', submitData);
      const response = await apiClient.registerDriver(submitData);

      setSuccess(true);
      toast.success(
        'Registration successful! Your application is pending approval.',
      );

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className='flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'>
      <SiteHeader />

      {/* Public-page hero: offset for the fixed header and consistent with the rest of the website. */}
      <section className='relative flex-shrink-0 overflow-hidden bg-gray-100 pb-20 pt-32 text-gray-950 lg:pb-24 lg:pt-40'>
        <div className='pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-white opacity-80 blur-[120px]' />
        <div className='pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[var(--accent-glow)] opacity-15 blur-[120px]' />
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.45]'
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px), linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className='relative mx-auto w-full max-w-[1600px] px-5 text-center lg:px-8'>
          <span className='inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur'>
            <Truck className='h-4 w-4 text-[var(--accent-glow)]' />
            Join our driving team
          </span>
          <h1 className='mx-auto mt-6 max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl'>
            Start Your{' '}
            <span className='text-[var(--accent-glow)]'>
              Driver Application
            </span>
          </h1>
          <p className='mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-gray-700 sm:text-lg'>
            {getHeroSubtitle(currentSection)} Complete the secure application
            below to take the next step in your driving career.
          </p>
        </div>
      </section>

      {/* Form Section - only this area scrolls; document body does not scroll */}
      <div className='flex-1'>
        <div className='container mx-auto px-4 py-12'>
          <div className='max-w-4xl mx-auto' data-form-container>
            <RegistrationProgress
              steps={REGISTRATION_STEPS}
              currentStep={currentSection}
              className='mb-8'
            />

            {success ? (
              <Card className='bg-white border-2 border-green-200 shadow-lg'>
                <CardContent className='pt-6'>
                  <div className='text-center py-12'>
                    <CheckCircle2 className='w-16 h-16 text-green-500 mx-auto mb-4' />
                    <h2 className='text-2xl font-bold text-[#111827] mb-2'>
                      Application Submitted Successfully!
                    </h2>
                    <p className='text-gray-600 mb-6'>
                      Your driver application has been submitted successfully.
                      Our team will review your application and get back to you
                      soon.
                    </p>
                    <p className='text-sm text-gray-500'>
                      Redirecting to login page...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <form
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
              >
                <Card className='bg-white border-2 border-gray-200 shadow-xl'>
                  <CardHeader className='bg-gradient-to-r from-[#111827] to-[#1f2937] text-white rounded-t-lg'>
                    <CardTitle className='text-2xl flex items-center gap-3'>
                      {currentSection === 1 && <User className='w-6 h-6' />}
                      {currentSection === 2 && <Home className='w-6 h-6' />}
                      {currentSection === 3 && <IdCard className='w-6 h-6' />}
                      {currentSection === 4 && <Truck className='w-6 h-6' />}
                      {currentSection === 5 && (
                        <Briefcase className='w-6 h-6' />
                      )}
                      {currentSection === 6 && <Shield className='w-6 h-6' />}
                      {currentSection === 7 && (
                        <ClipboardCheck className='w-6 h-6' />
                      )}
                      {currentSection === 8 && <Lock className='w-6 h-6' />}
                      {currentSection === 1 && 'About you'}
                      {currentSection === 2 && 'Your address'}
                      {currentSection === 3 && 'Licence details'}
                      {currentSection === 4 && 'Driving experience'}
                      {currentSection === 5 && 'Employment history'}
                      {currentSection === 6 && 'Documents & compliance'}
                      {currentSection === 7 && 'Review your application'}
                      {currentSection === 8 && 'Create your password'}
                    </CardTitle>
                    <CardDescription className='text-gray-300'>
                      {getCardDescription(currentSection)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className='p-8'>
                    {error && (
                      <Alert variant='destructive' className='mb-6'>
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className='animate-in fade-in duration-300'>
                      {currentSectionNode}
                    </div>

                    {/* Navigation Buttons                    </div>

                    {/* Navigation Buttons — sticky on small screens for thumb reach */}
                    <div className='sticky bottom-0 z-20 mt-8 flex items-center justify-between gap-3 bg-white/95 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:static md:bg-transparent md:py-0 md:pb-0 md:backdrop-blur-none'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={prevSection}
                        disabled={currentSection === 1 || isLoading}
                        className='border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-6'
                      >
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Previous
                      </Button>

                      {currentSection < totalSections ? (
                        <Button
                          type='button'
                          onClick={nextSection}
                          disabled={isLoading}
                          className='bg-[#D4AF37] hover:bg-[#B8962E] text-[#111827] font-semibold rounded-lg px-8'
                        >
                          Next
                          <ArrowRight className='ml-2 h-4 w-4' />
                        </Button>
                      ) : (
                        <Button
                          type='submit'
                          disabled={isLoading}
                          className='bg-[#111827] hover:bg-[#1f2937] text-white font-semibold rounded-lg px-8'
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className='mr-2 h-4 w-4' />
                              Submit Application
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

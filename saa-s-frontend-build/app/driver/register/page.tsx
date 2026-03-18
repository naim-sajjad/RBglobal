'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/web/Header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Upload,
  Truck,
  FileText,
  Shield,
  MapPin,
  ArrowRight,
  ArrowLeft,
  User,
  Home,
  IdCard,
  Briefcase,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function DriverRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    tenant_id: process.env.NEXT_PUBLIC_DEFAULT_TENANT,
    // Account Information
    email: '',
    password: '',
    confirmPassword: '',

    // Personal Information
    first_name: '',
    last_name: '',
    middle_initial: '',
    date_of_birth: '',
    work_eligibility_canada: '',
    education: '',
    medical_limitations: '',
    medical_limitations_explanation: '',

    // Current Address
    current_address: '',
    city: '',
    province: '',
    postal_code: '',
    cell_phone: '',

    // Previous Addresses (last 3 years)
    previous_address_1: '',
    previous_address_1_duration: '',
    previous_address_2: '',
    previous_address_2_duration: '',
    previous_address_3: '',
    previous_address_3_duration: '',

    // Driver's License Information
    license_number: '',
    license_province: '',
    license_class: '',
    license_type: '',
    license_other: '',
    license_expiry_date: '',
    license_endorsements: '',
    license_conditions: '',
    issuing_authority: '',

    // Additional Questions
    license_denied: '',
    privileges_revoked: '',
    dangerous_goods_certificate: '',

    // Driving Experience
    years_of_experience: '',
    driving_history: '',

    // Vehicle Information
    vehicle_types: [] as string[],
    vehicle_ownership: '',
    vehicle_capacity: '',

    // Route & Shift Details
    route_type: '',
    route_details: '',
    shift_timing: '',
    pay_type: '',

    // Driving Experience - Equipment
    equipment_used: [] as Array<{
      make: string;
      tractor_type: string;
      transmissions: string;
      trailer_type: string;
      areas_operated: string;
    }>,

    // Accident History
    ever_had_accidents: '',
    number_of_incidents: '',
    accident_explanation: '',

    // Traffic Violations
    traffic_violations: [] as Array<{
      date: string;
      location: string;
      violation_charge: string;
      penalty: string;
    }>,

    // Employment History
    current_employer: {
      company: '',
      supervisor: '',
      address: '',
      phone: '',
      position: '',
      start_date: '',
      end_date: '',
      reasons_for_leaving: '',
    },
    previous_employers: [] as Array<{
      company: string;
      supervisor: string;
      address: string;
      phone: string;
      position: string;
      start_date: string;
      end_date: string;
      reasons_for_leaving: string;
    }>,

    // Compliance Requirements
    medical_certificate: null as File | null,
    license_document: null as File | null,
    abstract_document: null as File | null,
    cvor_document: null as File | null,
    safety_certificate: null as File | null,
    drug_alcohol_test: false,
    compliance_notes: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const totalSections = 7;

  const vehicleTypeOptions = ['Truck', 'Van', 'Trailer', 'Reefer', 'Flatbed'];
  const licenseTypes = ['AZ', 'DZ', 'G-Class', 'G1/G2', 'Other'];
  const provinces = [
    'ON',
    'QC',
    'BC',
    'AB',
    'MB',
    'SK',
    'NS',
    'NB',
    'NL',
    'PE',
    'YT',
    'NT',
    'NU',
  ];
  const licenseClasses = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'G1',
    'G2',
    'M',
    'M1',
    'M2',
  ];

  // Validation helpers
  const VALIDATION = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    canadianPostalCode: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    canadianPhoneDigits: (s: string) =>
      s.replace(/\D/g, '').match(/^1?(\d{10})$/) ? true : false,
    minDriverAge: 18,
  };

  const isDateNotFuture = (dateStr: string): boolean => {
    if (!dateStr.trim()) return true;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d <= new Date();
  };

  const isDateNotPast = (dateStr: string): boolean => {
    if (!dateStr.trim()) return true;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(d.getTime()) && d >= today;
  };

  const getAge = (dateStr: string): number | null => {
    if (!dateStr.trim()) return null;
    const birth = new Date(dateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const isEndDateAfterStart = (startStr: string, endStr: string): boolean => {
    if (!startStr.trim() || !endStr.trim()) return true;
    const start = new Date(startStr);
    const end = new Date(endStr);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start;
  };

  // // Add equipment entry
  const addEquipmentEntry = () => {
    setFormData((prev) => ({
      ...prev,
      equipment_used: [
        ...prev.equipment_used,
        {
          make: '',
          tractor_type: '',
          transmissions: '',
          trailer_type: '',
          areas_operated: '',
        },
      ],
    }));
  };

  // // Remove equipment entry
  const removeEquipmentEntry = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipment_used: prev.equipment_used.filter((_, i) => i !== index),
    }));
  };

  // // Update equipment entry
  const updateEquipmentEntry = (
    index: number,
    field: string,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      equipment_used: prev.equipment_used.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  // // Add traffic violation
  const addTrafficViolation = () => {
    setFormData((prev) => ({
      ...prev,
      traffic_violations: [
        ...prev.traffic_violations,
        {
          date: '',
          location: '',
          violation_charge: '',
          penalty: '',
        },
      ],
    }));
  };

  // // Remove traffic violation
  const removeTrafficViolation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      traffic_violations: prev.traffic_violations.filter((_, i) => i !== index),
    }));
  };

  // // Update traffic violation
  const updateTrafficViolation = (
    index: number,
    field: string,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      traffic_violations: prev.traffic_violations.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  // // Add previous employer
  const addPreviousEmployer = () => {
    setFormData((prev) => ({
      ...prev,
      previous_employers: [
        ...prev.previous_employers,
        {
          company: '',
          supervisor: '',
          address: '',
          phone: '',
          position: '',
          start_date: '',
          end_date: '',
          reasons_for_leaving: '',
        },
      ],
    }));
  };

  // // Remove previous employer
  const removePreviousEmployer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      previous_employers: prev.previous_employers.filter((_, i) => i !== index),
    }));
  };

  // // Update previous employer
  const updatePreviousEmployer = (
    index: number,
    field: string,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      previous_employers: prev.previous_employers.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  // // Update current employer
  const updateCurrentEmployer = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      current_employer: {
        ...prev.current_employer,
        [field]: value,
      },
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFormData((prev) => ({ ...prev, [field]: e.target.files![0] }));
      }
    };

  const handleVehicleTypeToggle = (type: string) => {
    setFormData((prev) => {
      const types = prev.vehicle_types || [];
      if (types.includes(type)) {
        return { ...prev, vehicle_types: types.filter((t) => t !== type) };
      } else {
        return { ...prev, vehicle_types: [...types, type] };
      }
    });
  };

  // // Validation function for each section (section number and form data for reuse in submit)
  const validateSection = (
    section: number,
    data: typeof formData,
  ): { isValid: boolean; errorMessage: string } => {
    switch (section) {
      case 1: // Personal Information
        if (!data.first_name.trim()) {
          return { isValid: false, errorMessage: 'First name is required' };
        }
        if (data.first_name.trim().length < 2) {
          return {
            isValid: false,
            errorMessage: 'First name must be at least 2 characters',
          };
        }
        if (!/^[\p{L}\s\-'.]+$/u.test(data.first_name.trim())) {
          return {
            isValid: false,
            errorMessage:
              'First name can only contain letters, spaces, hyphens, or apostrophes',
          };
        }
        if (!data.last_name.trim()) {
          return { isValid: false, errorMessage: 'Last name is required' };
        }
        if (data.last_name.trim().length < 2) {
          return {
            isValid: false,
            errorMessage: 'Last name must be at least 2 characters',
          };
        }
        if (!/^[\p{L}\s\-'.]+$/u.test(data.last_name.trim())) {
          return {
            isValid: false,
            errorMessage:
              'Last name can only contain letters, spaces, hyphens, or apostrophes',
          };
        }
        if (data.middle_initial.trim().length > 1) {
          return {
            isValid: false,
            errorMessage: 'Middle initial must be one character or empty',
          };
        }
        if (!data.date_of_birth) {
          return { isValid: false, errorMessage: 'Date of birth is required' };
        }
        if (!isDateNotFuture(data.date_of_birth)) {
          return {
            isValid: false,
            errorMessage: 'Date of birth cannot be in the future',
          };
        }
        const age = getAge(data.date_of_birth);
        if (age !== null && age < VALIDATION.minDriverAge) {
          return {
            isValid: false,
            errorMessage: `Driver must be at least ${VALIDATION.minDriverAge} years old`,
          };
        }
        if (!data.work_eligibility_canada) {
          return {
            isValid: false,
            errorMessage:
              'Please indicate if you are legally entitled to work in Canada',
          };
        }
        if (!data.medical_limitations) {
          return {
            isValid: false,
            errorMessage: 'Please indicate if you have any medical limitations',
          };
        }
        if (
          data.medical_limitations === 'yes' &&
          !data.medical_limitations_explanation.trim()
        ) {
          return {
            isValid: false,
            errorMessage: 'Please explain your medical limitations',
          };
        }
        return { isValid: true, errorMessage: '' };

      case 2: // Address Information
        if (!data.current_address.trim()) {
          return {
            isValid: false,
            errorMessage: 'Current address is required',
          };
        }
        if (data.current_address.trim().length < 5) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid street address',
          };
        }
        if (!data.city.trim()) {
          return { isValid: false, errorMessage: 'City is required' };
        }
        if (data.city.trim().length < 2) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid city name',
          };
        }
        if (!data.province) {
          return { isValid: false, errorMessage: 'Province is required' };
        }
        if (!data.postal_code.trim()) {
          return { isValid: false, errorMessage: 'Postal code is required' };
        }
        const postalTrimmed = data.postal_code.replace(/\s/g, '');
        if (!VALIDATION.canadianPostalCode.test(postalTrimmed)) {
          return {
            isValid: false,
            errorMessage:
              'Please enter a valid Canadian postal code (e.g. A1A 1A1)',
          };
        }
        if (!data.cell_phone.trim()) {
          return {
            isValid: false,
            errorMessage: 'Cell phone number is required',
          };
        }
        if (!VALIDATION.canadianPhoneDigits(data.cell_phone)) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid 10-digit Canadian phone number',
          };
        }
        return { isValid: true, errorMessage: '' };

      case 3: // Driver's License Information
        if (!data.license_number.trim()) {
          return { isValid: false, errorMessage: 'License number is required' };
        }
        if (data.license_number.trim().length < 5) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid license number',
          };
        }
        if (!data.license_province) {
          return {
            isValid: false,
            errorMessage: 'License province is required',
          };
        }
        if (!data.license_class) {
          return { isValid: false, errorMessage: 'License class is required' };
        }
        if (!data.license_expiry_date) {
          return {
            isValid: false,
            errorMessage: 'License expiry date is required',
          };
        }
        if (!isDateNotPast(data.license_expiry_date)) {
          return {
            isValid: false,
            errorMessage: 'License expiry date cannot be in the past',
          };
        }
        if (!data.license_document) {
          return {
            isValid: false,
            errorMessage: 'License document upload is required',
          };
        }
        if (!data.license_denied) {
          return {
            isValid: false,
            errorMessage:
              'Please answer if you have ever been denied a license',
          };
        }
        if (!data.privileges_revoked) {
          return {
            isValid: false,
            errorMessage:
              'Please answer if your driving privileges have been revoked',
          };
        }
        if (!data.dangerous_goods_certificate) {
          return {
            isValid: false,
            errorMessage:
              'Please indicate if you have a dangerous goods certificate',
          };
        }
        return { isValid: true, errorMessage: '' };

      case 4: // Driving Experience & Vehicle
        if (
          !data.years_of_experience ||
          parseInt(data.years_of_experience) < 0
        ) {
          return {
            isValid: false,
            errorMessage: 'Years of experience is required',
          };
        }
        if (!data.vehicle_ownership) {
          return {
            isValid: false,
            errorMessage: 'Vehicle ownership is required',
          };
        }
        if (!data.vehicle_types || data.vehicle_types.length === 0) {
          return {
            isValid: false,
            errorMessage: 'Please select at least one vehicle type',
          };
        }
        if (!data.ever_had_accidents) {
          return {
            isValid: false,
            errorMessage: 'Please indicate if you have ever had accidents',
          };
        }
        if (data.ever_had_accidents === 'yes') {
          if (
            !data.number_of_incidents ||
            parseInt(data.number_of_incidents) < 0
          ) {
            return {
              isValid: false,
              errorMessage:
                'Number of incidents is required when you have had accidents',
            };
          }
          if (!data.accident_explanation.trim()) {
            return {
              isValid: false,
              errorMessage:
                'Accident explanation is required when you have had accidents',
            };
          }
        }
        return { isValid: true, errorMessage: '' };

      case 5: // Employment History
        if (!data.current_employer.company.trim()) {
          return {
            isValid: false,
            errorMessage: 'Current employer company is required',
          };
        }
        if (data.current_employer.company.trim().length < 2) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid company name',
          };
        }
        if (!data.current_employer.address.trim()) {
          return {
            isValid: false,
            errorMessage: 'Current employer address is required',
          };
        }
        if (!data.current_employer.position.trim()) {
          return {
            isValid: false,
            errorMessage: 'Current employer position is required',
          };
        }
        if (!data.current_employer.start_date.trim()) {
          return {
            isValid: false,
            errorMessage: 'Current employer start date is required',
          };
        }
        if (
          data.current_employer.phone.trim() &&
          !VALIDATION.canadianPhoneDigits(data.current_employer.phone)
        ) {
          return {
            isValid: false,
            errorMessage:
              'Please enter a valid 10-digit phone number for current employer',
          };
        }
        // Validate previous employers
        for (let i = 0; i < data.previous_employers.length; i++) {
          const emp = data.previous_employers[i];
          if (!emp.company.trim()) {
            return {
              isValid: false,
              errorMessage: `Previous employer ${i + 1}: Company is required`,
            };
          }
          if (emp.company.trim().length < 2) {
            return {
              isValid: false,
              errorMessage: `Previous employer ${i + 1}: Please enter a valid company name`,
            };
          }
          if (!emp.address.trim()) {
            return {
              isValid: false,
              errorMessage: `Previous employer ${i + 1}: Address is required`,
            };
          }
          if (!emp.position.trim()) {
            return {
              isValid: false,
              errorMessage: `Previous employer ${i + 1}: Position is required`,
            };
          }
          if (!emp.start_date.trim()) {
            return {
              isValid: false,
              errorMessage: `Previous employer ${i + 1}: Start date is required`,
            };
          }
          if (!emp.end_date.trim()) {
            return {
              isValid: false,
              errorMessage: `Previous employer ${i + 1}: End date is required`,
            };
          }
          if (emp.phone.trim() && !VALIDATION.canadianPhoneDigits(emp.phone)) {
            return {
              isValid: false,
              errorMessage: `Previous employer ${i + 1}: Please enter a valid 10-digit phone number`,
            };
          }
        }
        return { isValid: true, errorMessage: '' };

      case 6: // Compliance Requirements
        if (!data.medical_certificate) {
          return {
            isValid: false,
            errorMessage: 'Medical certificate upload is required',
          };
        }
        if (!data.drug_alcohol_test) {
          return {
            isValid: false,
            errorMessage:
              'Please confirm that you have completed the Drug & Alcohol Test',
          };
        }
        return { isValid: true, errorMessage: '' };

      case 7: // Account Information
        if (!data.email.trim()) {
          return { isValid: false, errorMessage: 'Email address is required' };
        }
        if (!VALIDATION.email.test(data.email.trim())) {
          return {
            isValid: false,
            errorMessage: 'Please enter a valid email address',
          };
        }
        if (data.email.trim().length > 254) {
          return {
            isValid: false,
            errorMessage: 'Email address is too long',
          };
        }
        if (!data.password) {
          return { isValid: false, errorMessage: 'Password is required' };
        }
        if (data.password.length < 8) {
          return {
            isValid: false,
            errorMessage: 'Password must be at least 8 characters long',
          };
        }
        if (data.password.length > 128) {
          return {
            isValid: false,
            errorMessage: 'Password is too long',
          };
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])/.test(data.password)) {
          return {
            isValid: false,
            errorMessage:
              'Password must contain at least one uppercase and one lowercase letter',
          };
        }
        if (!/\d/.test(data.password)) {
          return {
            isValid: false,
            errorMessage: 'Password must contain at least one number',
          };
        }
        if (!data.confirmPassword) {
          return {
            isValid: false,
            errorMessage: 'Please confirm your password',
          };
        }
        if (data.password !== data.confirmPassword) {
          return { isValid: false, errorMessage: 'Passwords do not match' };
        }
        return { isValid: true, errorMessage: '' };

      default:
        return { isValid: true, errorMessage: '' };
    }
  };

  const validateCurrentSection = (): {
    isValid: boolean;
    errorMessage: string;
  } => validateSection(currentSection, formData);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate all sections before submit
    for (let s = 1; s <= totalSections; s++) {
      const result = validateSection(s, formData);
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
        `${formData.first_name} ${formData.middle_initial ? formData.middle_initial + '. ' : ''}${formData.last_name}`.trim();

      // Combine all additional information into compliance_notes
      const additionalInfo = {
        personal: {
          middle_initial: formData.middle_initial,
          date_of_birth: formData.date_of_birth,
          work_eligibility_canada: formData.work_eligibility_canada,
          education: formData.education,
          medical_limitations: formData.medical_limitations,
          medical_limitations_explanation:
            formData.medical_limitations_explanation,
        },
        address: {
          current_address: formData.current_address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          cell_phone: formData.cell_phone,
          previous_addresses: [
            {
              address: formData.previous_address_1,
              duration: formData.previous_address_1_duration,
            },
            {
              address: formData.previous_address_2,
              duration: formData.previous_address_2_duration,
            },
            {
              address: formData.previous_address_3,
              duration: formData.previous_address_3_duration,
            },
          ].filter((addr) => addr.address),
        },
        license: {
          license_province: formData.license_province,
          license_class: formData.license_class,
          license_endorsements: formData.license_endorsements,
          license_conditions: formData.license_conditions,
        },
        questions: {
          license_denied: formData.license_denied,
          privileges_revoked: formData.privileges_revoked,
          dangerous_goods_certificate: formData.dangerous_goods_certificate,
        },
        driving_experience: {
          equipment_used: formData.equipment_used,
          accident_history: {
            ever_had_accidents: formData.ever_had_accidents,
            number_of_incidents: formData.number_of_incidents,
            accident_explanation: formData.accident_explanation,
          },
          traffic_violations: formData.traffic_violations,
        },
        employment_history: {
          current_employer: formData.current_employer,
          previous_employers: formData.previous_employers,
        },
        existing_notes: formData.compliance_notes,
      };

      const submitData: any = {
        name: fullName,
        email: formData.email,
        password: formData.password,
        license_number: formData.license_number,
        license_type: formData.license_type,
        issuing_authority:
          formData.issuing_authority || formData.license_province,
        license_expiry_date: formData.license_expiry_date,
        years_of_experience: formData.years_of_experience
          ? parseInt(formData.years_of_experience)
          : 0,
        driving_history: formData.driving_history,
        vehicle_types: formData.vehicle_types,
        vehicle_ownership: formData.vehicle_ownership,
        vehicle_capacity: formData.vehicle_capacity,
        route_type: formData.route_type,
        route_details: formData.route_details,
        shift_timing: formData.shift_timing,
        pay_type: formData.pay_type,
        drug_alcohol_test: formData.drug_alcohol_test,
        compliance_notes: JSON.stringify(additionalInfo),
      };

      if (formData.tenant_id) {
        submitData.tenant_id = formData.tenant_id;
      }

      if (formData.license_type === 'Other' && formData.license_other) {
        submitData.license_other = formData.license_other;
      }

      // Add file uploads
      if (formData.medical_certificate) {
        submitData.medical_certificate = formData.medical_certificate;
      }
      if (formData.license_document) {
        submitData.license_document = formData.license_document;
      }
      if (formData.abstract_document) {
        submitData.abstract_document = formData.abstract_document;
      }
      if (formData.cvor_document) {
        submitData.cvor_document = formData.cvor_document;
      }
      if (formData.safety_certificate) {
        submitData.safety_certificate = formData.safety_certificate;
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

  const DocumentUploadField = ({
    label,
    field,
    accept = '.pdf,.jpg,.jpeg,.png',
    required = false,
  }: {
    label: string;
    field: keyof typeof formData;
    accept?: string;
    required?: boolean;
  }) => {
    const file = formData[field] as File | null;
    return (
      <div className='space-y-2'>
        <Label className='text-[#111827] font-medium'>
          {label} {required && <span className='text-red-500'>*</span>}
        </Label>
        <div className='flex items-center gap-4'>
          <Input
            type='file'
            accept={accept}
            onChange={handleFileChange(field)}
            className='flex-1 bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
          />
          {file && (
            <span className='text-sm text-gray-600 flex items-center gap-2'>
              <FileText className='w-4 h-4' />
              {file.name}
            </span>
          )}
        </div>
        <p className='text-xs text-gray-500'>
          Accepted formats: PDF, JPG, PNG (Max 5MB)
        </p>
      </div>
    );
  };

  const YesNoRadio = ({
    name,
    label,
    value,
    onChange,
    required = false,
  }: {
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
  }) => {
    return (
      <div className='space-y-3'>
        <Label className='text-[#111827] font-medium'>
          {label} {required && <span className='text-red-500'>*</span>}
        </Label>
        <RadioGroup
          value={value}
          onValueChange={onChange}
          className='flex gap-6'
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='yes' id={`${name}-yes`} />
            <Label
              htmlFor={`${name}-yes`}
              className='font-normal cursor-pointer'
            >
              Yes
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='no' id={`${name}-no`} />
            <Label
              htmlFor={`${name}-no`}
              className='font-normal cursor-pointer'
            >
              No
            </Label>
          </div>
        </RadioGroup>
      </div>
    );
  };

  return (
    <main className='flex flex-col bg-gradient-to-br from-gray-50 to-gray-100'>
      <Header />

      {/* Hero Section - fixed at top */}
      <div className='flex-shrink-0 bg-gradient-to-r from-[#111827] to-[#1f2937] text-white py-16'>
        <div className='container mx-auto px-4'>
          <div className='max-w-3xl mx-auto text-center'>
            <div className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D4AF37] mb-6'>
              <Truck className='w-10 h-10 text-[#111827]' />
            </div>
            <h1 className='text-4xl md:text-5xl font-bold mb-4'>
              Driver Application Form
            </h1>
            <p className='text-xl text-gray-300'>
              Complete all sections to submit your driver application
            </p>
          </div>
        </div>
      </div>

      {/* Form Section - only this area scrolls; document body does not scroll */}
      <div className='flex-1'>
        <div className='container mx-auto px-4 py-12'>
          <div className='max-w-4xl mx-auto' data-form-container>
            {/* Progress Bar */}
            <div className='mb-8'>
              <div className='flex items-center justify-between mb-4'>
                {[1, 2, 3, 4, 5, 6, 7].map((section) => (
                  <div key={section} className='flex items-center flex-1'>
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                        currentSection >= section
                          ? 'bg-[#D4AF37] text-[#111827]'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {section}
                    </div>
                    {section < 7 && (
                      <div
                        className={`flex-1 h-1 mx-2 transition-all ${
                          currentSection > section
                            ? 'bg-[#D4AF37]'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className='text-center'>
                <p className='text-sm text-gray-600'>
                  Step {currentSection} of {totalSections}
                </p>
              </div>
            </div>

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
                      {currentSection === 7 && <FileText className='w-6 h-6' />}
                      {currentSection === 1 &&
                        'Section 1: Personal Information'}
                      {currentSection === 2 && 'Section 2: Address Information'}
                      {currentSection === 3 &&
                        "Section 3: Driver's License Information"}
                      {currentSection === 4 &&
                        'Section 4: Driving Experience & Vehicle'}
                      {currentSection === 5 && 'Section 5: Employment History'}
                      {currentSection === 6 &&
                        'Section 6: Compliance Requirements'}
                      {currentSection === 7 && 'Section 7: Account Information'}
                    </CardTitle>
                    <CardDescription className='text-gray-300'>
                      Please fill in all required fields marked with *
                    </CardDescription>
                  </CardHeader>

                  <CardContent className='p-8'>
                    {error && (
                      <Alert variant='destructive' className='mb-6'>
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Section 1: Personal Information */}
                    {currentSection === 1 && (
                      <div className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              First Name <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              name='first_name'
                              value={formData.first_name}
                              onChange={handleChange}
                              required
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Enter first name'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Middle Initial
                            </Label>
                            <Input
                              name='middle_initial'
                              value={formData.middle_initial}
                              onChange={handleChange}
                              maxLength={1}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='M'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Last Name <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              name='last_name'
                              value={formData.last_name}
                              onChange={handleChange}
                              required
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Enter last name'
                            />
                          </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Date of Birth (D/M/Y){' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              type='date'
                              name='date_of_birth'
                              value={formData.date_of_birth}
                              onChange={handleChange}
                              required
                              max={new Date().toISOString().slice(0, 10)}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Certification or Education
                            </Label>
                            <Input
                              name='education'
                              value={formData.education}
                              onChange={handleChange}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='e.g., Post graduate diploma'
                            />
                          </div>
                        </div>

                        <YesNoRadio
                          name='work_eligibility'
                          label='Are you legally entitled to work in Canada?'
                          value={formData.work_eligibility_canada}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              work_eligibility_canada: value,
                            }))
                          }
                          required
                        />

                        <YesNoRadio
                          name='medical_limitations'
                          label='Do you have any physical difficulties or medical limitation that might stop you from performing the position of a truck driver?'
                          value={formData.medical_limitations}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              medical_limitations: value,
                            }))
                          }
                          required
                        />

                        {formData.medical_limitations === 'yes' && (
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              If Yes, please explain{' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Textarea
                              name='medical_limitations_explanation'
                              value={formData.medical_limitations_explanation}
                              onChange={handleChange}
                              rows={3}
                              required={formData.medical_limitations === 'yes'}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Please provide details...'
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section 2: Address Information */}
                    {currentSection === 2 && (
                      <div className='space-y-6'>
                        <div className='space-y-4'>
                          <h3 className='text-lg font-semibold text-[#111827] border-b pb-2'>
                            Current Address
                          </h3>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Street Address{' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              name='current_address'
                              value={formData.current_address}
                              onChange={handleChange}
                              required
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Enter street address'
                            />
                          </div>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                City <span className='text-red-500'>*</span>
                              </Label>
                              <Input
                                name='city'
                                value={formData.city}
                                onChange={handleChange}
                                required
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='Enter city'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                Province <span className='text-red-500'>*</span>
                              </Label>
                              <Select
                                value={formData.province}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    province: value,
                                  }))
                                }
                              >
                                <SelectTrigger className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'>
                                  <SelectValue placeholder='Select province' />
                                </SelectTrigger>
                                <SelectContent>
                                  {provinces.map((prov) => (
                                    <SelectItem key={prov} value={prov}>
                                      {prov}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                Postal Code{' '}
                                <span className='text-red-500'>*</span>
                              </Label>
                              <Input
                                name='postal_code'
                                value={formData.postal_code}
                                onChange={handleChange}
                                required
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='A1A 1A1'
                              />
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Cell Phone Number{' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              name='cell_phone'
                              value={formData.cell_phone}
                              onChange={handleChange}
                              required
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='2266984424'
                            />
                          </div>
                        </div>

                        <div className='space-y-4 pt-4 border-t'>
                          <h3 className='text-lg font-semibold text-[#111827] border-b pb-2'>
                            Previous Addresses (Past 3 Years)
                          </h3>
                          {[1, 2, 3].map((num) => (
                            <div
                              key={num}
                              className='space-y-3 p-4 bg-gray-50 rounded-lg'
                            >
                              <div className='space-y-2'>
                                <Label className='text-[#111827] font-medium'>
                                  Address {num}
                                </Label>
                                <Input
                                  name={`previous_address_${num}`}
                                  value={
                                    formData[
                                      `previous_address_${num}` as keyof typeof formData
                                    ] as string
                                  }
                                  onChange={handleChange}
                                  className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                  placeholder='Enter address'
                                />
                              </div>
                              <div className='space-y-2'>
                                <Label className='text-[#111827] font-medium'>
                                  How long?
                                </Label>
                                <Input
                                  name={`previous_address_${num}_duration`}
                                  value={
                                    formData[
                                      `previous_address_${num}_duration` as keyof typeof formData
                                    ] as string
                                  }
                                  onChange={handleChange}
                                  className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                  placeholder='e.g., 2.5 years'
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Driver's License Information */}
                    {currentSection === 3 && (
                      <div className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              License Number{' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              name='license_number'
                              value={formData.license_number}
                              onChange={handleChange}
                              required
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='B0928-65700-40116'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Province <span className='text-red-500'>*</span>
                            </Label>
                            <Select
                              value={formData.license_province}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  license_province: value,
                                }))
                              }
                            >
                              <SelectTrigger className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'>
                                <SelectValue placeholder='Select province' />
                              </SelectTrigger>
                              <SelectContent>
                                {provinces.map((prov) => (
                                  <SelectItem key={prov} value={prov}>
                                    {prov}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Class <span className='text-red-500'>*</span>
                            </Label>
                            <Select
                              value={formData.license_class}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  license_class: value,
                                }))
                              }
                            >
                              <SelectTrigger className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'>
                                <SelectValue placeholder='Select class' />
                              </SelectTrigger>
                              <SelectContent>
                                {licenseClasses.map((cls) => (
                                  <SelectItem key={cls} value={cls}>
                                    {cls}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              License Type
                            </Label>
                            <Select
                              value={formData.license_type}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  license_type: value,
                                }))
                              }
                            >
                              <SelectTrigger className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'>
                                <SelectValue placeholder='Select license type' />
                              </SelectTrigger>
                              <SelectContent>
                                {licenseTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {formData.license_type === 'Other' && (
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Specify License Type
                            </Label>
                            <Input
                              name='license_other'
                              value={formData.license_other}
                              onChange={handleChange}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Enter license type'
                            />
                          </div>
                        )}

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Expiry Date{' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              type='date'
                              name='license_expiry_date'
                              value={formData.license_expiry_date}
                              onChange={handleChange}
                              required
                              min={new Date().toISOString().slice(0, 10)}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Issuing Authority
                            </Label>
                            <Input
                              name='issuing_authority'
                              value={formData.issuing_authority}
                              onChange={handleChange}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='e.g., Ontario Ministry of Transportation'
                            />
                          </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Endorsements
                            </Label>
                            <Input
                              name='license_endorsements'
                              value={formData.license_endorsements}
                              onChange={handleChange}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='e.g., Air brake'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Conditions
                            </Label>
                            <Input
                              name='license_conditions'
                              value={formData.license_conditions}
                              onChange={handleChange}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Enter conditions if any'
                            />
                          </div>
                        </div>

                        <DocumentUploadField
                          label='License Document'
                          field='license_document'
                          required
                        />

                        <YesNoRadio
                          name='license_denied'
                          label='Have you ever been denied a license or permit to operate a vehicle?'
                          value={formData.license_denied}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              license_denied: value,
                            }))
                          }
                          required
                        />

                        <YesNoRadio
                          name='privileges_revoked'
                          label='Have you ever had your driving privileges revoked or suspended?'
                          value={formData.privileges_revoked}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              privileges_revoked: value,
                            }))
                          }
                          required
                        />

                        <YesNoRadio
                          name='dangerous_goods'
                          label='Do you have a dangerous good certificate?'
                          value={formData.dangerous_goods_certificate}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              dangerous_goods_certificate: value,
                            }))
                          }
                          required
                        />
                      </div>
                    )}

                    {/* Section 4: Driving Experience & Vehicle */}
                    {currentSection === 4 && (
                      <div className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Years of Experience{' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              type='number'
                              name='years_of_experience'
                              value={formData.years_of_experience}
                              onChange={handleChange}
                              required
                              min='0'
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Enter years'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Vehicle Ownership{' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Select
                              value={formData.vehicle_ownership}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  vehicle_ownership: value,
                                }))
                              }
                            >
                              <SelectTrigger className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'>
                                <SelectValue placeholder='Select ownership' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='company-owned'>
                                  Company Owned
                                </SelectItem>
                                <SelectItem value='self-owned'>
                                  Self Owned
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-[#111827] font-medium'>
                            Vehicle Types{' '}
                            <span className='text-red-500'>*</span>
                          </Label>
                          <div className='flex flex-wrap gap-3'>
                            {vehicleTypeOptions.map((type) => (
                              <button
                                key={type}
                                type='button'
                                onClick={() => handleVehicleTypeToggle(type)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                  formData.vehicle_types.includes(type)
                                    ? 'bg-[#D4AF37] text-[#111827] border-2 border-[#D4AF37]'
                                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#D4AF37]'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-[#111827] font-medium'>
                            Vehicle Capacity
                          </Label>
                          <Input
                            name='vehicle_capacity'
                            value={formData.vehicle_capacity}
                            onChange={handleChange}
                            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                            placeholder='e.g., 26,000 lbs'
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-[#111827] font-medium'>
                            Driving History
                          </Label>
                          <Textarea
                            name='driving_history'
                            value={formData.driving_history}
                            onChange={handleChange}
                            rows={4}
                            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                            placeholder='Describe your driving history, previous employers, etc.'
                          />
                        </div>

                        {/* Equipment Used During the Last 5 Years */}
                        <div className='space-y-4 pt-6 border-t border-gray-200'>
                          <div className='flex items-center justify-between'>
                            <h3 className='text-lg font-semibold text-[#111827]'>
                              Equipment Used During the Last 5 Years
                            </h3>
                            <Button
                              type='button'
                              onClick={addEquipmentEntry}
                              variant='outline'
                              className='border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
                            >
                              <Upload className='w-4 h-4 mr-2' />
                              Add Equipment
                            </Button>
                          </div>
                          {formData.equipment_used.length === 0 ? (
                            <p className='text-sm text-gray-500 italic'>
                              No equipment entries yet. Click "Add Equipment" to
                              add one.
                            </p>
                          ) : (
                            <div className='space-y-4'>
                              {formData.equipment_used.map(
                                (equipment, index) => (
                                  <div
                                    key={index}
                                    className='p-4 bg-gray-50 rounded-lg border border-gray-200'
                                  >
                                    <div className='flex items-center justify-between mb-4'>
                                      <h4 className='font-medium text-[#111827]'>
                                        Equipment Entry {index + 1}
                                      </h4>
                                      <Button
                                        type='button'
                                        onClick={() =>
                                          removeEquipmentEntry(index)
                                        }
                                        variant='ghost'
                                        size='sm'
                                        className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                      >
                                        <X className='w-4 h-4 mr-1' />
                                        Remove
                                      </Button>
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>Make</Label>
                                        <Input
                                          value={equipment.make}
                                          onChange={(e) =>
                                            updateEquipmentEntry(
                                              index,
                                              'make',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., Volvo'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>
                                          Tractor Type
                                        </Label>
                                        <Input
                                          value={equipment.tractor_type}
                                          onChange={(e) =>
                                            updateEquipmentEntry(
                                              index,
                                              'tractor_type',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., Sleeper'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>
                                          Transmissions
                                        </Label>
                                        <Input
                                          value={equipment.transmissions}
                                          onChange={(e) =>
                                            updateEquipmentEntry(
                                              index,
                                              'transmissions',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., Automatic'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>
                                          Trailer Type
                                        </Label>
                                        <Input
                                          value={equipment.trailer_type}
                                          onChange={(e) =>
                                            updateEquipmentEntry(
                                              index,
                                              'trailer_type',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., Flatbed (3 axle)'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>
                                          Areas Operated
                                        </Label>
                                        <Input
                                          value={equipment.areas_operated}
                                          onChange={(e) =>
                                            updateEquipmentEntry(
                                              index,
                                              'areas_operated',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., Canada'
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>

                        {/* Accident History */}
                        <div className='space-y-4 pt-6 border-t border-gray-200'>
                          <h3 className='text-lg font-semibold text-[#111827]'>
                            Accident History
                          </h3>
                          <YesNoRadio
                            name='ever_had_accidents'
                            label='Ever had accidents?'
                            value={formData.ever_had_accidents}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                ever_had_accidents: value,
                              }))
                            }
                            required
                          />
                          {formData.ever_had_accidents === 'yes' && (
                            <>
                              <div className='space-y-2'>
                                <Label className='text-[#111827] font-medium'>
                                  Number of incidents{' '}
                                  <span className='text-red-500'>*</span>
                                </Label>
                                <Input
                                  type='number'
                                  name='number_of_incidents'
                                  value={formData.number_of_incidents}
                                  onChange={handleChange}
                                  required={
                                    formData.ever_had_accidents === 'yes'
                                  }
                                  min='0'
                                  className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                  placeholder='Enter number'
                                />
                              </div>
                              <div className='space-y-2'>
                                <Label className='text-[#111827] font-medium'>
                                  If Yes, please explain{' '}
                                  <span className='text-red-500'>*</span>
                                </Label>
                                <Textarea
                                  name='accident_explanation'
                                  value={formData.accident_explanation}
                                  onChange={handleChange}
                                  rows={4}
                                  required={
                                    formData.ever_had_accidents === 'yes'
                                  }
                                  className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                  placeholder='Please provide details about the accidents...'
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Traffic Violations */}
                        <div className='space-y-4 pt-6 border-t border-gray-200'>
                          <div className='flex items-center justify-between'>
                            <h3 className='text-lg font-semibold text-[#111827]'>
                              Last 3 Years History of Traffic Violations and
                              Convictions
                            </h3>
                            <Button
                              type='button'
                              onClick={addTrafficViolation}
                              variant='outline'
                              className='border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
                            >
                              <Upload className='w-4 h-4 mr-2' />
                              Add Violation
                            </Button>
                          </div>
                          {formData.traffic_violations.length === 0 ? (
                            <p className='text-sm text-gray-500 italic'>
                              No violations recorded. Click "Add Violation" if
                              applicable.
                            </p>
                          ) : (
                            <div className='space-y-4'>
                              {formData.traffic_violations.map(
                                (violation, index) => (
                                  <div
                                    key={index}
                                    className='p-4 bg-gray-50 rounded-lg border border-gray-200'
                                  >
                                    <div className='flex items-center justify-between mb-4'>
                                      <h4 className='font-medium text-[#111827]'>
                                        Violation {index + 1}
                                      </h4>
                                      <Button
                                        type='button'
                                        onClick={() =>
                                          removeTrafficViolation(index)
                                        }
                                        variant='ghost'
                                        size='sm'
                                        className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                      >
                                        <X className='w-4 h-4 mr-1' />
                                        Remove
                                      </Button>
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>Date</Label>
                                        <Input
                                          type='date'
                                          value={violation.date}
                                          onChange={(e) =>
                                            updateTrafficViolation(
                                              index,
                                              'date',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>
                                          Location
                                        </Label>
                                        <Input
                                          value={violation.location}
                                          onChange={(e) =>
                                            updateTrafficViolation(
                                              index,
                                              'location',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='Enter location'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>
                                          Violation/Charge
                                        </Label>
                                        <Input
                                          value={violation.violation_charge}
                                          onChange={(e) =>
                                            updateTrafficViolation(
                                              index,
                                              'violation_charge',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='Enter violation'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm'>
                                          Penalty
                                        </Label>
                                        <Input
                                          value={violation.penalty}
                                          onChange={(e) =>
                                            updateTrafficViolation(
                                              index,
                                              'penalty',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='Enter penalty'
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Route Type
                            </Label>
                            <Select
                              value={formData.route_type}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  route_type: value,
                                }))
                              }
                            >
                              <SelectTrigger className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'>
                                <SelectValue placeholder='Select route type' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='local'>Local</SelectItem>
                                <SelectItem value='regional'>
                                  Regional
                                </SelectItem>
                                <SelectItem value='long-haul'>
                                  Long Haul
                                </SelectItem>
                                <SelectItem value='intercity'>
                                  Intercity
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Shift Timing
                            </Label>
                            <Select
                              value={formData.shift_timing}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  shift_timing: value,
                                }))
                              }
                            >
                              <SelectTrigger className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'>
                                <SelectValue placeholder='Select shift' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='day'>Day</SelectItem>
                                <SelectItem value='night'>Night</SelectItem>
                                <SelectItem value='rotational'>
                                  Rotational
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-[#111827] font-medium'>
                            Pay Type
                          </Label>
                          <Select
                            value={formData.pay_type}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                pay_type: value,
                              }))
                            }
                          >
                            <SelectTrigger className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'>
                              <SelectValue placeholder='Select pay type' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='hourly'>Hourly</SelectItem>
                              <SelectItem value='per_mile'>Per Mile</SelectItem>
                              <SelectItem value='per_trip'>Per Trip</SelectItem>
                              <SelectItem value='fixed_salary'>
                                Fixed Salary
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-[#111827] font-medium'>
                            Route Details
                          </Label>
                          <Textarea
                            name='route_details'
                            value={formData.route_details}
                            onChange={handleChange}
                            rows={4}
                            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                            placeholder='Describe preferred routes, areas of operation, etc.'
                          />
                        </div>
                      </div>
                    )}

                    {/* Section 5: Employment History */}
                    {currentSection === 5 && (
                      <div className='space-y-6'>
                        {/* Current/Most Recent Employer */}
                        <div className='space-y-4'>
                          <h3 className='text-lg font-semibold text-[#111827] border-b pb-2'>
                            Current/Most Recent Employer
                          </h3>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                Company <span className='text-red-500'>*</span>
                              </Label>
                              <Input
                                value={formData.current_employer.company}
                                onChange={(e) =>
                                  updateCurrentEmployer(
                                    'company',
                                    e.target.value,
                                  )
                                }
                                required
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='e.g., Go Logistics'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                Supervisor
                              </Label>
                              <Input
                                value={formData.current_employer.supervisor}
                                onChange={(e) =>
                                  updateCurrentEmployer(
                                    'supervisor',
                                    e.target.value,
                                  )
                                }
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='e.g., Rajwinder Singh'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                Address <span className='text-red-500'>*</span>
                              </Label>
                              <Input
                                value={formData.current_employer.address}
                                onChange={(e) =>
                                  updateCurrentEmployer(
                                    'address',
                                    e.target.value,
                                  )
                                }
                                required
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='e.g., Oakville, ON'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                Phone
                              </Label>
                              <Input
                                value={formData.current_employer.phone}
                                onChange={(e) =>
                                  updateCurrentEmployer('phone', e.target.value)
                                }
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='e.g., 437-799-6534'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                Position <span className='text-red-500'>*</span>
                              </Label>
                              <Input
                                value={formData.current_employer.position}
                                onChange={(e) =>
                                  updateCurrentEmployer(
                                    'position',
                                    e.target.value,
                                  )
                                }
                                required
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='e.g., Straight Truck Driver'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                Start Date{' '}
                                <span className='text-red-500'>*</span>
                              </Label>
                              <Input
                                value={formData.current_employer.start_date}
                                onChange={(e) =>
                                  updateCurrentEmployer(
                                    'start_date',
                                    e.target.value,
                                  )
                                }
                                required
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='e.g., October 2025'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label className='text-[#111827] font-medium'>
                                End Date
                              </Label>
                              <Input
                                value={formData.current_employer.end_date}
                                onChange={(e) =>
                                  updateCurrentEmployer(
                                    'end_date',
                                    e.target.value,
                                  )
                                }
                                className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                placeholder='e.g., Present'
                              />
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Reasons for Leaving
                            </Label>
                            <Textarea
                              value={
                                formData.current_employer.reasons_for_leaving
                              }
                              onChange={(e) =>
                                updateCurrentEmployer(
                                  'reasons_for_leaving',
                                  e.target.value,
                                )
                              }
                              rows={3}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Enter reasons for leaving...'
                            />
                          </div>
                        </div>

                        {/* Previous Employers */}
                        <div className='space-y-4 pt-6 border-t border-gray-200'>
                          <div className='flex items-center justify-between'>
                            <h3 className='text-lg font-semibold text-[#111827]'>
                              Previous Employers (Last 10 Years)
                            </h3>
                            <Button
                              type='button'
                              onClick={addPreviousEmployer}
                              variant='outline'
                              className='border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
                            >
                              <Upload className='w-4 h-4 mr-2' />
                              Add Previous Employer
                            </Button>
                          </div>
                          {formData.previous_employers.length === 0 ? (
                            <p className='text-sm text-gray-500 italic'>
                              No previous employers added. Click "Add Previous
                              Employer" to add one.
                            </p>
                          ) : (
                            <div className='space-y-6'>
                              {formData.previous_employers.map(
                                (employer, index) => (
                                  <div
                                    key={index}
                                    className='p-6 bg-gray-50 rounded-lg border border-gray-200'
                                  >
                                    <div className='flex items-center justify-between mb-4'>
                                      <h4 className='font-semibold text-[#111827]'>
                                        Previous Employer {index + 1}
                                      </h4>
                                      <Button
                                        type='button'
                                        onClick={() =>
                                          removePreviousEmployer(index)
                                        }
                                        variant='ghost'
                                        size='sm'
                                        className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                      >
                                        <X className='w-4 h-4 mr-1' />
                                        Remove
                                      </Button>
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                      <div className='space-y-2'>
                                        <Label className='text-sm font-medium'>
                                          Company{' '}
                                          <span className='text-red-500'>
                                            *
                                          </span>
                                        </Label>
                                        <Input
                                          value={employer.company}
                                          onChange={(e) =>
                                            updatePreviousEmployer(
                                              index,
                                              'company',
                                              e.target.value,
                                            )
                                          }
                                          required
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., UPS'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm font-medium'>
                                          Supervisor
                                        </Label>
                                        <Input
                                          value={employer.supervisor}
                                          onChange={(e) =>
                                            updatePreviousEmployer(
                                              index,
                                              'supervisor',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='Enter supervisor name'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm font-medium'>
                                          Address{' '}
                                          <span className='text-red-500'>
                                            *
                                          </span>
                                        </Label>
                                        <Input
                                          value={employer.address}
                                          onChange={(e) =>
                                            updatePreviousEmployer(
                                              index,
                                              'address',
                                              e.target.value,
                                            )
                                          }
                                          required
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., Concord, ON'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm font-medium'>
                                          Phone
                                        </Label>
                                        <Input
                                          value={employer.phone}
                                          onChange={(e) =>
                                            updatePreviousEmployer(
                                              index,
                                              'phone',
                                              e.target.value,
                                            )
                                          }
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='Enter phone number'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm font-medium'>
                                          Position{' '}
                                          <span className='text-red-500'>
                                            *
                                          </span>
                                        </Label>
                                        <Input
                                          value={employer.position}
                                          onChange={(e) =>
                                            updatePreviousEmployer(
                                              index,
                                              'position',
                                              e.target.value,
                                            )
                                          }
                                          required
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., Delivery Driver'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm font-medium'>
                                          Start Date{' '}
                                          <span className='text-red-500'>
                                            *
                                          </span>
                                        </Label>
                                        <Input
                                          value={employer.start_date}
                                          onChange={(e) =>
                                            updatePreviousEmployer(
                                              index,
                                              'start_date',
                                              e.target.value,
                                            )
                                          }
                                          required
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., November 2025'
                                        />
                                      </div>
                                      <div className='space-y-2'>
                                        <Label className='text-sm font-medium'>
                                          End Date{' '}
                                          <span className='text-red-500'>
                                            *
                                          </span>
                                        </Label>
                                        <Input
                                          value={employer.end_date}
                                          onChange={(e) =>
                                            updatePreviousEmployer(
                                              index,
                                              'end_date',
                                              e.target.value,
                                            )
                                          }
                                          required
                                          className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                          placeholder='e.g., Present or September 2025'
                                        />
                                      </div>
                                    </div>
                                    <div className='space-y-2 mt-4'>
                                      <Label className='text-sm font-medium'>
                                        Reasons for Leaving
                                      </Label>
                                      <Textarea
                                        value={employer.reasons_for_leaving}
                                        onChange={(e) =>
                                          updatePreviousEmployer(
                                            index,
                                            'reasons_for_leaving',
                                            e.target.value,
                                          )
                                        }
                                        rows={2}
                                        className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                                        placeholder='e.g., Was getting less work'
                                      />
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section 6: Compliance Requirements */}
                    {currentSection === 6 && (
                      <div className='space-y-6'>
                        <DocumentUploadField
                          label='Medical Certificate'
                          field='medical_certificate'
                          required
                        />

                        <DocumentUploadField
                          label='Abstract Document'
                          field='abstract_document'
                        />

                        <DocumentUploadField
                          label='CVOR Document'
                          field='cvor_document'
                        />

                        <DocumentUploadField
                          label='Safety Certificate'
                          field='safety_certificate'
                        />

                        <div className='flex items-center space-x-2 p-4 bg-gray-50 rounded-lg'>
                          <Checkbox
                            id='drug_alcohol_test'
                            checked={formData.drug_alcohol_test}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                drug_alcohol_test: checked as boolean,
                              }))
                            }
                          />
                          <Label
                            htmlFor='drug_alcohol_test'
                            className='text-[#111827] font-medium cursor-pointer'
                          >
                            I confirm that I have completed the Drug & Alcohol
                            Test
                          </Label>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-[#111827] font-medium'>
                            Compliance Notes
                          </Label>
                          <Textarea
                            name='compliance_notes'
                            value={formData.compliance_notes}
                            onChange={handleChange}
                            rows={3}
                            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                            placeholder='Any additional compliance information...'
                          />
                        </div>
                      </div>
                    )}

                    {/* Section 7: Account Information */}
                    {currentSection === 7 && (
                      <div className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Email Address{' '}
                              <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              type='email'
                              name='email'
                              value={formData.email}
                              onChange={handleChange}
                              required
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Enter your email'
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label className='text-[#111827] font-medium'>
                              Password <span className='text-red-500'>*</span>
                            </Label>
                            <Input
                              type='password'
                              name='password'
                              value={formData.password}
                              onChange={handleChange}
                              required
                              minLength={8}
                              className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                              placeholder='Minimum 8 characters'
                            />
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-[#111827] font-medium'>
                            Confirm Password{' '}
                            <span className='text-red-500'>*</span>
                          </Label>
                          <Input
                            type='password'
                            name='confirmPassword'
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className='bg-white border-2 border-gray-200 focus:border-[#D4AF37] rounded-lg'
                            placeholder='Confirm your password'
                          />
                        </div>

                        <Alert className='bg-blue-50 border-blue-200'>
                          <AlertCircle className='h-4 w-4 text-blue-600' />
                          <AlertDescription className='text-blue-800'>
                            Your account will be created with{' '}
                            <strong>pending approval</strong> status. You'll be
                            able to log in once an administrator approves your
                            application.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
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

      <Footer />
    </main>
  );
}

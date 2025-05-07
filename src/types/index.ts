export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  phone?: string;
  address?: string;
  specialization?: string;
  availableTimes?: AvailableTime[];
  ratings?: Rating[];
  averageRating?: number;
}

export type AvailableTime = {
  date: string;
  slots: string[];
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: string;
  notes?: string;
  prescription?: Prescription;
  rating?: Rating;
  followUp?: FollowUp;
};

export type Rating = {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  feedback: string;
  date: string;
};

export type Prescription = {
  id: string;
  appointmentId: string;
  medicines: Medicine[];
  instructions: string;
  duration: string;
  notes: string;
  prescribedDate: string;
  prescribedBy: string;
};

export type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing: string[];
};

export type FollowUp = {
  type: 'revisit' | 'test' | 'referral';
  recommendedDate: string;
  notes: string;
  referralDoctor?: string;
  testType?: string;
};

export type MedicalRecord = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  type: string;
  details: {
    diagnosis?: string;
    symptoms?: string[];
    notes?: string;
    prescription?: Prescription;
  };
};

export type Doctor = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  availableTimes: AvailableTime[];
  ratings?: Rating[];
  averageRating?: number;
};

export const SPECIALIZATIONS = [
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'General Physician',
  'Neurologist',
  'Obstetrician',
  'Ophthalmologist',
  'Orthopedist',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Radiologist',
  'Urologist'
] as const;

export const TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM'
] as const;

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;

export const MEDICINES = [
  {
    name: 'Amoxicillin',
    category: 'Antibiotic',
    forms: ['Tablet', 'Capsule', 'Suspension']
  },
  {
    name: 'Ibuprofen',
    category: 'Pain Relief',
    forms: ['Tablet', 'Suspension']
  },
  {
    name: 'Omeprazole',
    category: 'Antacid',
    forms: ['Capsule']
  },
  {
    name: 'Metformin',
    category: 'Diabetes',
    forms: ['Tablet']
  },
  {
    name: 'Amlodipine',
    category: 'Blood Pressure',
    forms: ['Tablet']
  },
  {
    name: 'Cetirizine',
    category: 'Antihistamine',
    forms: ['Tablet', 'Syrup']
  },
  {
    name: 'Paracetamol',
    category: 'Pain Relief',
    forms: ['Tablet', 'Syrup']
  },
  {
    name: 'Azithromycin',
    category: 'Antibiotic',
    forms: ['Tablet']
  },
  {
    name: 'Metoprolol',
    category: 'Blood Pressure',
    forms: ['Tablet']
  },
  {
    name: 'Sertraline',
    category: 'Antidepressant',
    forms: ['Tablet']
  }
] as const;

export const MEDICINE_TIMINGS = [
  'Before breakfast',
  'After breakfast',
  'Before lunch',
  'After lunch',
  'Before dinner',
  'After dinner',
  'Bedtime'
] as const;

export const BLOOD_TEST_TYPES = [
  'Complete Blood Count (CBC)',
  'Basic Metabolic Panel',
  'Comprehensive Metabolic Panel',
  'Lipid Panel',
  'Thyroid Function',
  'HbA1c',
  'Liver Function',
  'Kidney Function',
  'Vitamin D',
  'Iron Studies'
] as const;
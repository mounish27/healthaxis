import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { User, Star } from 'lucide-react';
import { User as UserType, Appointment, MedicalRecord } from '../types';
import MedicalHistory from '../components/MedicalHistory';

export default function PatientRecords() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);
  const [patients, setPatients] = useState<UserType[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [doctors, setDoctors] = useState<{ [key: string]: UserType }>({});

  useEffect(() => {
    // Load current user
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // Load all patients (for doctors) or just current patient
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const patientList = user.role === 'doctor' 
        ? users.filter((u: UserType) => u.role === 'patient')
        : [user];
      setPatients(patientList);

      // Set selected patient for patients
      if (user.role === 'patient') {
        setSelectedPatient(user);
      }

      // Load doctors
      const doctorMap: { [key: string]: UserType } = {};
      users.forEach((u: UserType) => {
        if (u.role === 'doctor') {
          doctorMap[u.id] = u;
        }
      });
      setDoctors(doctorMap);
    }

    // Load appointments
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    setAppointments(allAppointments);

    // Load medical records
    const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    setMedicalRecords(records);
  }, []);

  const getPatientAppointments = (patientId: string) => {
    return appointments.filter(apt => apt.patientId === patientId);
  };

  const getPatientRecords = (patientId: string) => {
    return medicalRecords.filter(record => record.patientId === patientId);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {currentUser?.role === 'doctor' ? 'Patient Records' : 'My Medical Records'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Patient List (only for doctors) */}
        {currentUser?.role === 'doctor' && (
          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Patients</h2>
            <div className="space-y-2">
              {patients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    selectedPatient?.id === patient.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {patient.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Patient Details */}
        <div className={currentUser?.role === 'doctor' ? 'md:col-span-3' : 'md:col-span-4'}>
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <User className="h-12 w-12 text-gray-400" />
                    <div>
                      <h2 className="text-xl font-semibold">{selectedPatient.name}</h2>
                      <p className="text-gray-500">{selectedPatient.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical History (only for doctors) */}
              {currentUser?.role === 'doctor' && (
                <MedicalHistory 
                  records={getPatientRecords(selectedPatient.id)} 
                  doctors={doctors} 
                />
              )}

              {/* Appointment History */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Appointment History</h3>
                <div className="space-y-4">
                  {getPatientAppointments(selectedPatient.id).map((apt, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {format(new Date(apt.date), 'MMMM d, yyyy')} at {apt.time}
                          </p>
                          <p className="text-sm text-gray-500">{apt.type}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          apt.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                      </div>
                      {apt.rating && (
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            {apt.rating.rating}/5 - {apt.rating.feedback}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              {currentUser?.role === 'doctor' 
                ? 'Select a patient to view their records'
                : 'Loading your medical records...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
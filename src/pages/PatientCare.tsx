import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Activity, FlaskRound as Flask, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { User, Appointment, MedicalRecord } from '../types';

export default function PatientCare() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ [key: string]: User }>({});
  const [message, setMessage] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    const loadData = () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        // Load appointments
        const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        setAppointments(savedAppointments.filter((apt: Appointment) => apt.patientId === user.id));

        // Load medical records
        const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
        const patientRecords = records.filter((record: MedicalRecord) => record.patientId === user.id);
        console.log('Loaded medical records:', patientRecords); // Debug log
        setMedicalRecords(patientRecords);

        // Load doctors
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const doctorMap: { [key: string]: User } = {};
        users.forEach((u: User) => {
          if (u.role === 'doctor') {
            doctorMap[u.id] = u;
          }
        });
        setDoctors(doctorMap);
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedDoctor) {
      toast.error('Please enter a message and select a doctor');
      return;
    }

    // In a real app, this would be handled by a backend service
    toast.success('Message sent to doctor');
    setMessage('');
    setSelectedDoctor('');
  };

  const handleBookBloodTest = (testType: string) => {
    // In a real app, this would create a blood test appointment
    toast.success(`Blood test scheduled: ${testType}`);
  };

  const getPrescribedMedicines = () => {
    // Get medicines from appointments
    const appointmentMedicines = appointments
      .filter(apt => apt.prescription)
      .flatMap(apt => apt.prescription!.medicines);

    // Get medicines from medical records
    const recordMedicines = medicalRecords
      .filter(record => record.type === 'prescription' && record.details.prescription)
      .flatMap(record => record.details.prescription.medicines);

    // Combine and deduplicate medicines
    const allMedicines = [...appointmentMedicines, ...recordMedicines];
    const uniqueMedicines = allMedicines.reduce((acc, medicine) => {
      if (!acc.some(m => m.name === medicine.name && m.dosage === medicine.dosage)) {
        acc.push(medicine);
      }
      return acc;
    }, [] as typeof allMedicines);

    return uniqueMedicines;
  };

  const getFollowUps = () => {
    return appointments.filter(apt => apt.followUp);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Patient Care Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Message Doctor */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Message Your Doctor</h2>
          </div>
          <div className="space-y-4">
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a doctor</option>
              {Object.values(doctors).map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Send Message
            </button>
          </div>
        </div>

        {/* Prescribed Medicines */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Current Medications</h2>
          </div>
          <div className="space-y-4">
            {getPrescribedMedicines().map((medicine, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">{medicine.name}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Dosage:</span> {medicine.dosage}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Frequency:</span> {medicine.frequency}
                      </p>
                      {medicine.duration && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Duration:</span> {medicine.duration}
                        </p>
                      )}
                      {medicine.timing && medicine.timing.length > 0 && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Timing:</span> {medicine.timing.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {getPrescribedMedicines().length === 0 && (
              <p className="text-gray-500 text-center py-4">No current medications</p>
            )}
          </div>
        </div>

        {/* Blood Tests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flask className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Prescribed Blood Tests</h2>
          </div>
          <div className="space-y-4">
            {appointments
              .filter(apt => apt.followUp?.type === 'test')
              .map((apt, index) => (
                <div key={index} className="border-b pb-2">
                  <p className="font-medium">{apt.followUp?.testType}</p>
                  <p className="text-sm text-gray-600">
                    Recommended Date: {format(new Date(apt.followUp!.recommendedDate), 'MMMM d, yyyy')}
                  </p>
                  <button
                    onClick={() => handleBookBloodTest(apt.followUp!.testType!)}
                    className="mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                  >
                    Schedule Test
                  </button>
                </div>
              ))}
            {!appointments.some(apt => apt.followUp?.type === 'test') && (
              <p className="text-gray-500">No blood tests prescribed</p>
            )}
          </div>
        </div>

        {/* Follow-ups */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Follow-up Appointments</h2>
          </div>
          <div className="space-y-4">
            {getFollowUps().map((apt, index) => (
              <div key={index} className="border-b pb-2">
                <p className="font-medium">
                  {apt.followUp!.type === 'referral'
                    ? `Referral to ${doctors[apt.followUp!.referralDoctor!]?.name}`
                    : 'Re-visit'}
                </p>
                <p className="text-sm text-gray-600">
                  Recommended Date: {format(new Date(apt.followUp!.recommendedDate), 'MMMM d, yyyy')}
                </p>
                {apt.followUp!.notes && (
                  <p className="text-sm text-gray-500">Notes: {apt.followUp!.notes}</p>
                )}
                <button
                  onClick={() => {
                    // In a real app, this would navigate to appointment booking
                    toast.success('Redirecting to appointment booking...');
                  }}
                  className="mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
                >
                  Schedule Appointment
                </button>
              </div>
            ))}
            {getFollowUps().length === 0 && (
              <p className="text-gray-500">No follow-up appointments scheduled</p>
            )}
          </div>
        </div>

        {/* Medical Records */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Medical Records</h2>
          </div>
          <div className="space-y-4">
            {medicalRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No medical records found</p>
            ) : (
              medicalRecords
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(record => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium capitalize">{record.type}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(record.date), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Doctor: {doctors[record.doctorId]?.name || 'Unknown Doctor'}
                        </p>
                      </div>
                    </div>
                    
                    {record.type === 'prescription' && record.details?.prescription && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium">Prescription Details</h4>
                        <div className="space-y-2">
                          {record.details.prescription.medicines.map((medicine, index) => (
                            <div key={index} className="pl-4 border-l-2 border-blue-200">
                              <p className="font-medium">{medicine.name}</p>
                              <p className="text-sm text-gray-500">Dosage: {medicine.dosage}</p>
                              <p className="text-sm text-gray-500">Frequency: {medicine.frequency}</p>
                              <p className="text-sm text-gray-500">Duration: {medicine.duration}</p>
                              {medicine.timing && medicine.timing.length > 0 && (
                                <p className="text-sm text-gray-500">
                                  Timing: {medicine.timing.join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        {record.details.prescription.instructions && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Instructions:</p>
                            <p className="text-sm text-gray-500">{record.details.prescription.instructions}</p>
                          </div>
                        )}
                        {record.details.prescription.notes && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Notes:</p>
                            <p className="text-sm text-gray-500">{record.details.prescription.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {record.type === 'diagnosis' && record.details?.diagnosis && (
                      <div className="mt-4">
                        <h4 className="font-medium">Diagnosis</h4>
                        <p className="text-sm text-gray-500">{record.details.diagnosis}</p>
                        {record.details.symptoms && record.details.symptoms.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Symptoms:</p>
                            <ul className="list-disc list-inside text-sm text-gray-500">
                              {record.details.symptoms.map((symptom, index) => (
                                <li key={index}>{symptom}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {record.type === 'test' && record.details?.test && (
                      <div className="mt-4">
                        <h4 className="font-medium">Test Results</h4>
                        <p className="text-sm text-gray-500">Test Type: {record.details.test.type}</p>
                        <p className="text-sm text-gray-500">Result: {record.details.test.result}</p>
                        {record.details.test.notes && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Notes:</p>
                            <p className="text-sm text-gray-500">{record.details.test.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
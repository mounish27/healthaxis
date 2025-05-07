import { useState, useEffect } from 'react';
import { User, Calendar, Clock, Phone, Mail, MapPin, FileText, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { User as UserType, Appointment } from '../types';

export default function PatientManagement() {
  const [patients, setPatients] = useState<UserType[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const loadPatients = () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');

      // Get unique patient IDs from appointments
      const patientIds = new Set(
        appointments
          .filter((apt: Appointment) => apt.doctorId === currentUser.id)
          .map((apt: Appointment) => apt.patientId)
      );

      // Get patient details
      const patientList = users.filter((user: UserType) => 
        user.role === 'patient' && patientIds.has(user.id)
      );

      setPatients(patientList);
    };

    loadPatients();
    window.addEventListener('storage', loadPatients);
    return () => window.removeEventListener('storage', loadPatients);
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const patientAppts = appointments.filter((apt: Appointment) => 
        apt.patientId === selectedPatient.id
      );
      setPatientAppointments(patientAppts);
    }
  }, [selectedPatient]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Patients</h2>
              <div className="space-y-4">
                {patients.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full p-4 rounded-lg transition-colors ${
                      selectedPatient?.id === patient.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    } border`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-500">ID: {patient.id}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Info */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h2>
                      <p className="text-gray-500">Patient ID: {selectedPatient.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{selectedPatient.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{selectedPatient.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{selectedPatient.address || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment History</h3>
                  <div className="space-y-4">
                    {patientAppointments.map(appointment => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{format(new Date(appointment.date), 'MMMM d, yyyy')}</p>
                            <p className="text-sm text-gray-500">{appointment.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-gray-500 hover:text-gray-700"
                            title="View Details"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 text-gray-500 hover:text-gray-700"
                            title="Send Message"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center h-full">
                <div className="text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a patient to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
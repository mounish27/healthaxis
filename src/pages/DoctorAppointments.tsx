import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import toast from 'react-hot-toast';
import { User, Appointment } from '../types';

export default function DoctorAppointments() {
  const [, setCurrentUser] = useState<User | null>(null); // Keeping setter for use in useEffect
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // Load appointments
      const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const doctorAppointments = savedAppointments.filter((apt: Appointment) => apt.doctorId === user.id);
      setAppointments(doctorAppointments);

      // Load patient details
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const patientMap: { [key: string]: User } = {};
      doctorAppointments.forEach((apt: Appointment) => {
        const patient = users.find((u: User) => u.id === apt.patientId);
        if (patient) {
          patientMap[patient.id] = patient;
        }
      });
      setPatients(patientMap);
    }
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const handleConfirmAppointment = (appointmentId: string) => {
    const updatedAppointments = appointments.map(apt =>
      apt.id === appointmentId ? { ...apt, status: 'confirmed' as const } : apt
    );
    
    // Update in localStorage
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updatedAllAppointments = allAppointments.map((apt: Appointment) =>
      apt.id === appointmentId ? { ...apt, status: 'confirmed' } : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updatedAllAppointments));
    
    setAppointments(updatedAppointments);
    setSelectedAppointment(null);
    toast.success('Appointment confirmed successfully!');
  };

  const handleCancelAppointment = (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      const updatedAppointments = appointments.filter(apt => apt.id !== appointmentId);
      
      // Update in localStorage
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const updatedAllAppointments = allAppointments.filter((apt: Appointment) => apt.id !== appointmentId);
      localStorage.setItem('appointments', JSON.stringify(updatedAllAppointments));
      
      setAppointments(updatedAppointments);
      setSelectedAppointment(null);
      toast.success('Appointment cancelled successfully!');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Appointments Calendar</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-700">Weekly Schedule</h2>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => (
            <div key={day.toString()} className="text-center">
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className="text-sm text-gray-500">{format(day, 'MMM d')}</div>
              <div className="mt-2 space-y-2">
                {appointments
                  .filter(apt => format(new Date(apt.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                  .map(apt => (
                    <button
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`w-full p-2 text-sm rounded-md ${
                        apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {apt.time}
                      <br />
                      {patients[apt.patientId]?.name}
                    </button>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Appointment Details
                </h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Patient Name</p>
                  <p className="text-base text-gray-900">
                    {patients[selectedAppointment.patientId]?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-base text-gray-900">
                    {format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-base text-gray-900">{selectedAppointment.time}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-base text-gray-900">{selectedAppointment.type}</p>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-base text-gray-900">{selectedAppointment.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={`inline-flex px-2 py-1 rounded-full text-sm font-semibold ${
                    selectedAppointment.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                {selectedAppointment.status === 'pending' && (
                  <button
                    onClick={() => handleConfirmAppointment(selectedAppointment.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Confirm Appointment
                  </button>
                )}
                <button
                  onClick={() => handleCancelAppointment(selectedAppointment.id)}
                  className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
                >
                  Cancel Appointment
                </button>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Check, Calendar as CalendarIcon, User, FileText, MessageSquare, Search, Send } from 'lucide-react';
import { format, isToday, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import { User as UserType, TIME_SLOTS, Medicine, FollowUp, Appointment, MedicalRecord } from '../types';
import PrescriptionForm from '../components/PrescriptionForm';
import FollowUpForm from '../components/FollowUpForm';
import AppointmentCard from '../components/shared/AppointmentCard';
import UserCard from '../components/shared/UserCard';
import TimeSlotPicker from '../components/shared/TimeSlotPicker';

interface Medication extends Omit<Medicine, 'timing' | 'duration'> {
  id: string;
  patientId: string;
  doctorId: string;
  nextDose: string;
  prescribedBy: string;
  prescribedDate: string;
  instructions?: string;
  notes?: string;
}

export default function DoctorDashboard() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState<{ [key: string]: UserType }>({});
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<UserType | null>(null);
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecordType, setSelectedRecordType] = useState<string>('all');
  const [messages, setMessages] = useState<{
    id: string;
    patientId: string;
    content: string;
    timestamp: string;
    isDoctor: boolean;
  }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showEditMedication, setShowEditMedication] = useState(false);

  useEffect(() => {
    const loadData = () => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // Load appointments
      const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        setAppointments(savedAppointments.filter((apt: Appointment) => apt.doctorId === user.id));

      // Load all doctors for referrals
      const users = JSON.parse(localStorage.getItem('users') || '[]');
        setDoctors(users.filter((u: UserType) => u.role === 'doctor' && u.id !== user.id));

        // Load patients
        const patientMap: { [key: string]: UserType } = {};
        users.forEach((u: UserType) => {
          if (u.role === 'patient') {
            patientMap[u.id] = u;
          }
        });
        setPatients(patientMap);

        // Load medications
        const allMedications = JSON.parse(localStorage.getItem('medications') || '[]');
        setMedications(allMedications);

        // Load patient records
        const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
        setPatientRecords(records);

        // Load messages
        const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        setMessages(allMessages.filter((msg: { id: string; patientId: string; content: string; timestamp: string; isDoctor: boolean }) => msg.isDoctor));
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  useEffect(() => {
    if (currentUser) {
      // Load available slots for selected date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get doctor's availability for this date
      const dateAvailability = currentUser.availableTimes?.find(
        avail => avail.date === dateStr
      );

      // Initialize selected slots with current availability
      if (dateAvailability) {
        setSelectedSlots(new Set(dateAvailability.slots));
      } else {
        setSelectedSlots(new Set());
      }

      // Get current time for today's slots
      const currentTime = new Date();

      // Filter available slots based on current time for today
      const allSlots = TIME_SLOTS.filter(slot => {
        if (isToday(selectedDate)) {
          const [hours, minutes] = slot.split(':').map(Number);
          const slotTime = new Date();
          slotTime.setHours(hours, minutes, 0, 0);
          return isAfter(slotTime, currentTime);
        }
        return true;
      });

      setAvailableSlots(allSlots);
    }
  }, [selectedDate, currentUser, appointments]);

  const toggleTimeSlot = (time: string) => {
    setSelectedSlots(prev => {
      const newSlots = new Set(prev);
      if (newSlots.has(time)) {
        newSlots.delete(time);
      } else {
        newSlots.add(time);
      }
      return newSlots;
    });
  };

  const handleSaveAvailability = () => {
    if (!currentUser) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const currentAvailability = currentUser.availableTimes || [];
    
    // Find or create entry for this date
    let dateAvailability = currentAvailability.find(avail => avail.date === dateStr);
    if (!dateAvailability) {
      dateAvailability = { date: dateStr, slots: [] };
      currentAvailability.push(dateAvailability);
    }

    // Update slots for this date
    dateAvailability.slots = Array.from(selectedSlots).sort();

    // Update user in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((user: UserType) =>
      user.id === currentUser.id
        ? { ...user, availableTimes: currentAvailability }
        : user
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Update current user
    const updatedCurrentUser = { ...currentUser, availableTimes: currentAvailability };
    localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
    setCurrentUser(updatedCurrentUser);

    // Dispatch storage event to notify other tabs/windows
    window.dispatchEvent(new Event('storage'));

    toast.success('Availability saved successfully!');
  };

  const handlePrescriptionSubmit = (prescription: { medicines: Medicine[]; instructions: string; notes: string }) => {
    if (!selectedPatient) return;

    // Create medical record for the prescription
    const newMedicalRecord = {
      id: crypto.randomUUID(),
      patientId: selectedPatient.id,
      doctorId: currentUser?.id || '',
      date: new Date().toISOString(),
      type: 'prescription',
      details: {
        prescription: {
          ...prescription,
          prescribedDate: new Date().toISOString(),
          prescribedBy: currentUser?.id || ''
        }
      }
    };

    // Update medical records in localStorage
    const allRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    const updatedRecords = [...allRecords, newMedicalRecord];
    localStorage.setItem('medicalRecords', JSON.stringify(updatedRecords));
    setPatientRecords(updatedRecords);

    // Create medication records for each medicine in the prescription
    const newMedications = prescription.medicines.map((medicine: Medicine) => ({
      id: crypto.randomUUID(),
      patientId: selectedPatient.id,
      doctorId: currentUser?.id,
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      duration: medicine.duration,
      timing: medicine.timing,
      prescribedBy: currentUser?.id,
      prescribedDate: new Date().toISOString(),
      instructions: prescription.instructions,
      notes: prescription.notes
    }));

    // Update medications in localStorage
    const allMedications = JSON.parse(localStorage.getItem('medications') || '[]');
    const updatedMedications = [...allMedications, ...newMedications];
    localStorage.setItem('medications', JSON.stringify(updatedMedications));
    setMedications(updatedMedications);

    setShowPrescriptionForm(false);
    toast.success('Prescription saved successfully!');

    // Dispatch storage event to notify other tabs/windows
    window.dispatchEvent(new Event('storage'));
  };

  const handleFollowUpSubmit = (followUp: Omit<FollowUp, 'id'>) => {
    if (!selectedAppointment) return;

    // Update appointment with follow-up
    const updatedAppointments = appointments.map(apt =>
      apt.id === selectedAppointment.id
        ? { ...apt, followUp }
        : apt
    );

    // Update in localStorage
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updatedAllAppointments = allAppointments.map((apt: Appointment) =>
      apt.id === selectedAppointment.id
        ? { ...apt, followUp }
        : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updatedAllAppointments));

    setAppointments(updatedAppointments);
    setShowFollowUpForm(false);
    setSelectedAppointment(null);
    toast.success('Follow-up scheduled successfully!');

    // Dispatch storage event to notify other tabs/windows
    window.dispatchEvent(new Event('storage'));
  };

  const todayAppointments = appointments.filter(apt => 
    format(new Date(apt.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) > new Date() && 
    format(new Date(apt.date), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
  );

  const handleSendMessage = () => {
    if (!selectedPatient || !newMessage.trim()) return;

    const message = {
      id: crypto.randomUUID(),
      patientId: selectedPatient.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isDoctor: true
    };

    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    localStorage.setItem('messages', JSON.stringify([...allMessages, message]));
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    window.dispatchEvent(new Event('storage'));
    toast.success('Message sent successfully!');
  };

  const filteredPatients = Object.values(patients).filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowEditMedication(true);
  };

  const handleDeleteMedication = (medicationId: string) => {
    const updatedMedications = medications.filter(med => med.id !== medicationId);
    setMedications(updatedMedications);
    localStorage.setItem('medications', JSON.stringify(updatedMedications));
    toast.success('Medication deleted successfully!');
  };

  const handleUpdateMedication = (updatedMedication: Medication) => {
    const updatedMedications = medications.map(med => 
      med.id === updatedMedication.id ? updatedMedication : med
    );
    setMedications(updatedMedications);
    localStorage.setItem('medications', JSON.stringify(updatedMedications));
    setShowEditMedication(false);
    setSelectedMedication(null);
    toast.success('Medication updated successfully!');
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-600">HealthAxis</h1>
            <p className="text-sm text-gray-500">Doctor Portal</p>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'availability' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-5 h-5 mr-3" />
              Availability
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'patients' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              Patients
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'records' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              Patient Records
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'messages' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Messages
            </button>
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
        <div>
                <p className="font-medium">{currentUser?.name}</p>
                <p className="text-sm text-gray-500">{currentUser?.specialization}</p>
              </div>
            </div>
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-500">
                  <CalendarIcon className="w-5 h-5" />
                  <span>{format(new Date(), 'MMMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{todayAppointments.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{upcomingAppointments.length}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
          </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Patients</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
            {new Set(appointments.map(apt => apt.patientId)).size}
          </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
        </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Appointments</h3>
        <div className="space-y-4">
                {todayAppointments.map(appointment => (
                  <AppointmentCard
                key={appointment.id}
                    appointment={appointment}
                    user={currentUser!}
                    otherParty={patients[appointment.patientId]}
                    onPrescribe={() => {
                      setSelectedAppointment(appointment);
                      setShowPrescriptionForm(true);
                    }}
                    onFollowUp={() => {
                      setSelectedAppointment(appointment);
                      setShowFollowUpForm(true);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Patient Medications */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Prescriptions</h3>
              <div className="space-y-4">
                {medications
                  .filter(med => med.doctorId === currentUser?.id)
                  .sort((a, b) => new Date(b.prescribedDate).getTime() - new Date(a.prescribedDate).getTime())
                  .slice(0, 5)
                  .map(medication => (
                    <div key={medication.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{medication.name}</p>
                        <p className="text-sm text-gray-500">Patient: {patients[medication.patientId]?.name}</p>
                        <p className="text-sm text-gray-500">Dosage: {medication.dosage}</p>
                        <p className="text-sm text-gray-500">Frequency: {medication.frequency}</p>
                        {medication.instructions && (
                          <p className="text-sm text-gray-500">Instructions: {medication.instructions}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-500">
                          {format(new Date(medication.prescribedDate), 'MMM d, yyyy')}
                        </div>
                        <button
                          onClick={() => handleEditMedication(medication)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMedication(medication.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Manage Availability</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-500">
                  <CalendarIcon className="w-5 h-5" />
                  <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={format(selectedDate, 'yyyy-MM-dd')}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3">
                    Available Time Slots
                  </h3>
                  <TimeSlotPicker
                    availableSlots={availableSlots}
                    selectedSlots={Array.from(selectedSlots)}
                    onSlotSelect={toggleTimeSlot}
                    showIcon={true}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAvailability}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient List */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patients</h3>
                <div className="space-y-2">
                  {filteredPatients.map(patient => (
                    <UserCard
                      key={patient.id}
                      user={patient}
                      selected={selectedPatient?.id === patient.id}
                      onClick={() => setSelectedPatient(patient)}
                    />
            ))}
        </div>
      </div>

              {/* Patient Details */}
              <div className="lg:col-span-2 space-y-6">
                {selectedPatient ? (
                  <>
                    {/* Patient Information */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{selectedPatient.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedPatient.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{selectedPatient.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{selectedPatient.address}</p>
                        </div>
                      </div>
        </div>

                    {/* Medical Records */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Records</h3>
                      <div className="space-y-4">
                        {patientRecords
                          .filter(record => record.patientId === selectedPatient.id)
                          .map(record => (
                            <div key={record.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{record.type}</p>
                                  <p className="text-sm text-gray-500">
                                    {format(new Date(record.date), 'MMMM d, yyyy')}
                                  </p>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {record.doctorId === currentUser?.id ? 'You' : doctors.find(d => d.id === record.doctorId)?.name}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{JSON.stringify(record.details)}</p>
                            </div>
                ))}
              </div>
            </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <p className="text-gray-500 text-center">Select a patient to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Patient Records</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedRecordType}
                  onChange={(e) => setSelectedRecordType(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Records</option>
                  <option value="prescription">Prescriptions</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="test">Test Results</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient List */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patients</h3>
                <div className="space-y-2">
                  {Object.values(patients).map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedPatient?.id === patient.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Records */}
              <div className="lg:col-span-2 space-y-6">
                {selectedPatient ? (
                  <div className="space-y-6">
                    {/* Patient Information */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{selectedPatient.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedPatient.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{selectedPatient.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{selectedPatient.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Prescriptions Section */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Prescriptions</h3>
                        <button
                          onClick={() => setShowPrescriptionForm(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add Prescription
                        </button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                        {medications
                          .filter(med => med.patientId === selectedPatient.id)
                          .sort((a, b) => new Date(b.prescribedDate).getTime() - new Date(a.prescribedDate).getTime())
                          .map(medication => (
                            <div key={medication.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <p className="font-medium text-lg">{medication.name}</p>
                                  <p className="text-sm text-gray-500">Dosage: {medication.dosage}</p>
                                  <p className="text-sm text-gray-500">Frequency: {medication.frequency}</p>
                                  <p className="text-sm text-gray-500">
                                    Prescribed on: {format(new Date(medication.prescribedDate), 'MMMM d, yyyy')}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditMedication(medication)}
                                    className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMedication(medication.id)}
                                    className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        {medications.filter(med => med.patientId === selectedPatient.id).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No prescriptions found for this patient
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Medical Records */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Records</h3>
                      <div className="space-y-4">
                        {patientRecords
                          .filter(record => 
                            record.patientId === selectedPatient.id &&
                            (selectedRecordType === 'all' || record.type === selectedRecordType)
                          )
                          .map(record => (
                            <div key={record.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium capitalize">{record.type}</h3>
                                  <p className="text-sm text-gray-500">
                                    {format(new Date(record.date), 'MMMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              
                              {record.type === 'prescription' && record.details.prescription && (
                                <div className="mt-4 space-y-2">
                                  <h4 className="font-medium">Prescription Details</h4>
                                  <div className="space-y-2">
                                    {record.details.prescription.medicines.map((medicine, index) => (
                                      <div key={index} className="pl-4 border-l-2 border-blue-200">
                                        <p className="font-medium">{medicine.name}</p>
                                        <p className="text-sm text-gray-500">Dosage: {medicine.dosage}</p>
                                        <p className="text-sm text-gray-500">Frequency: {medicine.frequency}</p>
                                        <p className="text-sm text-gray-500">Duration: {medicine.duration}</p>
                                        {medicine.timing.length > 0 && (
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

                              {record.type === 'diagnosis' && record.details.diagnosis && (
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

                              {record.details.notes && (
                                <div className="mt-4">
                                  <h4 className="font-medium">Notes</h4>
                                  <p className="text-sm text-gray-500">{record.details.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <p className="text-gray-500 text-center">Select a patient to view records</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient List */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patients</h3>
                <div className="space-y-2">
                  {Object.values(patients).map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedPatient?.id === patient.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        </div>
                      </div>
                    </div>
          ))}
        </div>
              </div>

              {/* Messages */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                {selectedPatient ? (
                  <div className="flex flex-col h-[600px]">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {messages
                        .filter(msg => msg.patientId === selectedPatient.id)
                        .map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.isDoctor ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                msg.isDoctor ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(msg.timestamp), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    Select a patient to start messaging
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showPrescriptionForm && selectedPatient && (
        <PrescriptionForm
          appointmentId={selectedPatient.id}
          onSubmit={handlePrescriptionSubmit}
          onClose={() => setShowPrescriptionForm(false)}
        />
      )}

      {showFollowUpForm && selectedAppointment && (
        <FollowUpForm
          onSubmit={handleFollowUpSubmit}
          onCancel={() => {
            setShowFollowUpForm(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {showEditMedication && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Medication</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medication Name</label>
                <input
                  type="text"
                  value={selectedMedication.name}
                  onChange={(e) => setSelectedMedication({...selectedMedication, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosage</label>
                <input
                  type="text"
                  value={selectedMedication.dosage}
                  onChange={(e) => setSelectedMedication({...selectedMedication, dosage: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <input
                  type="text"
                  value={selectedMedication.frequency}
                  onChange={(e) => setSelectedMedication({...selectedMedication, frequency: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowEditMedication(false);
                    setSelectedMedication(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateMedication(selectedMedication)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
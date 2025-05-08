import { useState, useEffect } from 'react';
import { Calendar, FileText, CheckCircle, XCircle, Video, Phone, Activity, Pill, Users, Shield, Heart, Bot, AlertCircle, TrendingUp, Thermometer, Droplet, Scale, CreditCard, Building2, Calendar as CalendarIcon, UserPlus, UserMinus, Edit2 } from 'lucide-react';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import toast from 'react-hot-toast';
import AIHealthChat from '../components/AIHealthChat';
import { Appointment, User, MedicalRecord } from '../types';

interface HealthMetric {
  bloodPressure: string;
  heartRate: number;
  weight: number;
  temperature: number;
  bloodOxygen: number;
  lastUpdated: string;
  history: {
    date: string;
    bloodPressure: string;
    heartRate: number;
    weight: number;
    temperature: number;
    bloodOxygen: number;
  }[];
}

interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  expiryDate: string;
  type: string;
  coverage: {
    inpatient: boolean;
    outpatient: boolean;
    prescription: boolean;
    dental: boolean;
    vision: boolean;
  };
  primaryHolder: {
    name: string;
    relationship: string;
  };
  documents: {
    id: string;
    name: string;
    type: string;
    uploadDate: string;
  }[];
}

interface FamilyMember extends Omit<User, 'password'> {
  relationship: string;
  createdAt: string;
  updatedAt: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
  nextDose?: string;
  patientId: string;
}


export default function PatientDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ [key: string]: User }>({});
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showHealthMetricModal, setShowHealthMetricModal] = useState(false);
  const [showFamilyMemberModal, setShowFamilyMemberModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [newHealthMetric, setNewHealthMetric] = useState({
    bloodPressure: '',
    heartRate: '',
    weight: '',
    temperature: '',
    bloodOxygen: ''
  });
  const [newFamilyMember, setNewFamilyMember] = useState({
    name: '',
    relationship: '',
    phone: '',
  });
  const [newInsurance, setNewInsurance] = useState({
    provider: '',
    policyNumber: '',
    expiryDate: '',
    type: '',
    coverage: {
      inpatient: false,
      outpatient: false,
      prescription: false,
      dental: false,
      vision: false
    },
    primaryHolder: {
      name: '',
      relationship: ''
    }
  });

  const [healthMetrics, setHealthMetrics] = useState<HealthMetric | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo | null>(null);

  const [emergencyLocation, setEmergencyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; number: string; type: string }[]>([]);

  const [editingFamilyMember, setEditingFamilyMember] = useState<{ id: string; name: string; relationship: string; phone: string } | null>(null);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [notifications, setNotifications] = useState<{
    id: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    timestamp: Date;
  }[]>([]);

  const handleEmergencyCall = () => {
    // Add emergency contact information
    const contacts = [
      { name: 'Emergency Services', number: '911', type: 'emergency' },
      { name: 'Nearest Hospital', number: '(555) 123-4567', type: 'hospital' },
      { name: 'Poison Control', number: '1-800-222-1222', type: 'poison' },
      { name: 'Mental Health Crisis', number: '988', type: 'mental' }
    ];
    setEmergencyContacts(contacts);

    // Get current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setEmergencyLocation(location);
        setShowEmergencyModal(true);
        
        // Store emergency call information
        const emergencyCall = {
          timestamp: new Date().toISOString(),
          location,
          contacts
        };
        
        localStorage.setItem('lastEmergencyCall', JSON.stringify(emergencyCall));
        toast.success('Emergency services have been notified with your location');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Could not get your location. Please provide it manually.');
        setShowEmergencyModal(true);
      }
    );
  };

  const requireAuthentication = (operation: string) => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      toast.error(`Please log in to ${operation.replace('_', ' ')}`);
      return false;
    }
    return true;
  };

  // Add activity logging
  const logActivity = (activity: string, metadata?: Record<string, unknown>) => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      const activityLog = {
        userId: user.id,
        activity,
        metadata,
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1' // In a real app, this would be the actual IP
      };
      
      const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      logs.push(activityLog);
      localStorage.setItem('activityLogs', JSON.stringify(logs));
    }
  };

  const handleStartVideoConsultation = async () => {
    try {
      // Security check
      if (!requireAuthentication('video_consultation')) {
        return;
      }

      logActivity('Starting video consultation');

      // Generate a random meeting ID
      const meetingId = Math.random().toString(36).substring(2, 15);
      
      // Create Google Meet URL
      const meetUrl = `https://meet.google.com/${meetingId}`;
      
      // Store consultation details
      const consultationDetails = {
        meetingId,
        userId: currentUser?.id,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      localStorage.setItem('currentConsultation', JSON.stringify(consultationDetails));

      // Add notification
      setNotifications(prev => [...prev, {
        id: crypto.randomUUID(),
        message: 'Video consultation started',
        type: 'info',
        timestamp: new Date()
      }]);

      // Open Google Meet in a new window
      window.open(meetUrl, '_blank', 'width=800,height=600');
      
      toast.success('Google Meet session started');

      // Log activity
      logActivity('Video consultation started', { meetingId, meetUrl });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to start consultation');
      logActivity('Video consultation failed', { error: errorMessage });
      
      // Add error notification
      setNotifications(prev => [...prev, {
        id: crypto.randomUUID(),
        message: 'Failed to start video consultation',
        type: 'error',
        timestamp: new Date()
      }]);
    }
  };

  useEffect(() => {
    const loadData = () => {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        setCurrentUser(user);

        // Load appointments
        const savedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        setAppointments(savedAppointments.filter((apt: Appointment) => apt.patientId === user.id));

        // Load medical records
        const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
        const patientRecords = records.filter((record: MedicalRecord) => record.patientId === user.id);
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

        // Load health metrics
        const metrics = JSON.parse(localStorage.getItem(`healthMetrics_${user.id}`) || 'null');
        setHealthMetrics(metrics);

        // Load medications
        const allMedications = JSON.parse(localStorage.getItem('medications') || '[]');
        setMedications(allMedications.filter((med: Medication) => med.patientId === user.id));

        // Load family members
        const family = JSON.parse(localStorage.getItem(`family_${user.id}`) || '[]');
        setFamilyMembers(family);

        // Load insurance info
        const insurance = JSON.parse(localStorage.getItem(`insurance_${user.id}`) || 'null');
        setInsuranceInfo(insurance);

        // Check for upcoming appointments
        const upcomingAppointments = savedAppointments.filter((apt: Appointment) => 
          isAfter(new Date(`${apt.date} ${apt.time}`), new Date()) &&
          isBefore(new Date(`${apt.date} ${apt.time}`), new Date(Date.now() + 24 * 60 * 60 * 1000))
        );

        setNotifications(prev => [
          ...prev,
          ...upcomingAppointments.map((apt: Appointment) => ({
            id: apt.id,
            message: `Upcoming appointment with Dr. ${doctorMap[apt.doctorId]?.name} at ${format(new Date(`${apt.date} ${apt.time}`), 'h:mm a')}`,
            type: 'info' as const,
            timestamp: new Date()
          }))
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error loading dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);
  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleAddFamilyMember = () => {
    if (!currentUser) return;

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: newFamilyMember.name,
      email: '',
      phone: newFamilyMember.phone,
      role: 'patient',
      relationship: newFamilyMember.relationship,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedFamilyMembers = [...familyMembers, newMember];
    setFamilyMembers(updatedFamilyMembers);
    localStorage.setItem(`family_${currentUser.id}`, JSON.stringify(updatedFamilyMembers));
    setShowFamilyMemberModal(false);
    setNewFamilyMember({ name: '', relationship: '', phone: '' });
    toast.success('Family member added successfully');
  };

  const handleEditFamilyMember = (member: FamilyMember) => {
    setEditingFamilyMember({
      id: member.id,
      name: member.name,
      relationship: member.relationship,
      phone: member.phone || ''
    });
    setShowFamilyMemberModal(true);
  };

  const handleDeleteFamilyMember = (memberId: string) => {
    if (!currentUser) return;

    const updatedFamilyMembers = familyMembers.filter(member => member.id !== memberId);
    setFamilyMembers(updatedFamilyMembers);
    localStorage.setItem(`family_${currentUser.id}`, JSON.stringify(updatedFamilyMembers));
    toast.success('Family member removed successfully');
  };

  const handleAddHealthMetric = () => {
    if (!currentUser) return;

    const currentDate = new Date().toISOString();
    const newMetric: HealthMetric = {
      bloodPressure: newHealthMetric.bloodPressure,
      heartRate: parseInt(newHealthMetric.heartRate),
      weight: parseFloat(newHealthMetric.weight),
      temperature: parseFloat(newHealthMetric.temperature),
      bloodOxygen: parseInt(newHealthMetric.bloodOxygen),
      lastUpdated: currentDate,
      history: [
        ...(healthMetrics?.history || []),
        {
          date: currentDate,
          bloodPressure: newHealthMetric.bloodPressure,
          heartRate: parseInt(newHealthMetric.heartRate),
          weight: parseFloat(newHealthMetric.weight),
          temperature: parseFloat(newHealthMetric.temperature),
          bloodOxygen: parseInt(newHealthMetric.bloodOxygen)
        }
      ]
    };
    
    localStorage.setItem(`healthMetrics_${currentUser.id}`, JSON.stringify(newMetric));
    setHealthMetrics(newMetric);
    setShowHealthMetricModal(false);
    setNewHealthMetric({ bloodPressure: '', heartRate: '', weight: '', temperature: '', bloodOxygen: '' });
    toast.success('Health metrics added successfully');
  };

  const handleUpdateInsurance = () => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const updatedInsurance = {
        ...newInsurance,
        documents: insuranceInfo?.documents || []
      };
      localStorage.setItem(`insurance_${JSON.parse(userStr).id}`, JSON.stringify(updatedInsurance));
      setInsuranceInfo(updatedInsurance);
      setShowInsuranceModal(false);
      setNewInsurance({
        provider: '',
        policyNumber: '',
        expiryDate: '',
        type: '',
        coverage: {
          inpatient: false,
          outpatient: false,
          prescription: false,
          dental: false,
          vision: false
        },
        primaryHolder: {
          name: '',
          relationship: ''
        }
      });
      toast.success('Insurance information updated successfully');
    }
  };

  const handleUpdateFamilyMember = () => {
    if (!currentUser || !editingFamilyMember) return;

    const updatedFamilyMembers = familyMembers.map(member =>
      member.id === editingFamilyMember.id
        ? {
            ...member,
            name: editingFamilyMember.name,
            relationship: editingFamilyMember.relationship,
            phone: editingFamilyMember.phone,
            updatedAt: new Date().toISOString()
          }
        : member
    );

    setFamilyMembers(updatedFamilyMembers);
    localStorage.setItem(`family_${currentUser.id}`, JSON.stringify(updatedFamilyMembers));
    setShowFamilyMemberModal(false);
    setEditingFamilyMember(null);
    toast.success('Family member updated successfully');
  };

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isToday(aptDate) && isAfter(aptDate, new Date());
  });

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isAfter(aptDate, new Date()) && !isToday(aptDate);
  });

  const handleCloseDetails = () => {
    setShowAppointmentDetails(false);
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const updatedAppointments = appointments.map(apt =>
        apt.id === appointmentId
          ? { ...apt, status: 'cancelled' as const }
          : apt
      );
      
      setAppointments(updatedAppointments);
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      toast.success('Appointment cancelled successfully');
      
      // Add notification
      setNotifications(prev => [...prev, {
        id: crypto.randomUUID(),
        message: 'Appointment cancelled successfully',
        type: 'info',
        timestamp: new Date()
      }]);
      
      // Log activity
      logActivity('Appointment cancelled', { appointmentId });
      
      // Close details modal
      handleCloseDetails();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
      
      // Add error notification
      setNotifications(prev => [...prev, {
        id: crypto.randomUUID(),
        message: 'Failed to cancel appointment',
        type: 'error',
        timestamp: new Date()
      }]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg ${
                notification.type === 'error' ? 'bg-red-100 text-red-900' :
                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-900' :
                'bg-blue-100 text-blue-900'
              }`}
            >
              <p className="font-medium">{notification.message}</p>
              <p className="text-sm opacity-75">
                {format(notification.timestamp, 'h:mm a')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Appointment Details</h2>
              <button
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Doctor</p>
                <p className="font-medium">Dr. {doctors[selectedAppointment.doctorId]?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {format(new Date(`${selectedAppointment.date} ${selectedAppointment.time}`), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{selectedAppointment.type}</p>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleCancelAppointment(selectedAppointment.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {currentUser?.name}</h1>
            <p className="text-gray-600">Manage your health journey</p>
          </div>
          <button
            onClick={handleEmergencyCall}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <AlertCircle className="h-6 w-6 animate-pulse" />
            <span className="font-semibold">SOS</span>
          </button>
        </div>
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-600">Emergency Assistance</h2>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            {emergencyLocation ? (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Your location has been shared with emergency services:</p>
                <p className="text-sm font-medium mt-1">
                  Latitude: {emergencyLocation.latitude.toFixed(6)}
                  <br />
                  Longitude: {emergencyLocation.longitude.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">Could not get your location. Please provide it manually.</p>
            )}

            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.number}</p>
                  </div>
                  <a
                    href={`tel:${contact.number}`}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Call
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="w-full py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Next Appointment */}
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Next Appointment</h2>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          {todayAppointments.length > 0 ? (
            <>
              <p className="text-xl font-semibold text-blue-600">
                {doctors[todayAppointments[0].doctorId]?.name}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(`${todayAppointments[0].date} ${todayAppointments[0].time}`), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </>
          ) : (
            <p className="text-gray-500">No upcoming appointments</p>
          )}
        </div>

        {/* Health Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Health Metrics</h2>
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </div>
          {healthMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Heart Rate</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{healthMetrics.heartRate} BPM</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Blood Pressure</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{healthMetrics.bloodPressure}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Weight</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{healthMetrics.weight} kg</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-600">Temperature</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{healthMetrics.temperature}°C</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">Blood Oxygen</span>
                </div>
                <p className="text-xl font-semibold text-gray-900">{healthMetrics.bloodOxygen}%</p>
              </div>
              <p className="text-xs text-gray-500">
                Last updated: {format(new Date(healthMetrics.lastUpdated), 'MMM d, yyyy h:mm a')}
              </p>
              <button
                onClick={() => setShowHealthMetricModal(true)}
                className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
              >
                Update Metrics
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No health metrics recorded</p>
              <button
                onClick={() => setShowHealthMetricModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Metrics
              </button>
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Medications</h2>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Pill className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          {medications.length > 0 ? (
            <>
              <p className="text-xl font-semibold text-purple-600">
                {medications.length} Active
              </p>
              {medications.length > 0 && medications[0].nextDose && (
                <p className="text-sm text-gray-500">
                  Next dose: {format(new Date(medications[0].nextDose), 'h:mm a')}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500">No medications</p>
          )}
        </div>

        {/* Insurance */}
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Insurance</h2>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Shield className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          {insuranceInfo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-yellow-500" />
                <p className="text-lg font-semibold text-gray-900">{insuranceInfo.provider}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Policy Number</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{insuranceInfo.policyNumber}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Expiry Date</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(insuranceInfo.expiryDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Coverage:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(insuranceInfo.coverage).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 ${value ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className="text-sm text-gray-600 capitalize">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowInsuranceModal(true)}
                className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
              >
                Update Insurance
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No insurance information</p>
              <button
                onClick={() => setShowInsuranceModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Insurance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Appointments Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Today's Appointments</h2>
            </div>
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Dr. {doctors[apt.doctorId]?.name}</p>
                      <p className="text-sm text-gray-600">{apt.time}</p>
                    </div>
                    <button
                      onClick={() => handleViewDetails(apt)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded-md"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No appointments scheduled for today</p>
            )}
          </div>

          {/* Medical Records */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold">Medical Records</h2>
              </div>
              {medicalRecords.length > 3 && (
                <button
                  onClick={() => window.location.href = '/medical-records'}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  View All Records
                </button>
              )}
            </div>
            <div className="space-y-6">
              {medicalRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No medical records found</p>
              ) : (
                medicalRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 3)
                  .map(record => (
                    <div key={record.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium capitalize">{record.type}</h3>
                          <p className="text-sm text-gray-500">
                            {format(new Date(record.date), 'MMMM d, yyyy')}
                          </p>
                          <p className="text-sm text-gray-500">
                            Doctor: {doctors[record.doctorId]?.name || 'Unknown Doctor'}
                          </p>
                        </div>
                      </div>
                      
                      {record.type === 'prescription' && record.details?.prescription && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Prescription Details</h4>
                          <div className="space-y-4">
                            {record.details.prescription.medicines.map((medicine, index) => (
                              <div key={index} className="pl-4 border-l-2 border-blue-200">
                                <p className="font-medium text-lg">{medicine.name}</p>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <p className="text-sm text-gray-600">Dosage: {medicine.dosage}</p>
                                  <p className="text-sm text-gray-600">Frequency: {medicine.frequency}</p>
                                  <p className="text-sm text-gray-600">Duration: {medicine.duration}</p>
                                  {medicine.timing && medicine.timing.length > 0 && (
                                    <p className="text-sm text-gray-600">
                                      Timing: {medicine.timing.join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.type === 'diagnosis' && record.details?.diagnosis && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Diagnosis</h4>
                          <p className="text-gray-600">{record.details.diagnosis}</p>
                        </div>
                      )}

                      {record.type === 'blood_test' && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Test Results</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {record.details.diagnosis && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Diagnosis</span>
                                <span className="font-medium">{record.details.diagnosis}</span>
                              </div>
                            )}
                            {record.details.symptoms && Array.isArray(record.details.symptoms) && record.details.symptoms.length > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Symptoms</span>
                                <span className="font-medium">{record.details.symptoms.join(', ')}</span>
                              </div>
                            )}
                            {record.details.notes && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Notes</span>
                                <span className="font-medium">{record.details.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                    <div>
                      <p className="font-medium">Dr. {doctors[apt.doctorId]?.name}</p>
                      <p className="text-sm text-gray-600">{format(new Date(apt.date), 'MMMM d, yyyy')} at {apt.time}</p>
                    </div>
                    <button
                      onClick={() => handleViewDetails(apt)}
                      className="px-3 py-1 text-indigo-600 hover:bg-indigo-100 rounded-md"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming appointments scheduled</p>
            )}
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Emergency & Video Consult */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleStartVideoConsultation}
                className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100"
              >
                <Video className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium">Video Consult</span>
              </button>
              <button
                onClick={handleEmergencyCall}
                className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <Phone className="h-6 w-6 text-red-600 mb-2" />
                <span className="text-sm font-medium">Emergency</span>
              </button>
              <button
                onClick={() => setShowFamilyMemberModal(true)}
                className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Users className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium">Family</span>
              </button>
              <button
                onClick={() => setShowInsuranceModal(true)}
                className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
              >
                <Shield className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-sm font-medium">Insurance</span>
              </button>
            </div>
          </div>

          {/* Family Members */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Family Members</h2>
              </div>
              <button
                onClick={() => {
                  setEditingFamilyMember(null);
                  setNewFamilyMember({ name: '', relationship: '', phone: '' });
                  setShowFamilyMemberModal(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <UserPlus className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {familyMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No family members added</p>
              ) : (
                familyMembers.map(member => (
                  <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{member.relationship}</p>
                        <p className="text-sm text-gray-500">{member.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditFamilyMember(member)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFamilyMember(member.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Health Assistant */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold">AI Health Assistant</h2>
            </div>
            <AIHealthChat />
          </div>
        </div>
      </div>

      {/* Health Metrics Modal */}
      {showHealthMetricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add Health Metrics</h2>
              <button
                onClick={() => setShowHealthMetricModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={newHealthMetric.bloodPressure}
                  onChange={(e) => setNewHealthMetric({ ...newHealthMetric, bloodPressure: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  value={newHealthMetric.heartRate}
                  onChange={(e) => setNewHealthMetric({ ...newHealthMetric, heartRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 72"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={newHealthMetric.weight}
                  onChange={(e) => setNewHealthMetric({ ...newHealthMetric, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  value={newHealthMetric.temperature}
                  onChange={(e) => setNewHealthMetric({ ...newHealthMetric, temperature: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 36.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Oxygen (%)
                </label>
                <input
                  type="number"
                  value={newHealthMetric.bloodOxygen}
                  onChange={(e) => setNewHealthMetric({ ...newHealthMetric, bloodOxygen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 98"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowHealthMetricModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHealthMetric}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Modal */}
      {showInsuranceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Insurance Information</h2>
              <button
                onClick={() => setShowInsuranceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4 flex-grow">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={newInsurance.provider}
                  onChange={(e) => setNewInsurance({ ...newInsurance, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Blue Cross"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Number
                </label>
                <input
                  type="text"
                  value={newInsurance.policyNumber}
                  onChange={(e) => setNewInsurance({ ...newInsurance, policyNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={newInsurance.expiryDate}
                  onChange={(e) => setNewInsurance({ ...newInsurance, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Type
                </label>
                <select
                  value={newInsurance.type}
                  onChange={(e) => setNewInsurance({ ...newInsurance, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select type</option>
                  <option value="private">Private</option>
                  <option value="employer">Employer Provided</option>
                  <option value="government">Government</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coverage
                </label>
                <div className="space-y-2">
                  {Object.entries(newInsurance.coverage).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNewInsurance({
                          ...newInsurance,
                          coverage: { ...newInsurance.coverage, [key]: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Holder Name
                </label>
                <input
                  type="text"
                  value={newInsurance.primaryHolder.name}
                  onChange={(e) => setNewInsurance({
                    ...newInsurance,
                    primaryHolder: { ...newInsurance.primaryHolder, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship to Primary Holder
                </label>
                <select
                  value={newInsurance.primaryHolder.relationship}
                  onChange={(e) => setNewInsurance({
                    ...newInsurance,
                    primaryHolder: { ...newInsurance.primaryHolder, relationship: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select relationship</option>
                  <option value="self">Self</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowInsuranceModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInsurance}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family Member Modal */}
      {showFamilyMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingFamilyMember ? 'Edit Family Member' : 'Add Family Member'}
              </h2>
              <button
                onClick={() => setShowFamilyMemberModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4 flex-grow">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingFamilyMember ? editingFamilyMember.name : newFamilyMember.name}
                  onChange={(e) => editingFamilyMember
                    ? setEditingFamilyMember({ ...editingFamilyMember, name: e.target.value })
                    : setNewFamilyMember({ ...newFamilyMember, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <select
                  value={editingFamilyMember ? editingFamilyMember.relationship : newFamilyMember.relationship}
                  onChange={(e) => editingFamilyMember
                    ? setEditingFamilyMember({ ...editingFamilyMember, relationship: e.target.value })
                    : setNewFamilyMember({ ...newFamilyMember, relationship: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editingFamilyMember ? editingFamilyMember.phone : newFamilyMember.phone}
                  onChange={(e) => editingFamilyMember
                    ? setEditingFamilyMember({ ...editingFamilyMember, phone: e.target.value })
                    : setNewFamilyMember({ ...newFamilyMember, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowFamilyMemberModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={editingFamilyMember ? handleUpdateFamilyMember : handleAddFamilyMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingFamilyMember ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
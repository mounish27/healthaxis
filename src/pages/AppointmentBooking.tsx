import { useState, useEffect } from 'react';
import { Star, User, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { User as UserType, TIME_SLOTS, Appointment } from '../types';
import { format, isToday, isAfter } from 'date-fns';
import UserCard from '../components/shared/UserCard';
import TimeSlotPicker from '../components/shared/TimeSlotPicker';

export default function AppointmentBooking() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<UserType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const doctors = users.filter((user: UserType) => user.role === 'doctor');
    setDoctors(doctors);

    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const todayBookedSlots = appointments
      .filter((apt: Appointment) => 
        format(new Date(apt.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
        apt.doctorId === selectedDoctor?.id
      )
      .map((apt: Appointment) => apt.time);
    setBookedSlots(new Set(todayBookedSlots));
  }, [selectedDate, selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const doctorAvailability = selectedDoctor.availableTimes?.find(
        avail => avail.date === dateStr
      );
      
      const currentTime = new Date();
      const allSlots = TIME_SLOTS.filter(slot => {
        if (isToday(selectedDate)) {
          const [hours, minutes] = slot.split(':').map(Number);
          const slotTime = new Date();
          slotTime.setHours(hours, minutes, 0, 0);
          return isAfter(slotTime, currentTime);
        }
        return true;
      });

      const available = doctorAvailability 
        ? allSlots.filter(slot => 
            doctorAvailability.slots.includes(slot) && 
            !bookedSlots.has(slot)
          )
        : [];
      
      setAvailableSlots(available);
    }
  }, [selectedDoctor, selectedDate, bookedSlots]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = () => {
    if (!currentUser || !selectedDoctor || !selectedTime) return;

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      patientId: currentUser.id,
      doctorId: selectedDoctor.id,
      date: selectedDate.toISOString(),
      time: selectedTime,
      status: 'pending',
      type: 'consultation'
    };

    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    localStorage.setItem('appointments', JSON.stringify([...appointments, appointment]));
    
    // Notify other tabs/windows
    window.dispatchEvent(new Event('storage'));
    
    toast.success('Appointment booked successfully!');
    setSelectedTime('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Doctor</h2>
              <div className="space-y-4">
                {doctors.map(doctor => (
                  <UserCard
                    key={doctor.id}
                    user={doctor}
                    selected={selectedDoctor?.id === doctor.id}
                    showRating={true}
                    onClick={() => setSelectedDoctor(doctor)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="lg:col-span-2">
            {selectedDoctor ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date</h2>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      return (
                    <button
                          key={i}
                          onClick={() => handleDateChange(date)}
                          className={`p-4 rounded-lg text-center transition-colors ${
                            format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {format(date, 'EEE')}
                          </div>
                          <div className="text-lg font-bold">
                            {format(date, 'd')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Time Slots</h2>
                  <TimeSlotPicker
                    availableSlots={availableSlots}
                    selectedSlots={selectedTime ? [selectedTime] : []}
                    onSlotSelect={handleTimeSelect}
                    showIcon={true}
                  />
                </div>

                {selectedTime && (
                  <button
                    onClick={handleBookAppointment}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book Appointment
                    </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Please select a doctor to view available slots</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Details Modal */}
      {showDoctorDetails && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Doctor Details</h2>
              <button
                onClick={() => setShowDoctorDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h3>
                  <p className="text-gray-500">{selectedDoctor.specialization}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Specialization</p>
                  <p className="font-medium">{selectedDoctor.specialization}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 font-medium">4.8</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Availability</p>
              <div className="space-y-2">
                  {selectedDoctor.availableTimes?.map(avail => (
                    <div key={avail.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{format(new Date(avail.date), 'MMM d, yyyy')}</span>
                      <span className="text-sm text-gray-500">{avail.slots.length} slots</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
}
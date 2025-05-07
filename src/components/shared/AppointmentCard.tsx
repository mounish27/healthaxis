import { Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment, User as UserType } from '../../types';

interface AppointmentCardProps {
  appointment: Appointment;
  user: UserType;
  otherParty: UserType;
  onPrescribe?: () => void;
  onFollowUp?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export default function AppointmentCard({
  appointment,
  user,
  otherParty,
  onPrescribe,
  onFollowUp,
  onCancel,
  showActions = true
}: AppointmentCardProps) {
  const isDoctor = user.role === 'doctor';
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{otherParty.name}</h3>
            <p className="text-sm text-gray-500">
              {isDoctor ? 'Patient' : otherParty.specialization}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="text-sm">
            {format(new Date(appointment.date), 'MMMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center text-gray-500">
          <Clock className="w-4 h-4 mr-2" />
          <span className="text-sm">{appointment.time}</span>
        </div>
      </div>
      {showActions && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
        <div className="mt-4 flex justify-end space-x-2">
          {isDoctor && onPrescribe && appointment.status === 'confirmed' && (
            <button
              onClick={onPrescribe}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
            >
              Prescribe
            </button>
          )}
          {isDoctor && onFollowUp && appointment.status === 'confirmed' && (
            <button
              onClick={onFollowUp}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
            >
              Follow-up
            </button>
          )}
          {onCancel && appointment.status === 'pending' && (
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
} 
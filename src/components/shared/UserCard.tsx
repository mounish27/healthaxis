import { User, Star } from 'lucide-react';
import { User as UserType } from '../../types';

interface UserCardProps {
  user: UserType;
  selected?: boolean;
  showRating?: boolean;
  onClick?: () => void;
}

export default function UserCard({
  user,
  selected = false,
  showRating = false,
  onClick
}: UserCardProps) {
  const isDoctor = user.role === 'doctor';

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{user.name}</h3>
          {isDoctor ? (
            <p className="text-sm text-gray-500">{user.specialization}</p>
          ) : (
            <p className="text-sm text-gray-500">{user.email}</p>
          )}
          {showRating && isDoctor && (
            <div className="flex items-center mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">4.8</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
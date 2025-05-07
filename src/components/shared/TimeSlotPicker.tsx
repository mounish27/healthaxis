import { Clock } from 'lucide-react';

interface TimeSlotPickerProps {
  availableSlots: string[];
  selectedSlots: string[];
  onSlotSelect: (slot: string) => void;
  isSelectable?: boolean;
  showIcon?: boolean;
}

export default function TimeSlotPicker({
  availableSlots,
  selectedSlots,
  onSlotSelect,
  isSelectable = true,
  showIcon = true
}: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {availableSlots.map(time => (
        <button
          key={time}
          onClick={() => isSelectable && onSlotSelect(time)}
          disabled={!isSelectable}
          className={`p-4 rounded-lg text-center transition-colors ${
            selectedSlots.includes(time)
              ? 'bg-blue-600 text-white'
              : isSelectable
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {showIcon && <Clock className="w-4 h-4 mx-auto mb-1" />}
          {time}
        </button>
      ))}
      {availableSlots.length === 0 && (
        <p className="col-span-full text-center text-gray-500 py-4">
          No available time slots
        </p>
      )}
    </div>
  );
} 
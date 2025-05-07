import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Medicine, MEDICINES, MEDICINE_TIMINGS, Prescription } from '../types';

type PrescriptionFormProps = {
  appointmentId: string;
  onSubmit: (prescription: Prescription) => void;
  onClose: () => void;
};

export default function PrescriptionForm({ appointmentId, onSubmit, onClose }: PrescriptionFormProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [instructions, setInstructions] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});

  const handleMedicineChange = (index: number, field: keyof Medicine, value: string | string[]) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index] = {
      ...updatedMedicines[index],
      [field]: value
    };
    setMedicines(updatedMedicines);
    if (field === 'name') {
      setSearchTerms(prev => ({
        ...prev,
        [index]: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const prescription: Prescription = {
      id: crypto.randomUUID(),
      appointmentId,
      medicines,
      instructions,
      duration,
      notes,
      prescribedDate: new Date().toISOString(),
      prescribedBy: '',
      severity: 'normal'
    };

    onSubmit(prescription);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Prescription</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 7 days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Medicines</h3>
                  <button
                    onClick={() => setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', timing: [] }])}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Medicine
                  </button>
                </div>
                <div className="space-y-4">
                  {medicines.map((medicine, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-md font-medium text-gray-900">Medicine {index + 1}</h4>
                        {medicines.length > 1 && (
                          <button
                            onClick={() => {
                              const newMedicines = [...medicines];
                              newMedicines.splice(index, 1);
                              setMedicines(newMedicines);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={searchTerms[index] || medicine.name}
                              onChange={(e) => {
                                const newSearchTerms = { ...searchTerms };
                                newSearchTerms[index] = e.target.value;
                                setSearchTerms(newSearchTerms);
                              }}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Search medicine..."
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {searchTerms[index] && searchTerms[index].length > 0 && (
                              <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                                {MEDICINES.filter(med =>
                                  med.name.toLowerCase().includes(searchTerms[index].toLowerCase())
                                ).map((med, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      handleMedicineChange(index, 'name', med.name);
                                      const newSearchTerms = { ...searchTerms };
                                      newSearchTerms[index] = '';
                                      setSearchTerms(newSearchTerms);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium">{med.name}</div>
                                    <div className="text-xs text-gray-500">{med.category}</div>
                                  </button>
                                ))}
                                {MEDICINES.filter(med =>
                                  med.name.toLowerCase().includes(searchTerms[index].toLowerCase())
                                ).length === 0 && (
                                  <div className="px-4 py-2 text-sm text-gray-500">
                                    No medicines found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dosage
                          </label>
                          <input
                            type="text"
                            value={medicine.dosage}
                            onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frequency
                          </label>
                          <input
                            type="text"
                            value={medicine.frequency}
                            onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={medicine.duration}
                            onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timing
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {MEDICINE_TIMINGS.map((time) => (
                              <label key={time} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={medicine.timing.includes(time)}
                                  onChange={(e) => {
                                    const newTiming = e.target.checked
                                      ? [...medicine.timing, time]
                                      : medicine.timing.filter((t) => t !== time);
                                    handleMedicineChange(index, 'timing', newTiming);
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{time}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Prescription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
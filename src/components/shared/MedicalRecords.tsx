import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { User as UserType } from '../../types';

interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  type: string;
  details: {
    diagnosis?: string;
    symptoms?: string[];
    notes?: string;
    prescription?: {
      medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
      }>;
    };
  };
}

interface MedicalRecordsProps {
  currentUser: UserType;
  patientId: string;
  isDoctor: boolean;
  onAddRecord?: (record: Omit<MedicalRecord, 'id'>) => void;
  onDeleteRecord?: (recordId: string) => void;
}

export default function MedicalRecords({
  currentUser,
  patientId,
  isDoctor,
  onAddRecord,
  onDeleteRecord
}: MedicalRecordsProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: '',
    details: {}
  });

  useEffect(() => {
    const storedRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    const patientRecords = storedRecords.filter(
      (record: MedicalRecord) => record.patientId === patientId
    );
    setRecords(patientRecords);
  }, [patientId]);

  const handleAddRecord = () => {
    if (onAddRecord) {
      onAddRecord({
        patientId,
        doctorId: currentUser.id,
        date: new Date().toISOString(),
        type: newRecord.type,
        details: newRecord.details
      });
      setShowAddForm(false);
      setNewRecord({ type: '', details: {} });
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (onDeleteRecord) {
      onDeleteRecord(recordId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Medical Records</h2>
        {isDoctor && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add Record</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Add New Record</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <input
                type="text"
                value={newRecord.type}
                onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Details</label>
              <textarea
                value={JSON.stringify(newRecord.details)}
                onChange={(e) => {
                  try {
                    setNewRecord({ ...newRecord, details: JSON.parse(e.target.value) });
                  } catch (err) {
                    console.error('Error fetching medical records:', err);
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecord}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {records.map(record => (
          <div key={record.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">{record.type}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(record.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              {isDoctor && (
                <button
                  onClick={() => handleDeleteRecord(record.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mt-4">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(record.details, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
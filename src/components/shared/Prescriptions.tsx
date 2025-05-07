import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { User as UserType } from '../../types';

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  medication: string;
  dosage: string;
  instructions: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface PrescriptionsProps {
  currentUser: UserType;
  patientId: string;
  isDoctor: boolean;
  onAddPrescription?: (prescription: Omit<Prescription, 'id'>) => void;
  onUpdateStatus?: (prescriptionId: string, status: Prescription['status']) => void;
  onDeletePrescription?: (prescriptionId: string) => void;
}

export default function Prescriptions({
  currentUser,
  patientId,
  isDoctor,
  onAddPrescription,
  onUpdateStatus,
  onDeletePrescription
}: PrescriptionsProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    medication: '',
    dosage: '',
    instructions: '',
    status: 'active' as const
  });

  useEffect(() => {
    const storedPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    const patientPrescriptions = storedPrescriptions.filter(
      (prescription: Prescription) => prescription.patientId === patientId
    );
    setPrescriptions(patientPrescriptions);
  }, [patientId]);

  const handleAddPrescription = () => {
    if (onAddPrescription) {
      onAddPrescription({
        patientId,
        doctorId: currentUser.id,
        date: new Date().toISOString(),
        ...newPrescription
      });
      setShowAddForm(false);
      setNewPrescription({
        medication: '',
        dosage: '',
        instructions: '',
        status: 'active'
      });
    }
  };

  const handleUpdateStatus = (prescriptionId: string, status: Prescription['status']) => {
    if (onUpdateStatus) {
      onUpdateStatus(prescriptionId, status);
    }
  };

  const handleDeletePrescription = (prescriptionId: string) => {
    if (onDeletePrescription) {
      onDeletePrescription(prescriptionId);
    }
  };

  const getStatusColor = (status: Prescription['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prescriptions</h2>
        {isDoctor && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add Prescription</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Add New Prescription</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Medication</label>
              <input
                type="text"
                value={newPrescription.medication}
                onChange={(e) => setNewPrescription({ ...newPrescription, medication: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dosage</label>
              <input
                type="text"
                value={newPrescription.dosage}
                onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea
                value={newPrescription.instructions}
                onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
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
                onClick={handleAddPrescription}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {prescriptions.map(prescription => (
          <div key={prescription.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Pill className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">{prescription.medication}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(prescription.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                  {prescription.status}
                </span>
                {isDoctor && (
                  <button
                    onClick={() => handleDeletePrescription(prescription.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Dosage:</span> {prescription.dosage}
              </p>
              <p className="text-sm">
                <span className="font-medium">Instructions:</span> {prescription.instructions}
              </p>
            </div>
            {!isDoctor && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleUpdateStatus(prescription.id, 'completed')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => handleUpdateStatus(prescription.id, 'cancelled')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                >
                  Cancel Prescription
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
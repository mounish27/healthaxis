import React from 'react';
import { format } from 'date-fns';
import { FileText, Download } from 'lucide-react';
import { MedicalRecord, User } from '../types';

type MedicalHistoryProps = {
  records: MedicalRecord[];
  doctors: { [key: string]: User };
};

export default function MedicalHistory({ records, doctors }: MedicalHistoryProps) {
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getRecordTypeIcon = (type: MedicalRecord['type']) => {
    switch (type) {
      case 'blood_test':
        return '🔬';
      case 'prescription':
        return '💊';
      case 'diagnosis':
        return '🏥';
      default:
        return '📄';
    }
  };

  const getRecordTitle = (record: MedicalRecord) => {
    switch (record.type) {
      case 'blood_test':
        return 'Blood Test Results';
      case 'prescription':
        return 'Prescription';
      case 'diagnosis':
        return 'Medical Diagnosis';
      default:
        return 'Medical Record';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Medical History</h2>
      
      <div className="space-y-4">
        {sortedRecords.map((record) => (
          <div
            key={record.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getRecordTypeIcon(record.type)}</span>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {getRecordTitle(record)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Dr. {doctors[record.doctorId]?.name} • {format(new Date(record.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              {record.attachments && record.attachments.length > 0 && (
                <button
                  className="flex items-center text-blue-600 hover:text-blue-800"
                  onClick={() => window.open(record.attachments![0], '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="text-sm">Download</span>
                </button>
              )}
            </div>

            <div className="mt-3">
              {record.type === 'blood_test' && (
                <div className="space-y-2">
                  {Object.entries(record.details).map(([test, value]) => (
                    <div key={test} className="flex justify-between text-sm">
                      <span className="text-gray-600">{test}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {record.type === 'prescription' && (
                <div className="space-y-2">
                  {record.details.medicines.map((medicine: any, index: number) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {medicine.name} - {medicine.dosage} ({medicine.frequency})
                    </div>
                  ))}
                  {record.details.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      Notes: {record.details.notes}
                    </p>
                  )}
                </div>
              )}

              {record.type === 'diagnosis' && (
                <p className="text-sm text-gray-600">
                  {record.details.diagnosis}
                </p>
              )}
            </div>
          </div>
        ))}

        {sortedRecords.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No medical records found
          </p>
        )}
      </div>
    </div>
  );
}
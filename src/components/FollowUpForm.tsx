import React, { useState } from 'react';
import { FollowUp, BLOOD_TEST_TYPES } from '../types';

interface FollowUpFormProps {
  onSubmit: (data: FollowUp) => void;
  onCancel: () => void;
}

export default function FollowUpForm({ onSubmit, onCancel }: FollowUpFormProps) {
  const [type, setType] = useState<FollowUp['type']>('revisit');
  const [recommendedDate, setRecommendedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [referralDoctor, setReferralDoctor] = useState('');
  const [testType, setTestType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const followUp: FollowUp = {
      type,
      recommendedDate,
      notes,
      ...(type === 'referral' && { referralDoctor }),
      ...(type === 'test' && { testType })
    };

    onSubmit(followUp);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Schedule Follow-up
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FollowUp['type'])}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="revisit">Re-visit</option>
              <option value="test">Blood Test</option>
              <option value="referral">Specialist Referral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommended Date
            </label>
            <input
              type="date"
              value={recommendedDate}
              onChange={(e) => setRecommendedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {type === 'test' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Type
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select test type</option>
                {BLOOD_TEST_TYPES.map((test) => (
                  <option key={test} value={test}>
                    {test}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'referral' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refer to Doctor
              </label>
              <select
                value={referralDoctor}
                onChange={(e) => setReferralDoctor(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select doctor</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Schedule Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
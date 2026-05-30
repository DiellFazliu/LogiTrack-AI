// frontend/src/components/driver/ReportProblemModal.tsx
import React, { useState } from 'react';
import { AlertCircle, X, Camera, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  trackingNumber: string;
  currentLocation?: { lat: number; lng: number };
}

const problemTypes = [
  { value: 'road_blocked', label: 'Road Blocked / Closed', icon: '🛑' },
  { value: 'traffic_jam', label: 'Heavy Traffic', icon: '🚗' },
  { value: 'accident', label: 'Accident', icon: '💥' },
  { value: 'wrong_address', label: 'Wrong Delivery Address', icon: '📍' },
  { value: 'customer_not_available', label: 'Customer Not Available', icon: '🚪' },
  { value: 'vehicle_issue', label: 'Vehicle Problem', icon: '🔧' },
  { value: 'weather', label: 'Bad Weather Conditions', icon: '🌧️' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  isOpen,
  onClose,
  shipmentId,
  trackingNumber,
  currentLocation
}) => {
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!problemType) {
      toast.error('Please select a problem type');
      return;
    }
    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/shipments/report-problem', {
        shipmentId,
        trackingNumber,
        problemType,
        description,
        photo: photo,
        location: currentLocation,
      });
      toast.success('Problem reported successfully! Dispatcher has been notified.');
      onClose();
      setProblemType('');
      setDescription('');
      setPhoto(null);
    } catch (error: any) {
      console.error('Error reporting problem:', error);
      toast.error(error.response?.data?.message || 'Failed to report problem');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold">Report Problem</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Shipment:</span> {trackingNumber}
            </p>
          </div>

          {/* Problem Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Problem Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {problemTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setProblemType(type.value)}
                  className={`p-2 rounded-lg border text-left transition ${
                    problemType === type.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg mr-2">{type.icon}</span>
                  <span className="text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about the problem..."
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span className="text-sm">Take Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photo && (
                <div className="relative">
                  <img src={photo} alt="Problem" className="w-16 h-16 object-cover rounded-lg" />
                  <button
                    onClick={() => setPhoto(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Current Location */}
          {currentLocation && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Current Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Reporting...' : 'Report Problem'}
          </button>
        </div>
      </div>
    </div>
  );
};
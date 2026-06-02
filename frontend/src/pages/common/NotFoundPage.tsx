// src/pages/common/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Logo / Icon */}
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
          <p className="text-xl font-bold text-gray-800 mt-2">Page Not Found</p>
          <p className="text-gray-600 mt-1">The page you are looking for doesn't exist or has been moved.</p>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition shadow-sm"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="mt-6 text-xs text-gray-400">
            LogiTrack AI – Logistics Management Platform
          </div>
        </div>
      </div>
    </div>
  );
};
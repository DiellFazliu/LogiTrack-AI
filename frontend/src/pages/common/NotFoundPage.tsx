// frontend/src/pages/common/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mt-2">Page Not Found</p>
        <Link to="/dashboard" className="mt-4 inline-block text-blue-500 hover:text-blue-600">
          Go back to Dashboard
        </Link>
      </div>
    </div>
  );
};
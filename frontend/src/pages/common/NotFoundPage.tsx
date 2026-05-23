// src/pages/common/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6">
          <img src="/src/assets/logo.svg" alt="LogiTrack AI" className="h-16 mx-auto" />
        </div>
        <h1 className="text-8xl font-bold text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mt-2">Oops! Page not found</p>
        <p className="text-gray-500 mt-1">The page you are looking for does not exist.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go back to Dashboard
        </Link>
      </div>
    </div>
  );
};
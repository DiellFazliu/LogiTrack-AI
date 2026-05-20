// frontend/src/components/shared/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  
  // Super admin nuk ka sidebar (ose mund të keni sidebar të veçantë)
  const hideSidebar = role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        {/* Sidebar - hidden for super admin or if user not logged in */}
        {!hideSidebar && user && (
          <div className="fixed left-0 top-16 bottom-0 z-20">
            <Sidebar />
          </div>
        )}
        {/* Main content - adjust margin based on sidebar visibility */}
        <main 
          className={`flex-1 p-6 transition-all duration-300 ${
            !hideSidebar && user ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
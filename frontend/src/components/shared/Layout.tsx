import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, Navbar, Layout as LayoutComponent } from './Index';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        {!isSuperAdmin && <Sidebar />}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
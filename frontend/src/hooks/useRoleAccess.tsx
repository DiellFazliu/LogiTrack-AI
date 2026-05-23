import { useAuth } from '../context/AuthContext';

export const useRoleAccess = () => {
  const { user, hasRole } = useAuth();

  const isSuperAdmin = () => user?.role === 'super_admin';
  const isCompanyAdmin = () => user?.role === 'company_admin';
  const isDispatcher = () => user?.role === 'dispatcher';
  const isDriver = () => user?.role === 'driver';
  const isCustomer = () => user?.role === 'customer';

  const canManageUsers = () => {
    return hasRole(['super_admin', 'company_admin']);
  };

  const canManageShipments = () => {
    return hasRole(['super_admin', 'company_admin', 'dispatcher']);
  };

  const canViewDrivers = () => {
    return hasRole(['super_admin', 'company_admin', 'dispatcher']);
  };

  const canCreateShipments = () => {
    return hasRole(['super_admin', 'company_admin', 'dispatcher', 'customer']);
  };

  return {
    isSuperAdmin,
    isCompanyAdmin,
    isDispatcher,
    isDriver,
    isCustomer,
    canManageUsers,
    canManageShipments,
    canViewDrivers,
    canCreateShipments,
  };
};
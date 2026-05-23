import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, Phone, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Driver {
  id: string;
  name: string;
  email: string;
  license_number: string;
  phone: string;
  status: string;
  rating: number;
  total_deliveries: number;
  hire_date: string;

  // Optional fields used by EditDriverModal (may exist on backend entity/DTO)
  address?: string;
  hireDate?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  is_active?: boolean;
  licenseNumber?: string;
}


export const DriversList: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);


// Optional: normalize driver objects coming from backend.
// This component already tolerates both snake_case and camelCase fields.

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit modal state (backend has PUT /drivers/:id; UI edit form still TBD)
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/drivers');
      const data = response.data;

      // Normalize: keep both possible shapes (entity vs DTO).
      // Support backend returning either:
      // - Driver[]
      // - { data: Driver[] }
      // - { items: Driver[] }
      const raw = Array.isArray(data)
        ? data
        : (data?.data ?? data?.items ?? []);

      console.log('DriversList: /drivers payload', data);

      const list: Driver[] = raw.map((d: any) => ({
        id: String(d.id),
        // backend Driver entity fields (from TypeORM) are mostly camelCase:
        // - licenseNumber, totalDeliveries, hireDate
        // - user info is under d.user
        // Backend returns name/email derived from user relation.
        // Prefer user.* but keep fallbacks.
        name: d.user?.name ?? d.name ?? '',
        email: d.user?.email ?? d.email ?? '',

        // Map backend driver fields -> UI fields used by EditDriverModal / PUT payload
        // (Use both snake_case and camelCase to tolerate backend serialization differences)
        license_number: d.license_number ?? d.licenseNumber ?? d.licenseNumber ?? '',
        licenseNumber: d.licenseNumber ?? d.license_number ?? '',
        phone: d.phone ?? d.phone_number ?? '',
        status: d.status ?? d.currentStatus ?? '',

        rating: Number(d.rating ?? 0) || 0,
        total_deliveries: Number(d.total_deliveries ?? d.totalDeliveries ?? 0) || 0,

        hire_date: d.hire_date ?? (d.hireDate ? String(d.hireDate) : '') ?? '',
        hireDate: d.hireDate ? String(d.hireDate) : d.hire_date ?? '',

        // prefer camelCase (backend entity serialization), fallback to snake_case
        address: d.address ?? '',
        emergency_contact: d.emergencyContact ?? d.emergency_contact ?? '',
        emergency_phone: d.emergencyPhone ?? d.emergency_phone ?? '',
        is_active: d.isActive ?? d.is_active ?? true,

        // keep legacy fields in case other parts rely on them
        emergencyContact: d.emergencyContact ?? d.emergency_contact ?? '',
        emergencyPhone: d.emergencyPhone ?? d.emergency_phone ?? '',
        isActive: d.isActive ?? d.is_active ?? true,
      }));


      setDrivers(list);

      // Debug helper: if list is empty but request succeeded, we need to inspect backend payload.
      // (Visible in browser console)
      if (list.length === 0) {
        console.warn('DriversList: /drivers returned empty list', data);
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch drivers');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteDriver = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      // Backend performs soft-delete by setting isActive=false.
      // Use the exact DELETE endpoint.
      await api.delete(`/drivers/${id}`);
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error: any) {
      console.error('deleteDriver failed', error);
      const msg = error?.response?.data?.message;
      toast.error(msg || 'Failed to delete driver');
    }
  };

  const updateDriverStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/drivers/${id}/status`, { status });
      toast.success('Driver status updated');
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      on_duty: 'bg-blue-100 text-blue-800',
      on_break: 'bg-yellow-100 text-yellow-800',
      off_duty: 'bg-gray-100 text-gray-800',
      sick: 'bg-red-100 text-red-800',
      vacation: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Drivers</h1>
              <p className="text-gray-500 mt-1">Manage your delivery drivers</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" /> Add Driver
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {drivers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No drivers found</h3>
            <p className="text-gray-500">Click "Add Driver" to create your first driver.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{driver.name}</h3>
                      <p className="text-gray-500 text-sm">{driver.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800"
                      aria-label="Edit driver"
                      title="Edit driver"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toast.error('Edit not implemented yet')}

                      className="text-blue-600 hover:text-blue-800"
                      aria-label="Delete driver"
                      title="Delete driver"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">License:</span>
                    <span className="font-medium">{driver.license_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {driver.phone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <select
                      value={driver.status}
                      onChange={(e) => updateDriverStatus(driver.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(driver.status)} border-0 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="available">Available</option>
                      <option value="on_duty">On Duty</option>
                      <option value="on_break">On Break</option>
                      <option value="off_duty">Off Duty</option>
                      <option value="sick">Sick</option>
                      <option value="vacation">Vacation</option>
                    </select>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating:</span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" /> {driver.rating}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deliveries:</span>
                    <span>{driver.total_deliveries}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Driver Modal */}
      {showCreateModal && (
        <AddDriverModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => fetchDrivers()}
        />
      )}

      {/* Edit Driver Modal */}
      {showEditModal && selectedDriver && (
        <EditDriverModal
          driver={selectedDriver}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDriver(null);
          }}
          onSaved={() => {
            setShowEditModal(false);
            setSelectedDriver(null);
            fetchDrivers();
          }}
        />
      )}
    </div>
  );
};

function EditDriverModal({
  driver,
  onClose,
  onSaved,
}: {
  driver: Driver;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(driver.name ?? '');
  const [email, setEmail] = useState(driver.email ?? '');

  // Backend UpdateDriverDto requires licenseNumber (non-optional),
  // so keep it in state and always send it.
  const [licenseNumber, setLicenseNumber] = useState(
    (driver as any).license_number ?? (driver as any).licenseNumber ?? ''
  );

  const [phone, setPhone] = useState(driver.phone ?? '');
  const [address, setAddress] = useState((driver as any).address ?? '');
  const [status, setStatus] = useState<
    'available' | 'on_duty' | 'on_break' | 'off_duty' | 'sick' | 'vacation'
  >((driver.status as any) || 'available');
  const [hireDate, setHireDate] = useState((driver as any).hire_date ?? '');
  const [emergencyContact, setEmergencyContact] = useState((driver as any).emergency_contact ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState((driver as any).emergency_phone ?? '');
  const [isActive, setIsActive] = useState((driver as any).is_active ?? true);



  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(driver.name ?? '');
    setEmail(driver.email ?? '');

    setLicenseNumber(
      (driver as any).license_number ?? (driver as any).licenseNumber ?? ''
    );

    setPhone(driver.phone ?? '');
    setAddress((driver as any).address ?? '');
    setEmergencyContact(
      (driver as any).emergency_contact ?? (driver as any).emergencyContact ?? ''
    );
    setEmergencyPhone(
      (driver as any).emergency_phone ?? (driver as any).emergencyPhone ?? ''
    );
    setHireDate((driver as any).hire_date ?? (driver as any).hireDate ?? '');
    setIsActive((driver as any).is_active ?? (driver as any).isActive ?? true);

    setStatus((driver.status as any) || 'available');
  }, [driver]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
          const payload = {
            // Backend DTO: CreateDriverDto / UpdateDriverDto fields
            licenseNumber: licenseNumber.trim(),
            phone: phone.trim(),
            address: address.trim() ? address.trim() : undefined,
            status,
            hireDate: hireDate ? hireDate : undefined,
            emergencyContact: emergencyContact.trim() ? emergencyContact.trim() : undefined,
            emergencyPhone: emergencyPhone.trim() ? emergencyPhone.trim() : undefined,
            isActive,
          };

          console.log('EditDriverModal PUT payload', payload);

          await api.put(`/drivers/${driver.id}`, payload);

      toast.success('Driver updated successfully');
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update driver');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[520px] max-w-[95vw]">
        <h2 className="text-xl font-bold mb-4">Edit Driver</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Driver full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Driver email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Number</label>
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. LIC-123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. +383..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address (optional)</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Street, city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hire Date (optional)</label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="available">Available</option>
                <option value="on_duty">On Duty</option>
                <option value="on_break">On Break</option>
                <option value="off_duty">Off Duty</option>
                <option value="sick">Sick</option>
                <option value="vacation">Vacation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact (optional)</label>
              <input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Phone (optional)</label>
              <input
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. +383..."
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700">Active</label>
                <p className="text-xs text-gray-500">
                  If disabled, driver won’t be available for assignment.
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full p-1 transition-colors">
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddDriverModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  // driver table columns (from migrations / entity):
  // id, user_id, organization_id, license_number, phone, address,
  // status, rating, total_deliveries, hire_date, emergency_contact,
  // emergency_phone, is_active, created_at, updated_at
  //
  // UI should collect all editable fields exposed by CreateDriverDto.
  // Backend manages organizationId from JWT; also rating/totalDeliveries are derived defaults.

  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // These fields are part of the Driver's linked User entity.
  // Current backend CreateDriverDto only requires licenseNumber + phone,
  // but the UI collects additional user fields so you can pass them if supported.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [status, setStatus] = useState<
    'available' | 'on_duty' | 'on_break' | 'off_duty' | 'sick' | 'vacation'
  >('available');
  const [hireDate, setHireDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseNumber.trim()) return;
    if (!phone.trim()) return;

    setSubmitting(true);
    try {
        // Must match backend CreateDriverDto field names.
        // If backend supports creating a linked user, pass user fields.
        // Otherwise, it will safely ignore/complain and you can remove these fields.
        // Backend CreateDriverDto currently supports linking to an existing user via `userId`.
        // To avoid creating duplicate driver records, we must not attempt to create the User here.
        // If you want combined create-user+create-driver, that requires backend DTO+service changes.
        // Backend requires `userId` to link a Driver to an existing User.
        // Since the modal UI currently collects user fields (name/email/password) but
        // backend CreateDriverDto doesn't, we cannot safely create the user here.
        // TODO: implement backend CreateDriverDto to accept user fields OR provide a
        // real `userId` to link.
        await api.post('/drivers', {
          // userId must be provided to link a driver to an existing user.
          // For now backend requires it, so we block creation unless you wire user creation/search first.
          userId: undefined,
          name,
          email,
          password,
          licenseNumber: licenseNumber.trim(),
          phone: phone.trim(),
          address: address.trim() ? address.trim() : undefined,
          status,
          hireDate: hireDate ? hireDate : undefined,
          emergencyContact: emergencyContact.trim() ? emergencyContact.trim() : undefined,
          emergencyPhone: emergencyPhone.trim() ? emergencyPhone.trim() : undefined,
          isActive,
        });

      toast.success('Driver created successfully');
      onClose();
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[520px] max-w-[95vw]">
        <h2 className="text-xl font-bold mb-4">Add New Driver</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Driver full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Driver email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Temporary password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. +383..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Number</label>
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. LIC-123"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address (optional)</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Street, city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hire Date (optional)</label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="available">Available</option>
                <option value="on_duty">On Duty</option>
                <option value="on_break">On Break</option>
                <option value="off_duty">Off Duty</option>
                <option value="sick">Sick</option>
                <option value="vacation">Vacation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact (optional)</label>
              <input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Phone (optional)</label>
              <input
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. +383..."
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700">Active</label>
                <p className="text-xs text-gray-500">
                  If disabled, driver won’t be available for assignment.
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only"
                />
                <div className="w-12 h-6 bg-gray-200 rounded-full p-1 transition-colors">
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DriversList;


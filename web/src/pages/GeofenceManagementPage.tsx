import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, clearAuth, getUser } from '@/services/api';
import MapPicker from '@/components/MapPicker';

function GeofenceManagementPage() {
  const user = getUser();
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);
  const [formData, setFormData] = useState({
    warehouse: '',
    latitude: '',
    longitude: '',
    radius_meters: '500',
    enabled: true,
  });
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]);

  useEffect(() => {
    loadGeofenceSettings();
  }, []);

  const loadGeofenceSettings = async () => {
    try {
      const response = await adminApi.getGeofenceSettings();
      if (response.success) {
        setSettings(response.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load geofence settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const data = {
        warehouse: formData.warehouse,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius_meters: parseInt(formData.radius_meters),
        enabled: formData.enabled,
      };

      const response = await adminApi.upsertGeofenceSetting(data);
      if (response.success) {
        setMessage('Geofence setting saved successfully');
        setShowForm(false);
        setEditingSetting(null);
        setFormData({
          warehouse: '',
          latitude: '',
          longitude: '',
          radius_meters: '500',
          enabled: true,
        });
        loadGeofenceSettings();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save geofence setting');
    }
  };

  const handleEdit = (setting: any) => {
    setEditingSetting(setting);
    setFormData({
      warehouse: setting.warehouse,
      latitude: setting.latitude.toString(),
      longitude: setting.longitude.toString(),
      radius_meters: setting.radius_meters.toString(),
      enabled: setting.enabled === 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (warehouse: string) => {
    if (!confirm(`Are you sure you want to delete the geofence setting for ${warehouse}?`)) {
      return;
    }

    try {
      const response = await adminApi.deleteGeofenceSetting(warehouse);
      if (response.success) {
        setMessage('Geofence setting deleted successfully');
        loadGeofenceSettings();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete geofence setting');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSetting(null);
    setFormData({
      warehouse: '',
      latitude: '',
      longitude: '',
      radius_meters: '500',
      enabled: true,
    });
    setShowMap(false);
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  };

  const handleToggleMap = () => {
    if (!showMap) {
      // Set map center to current coordinates if available, or default
      const lat = formData.latitude ? parseFloat(formData.latitude) : 37.7749;
      const lng = formData.longitude ? parseFloat(formData.longitude) : -122.4194;
      setMapCenter([lat, lng]);
    }
    setShowMap(!showMap);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Determine dashboard route based on user role
  const getDashboardRoute = () => {
    const userRole = user?.role;
    if (userRole === 'PickerPacker') return '/picker-dashboard';
    if (userRole === 'ASM') return '/asm-dashboard';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to={getDashboardRoute()} className="text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Geofence Settings</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Add New Setting
              </button>
            )}
          </div>

          {message && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {showForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSetting ? 'Edit' : 'Add'} Geofence Setting
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    placeholder="e.g., WH1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="e.g., 37.7749"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="e.g., -122.4194"
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleToggleMap}
                    className="text-sm text-primary-600 hover:text-primary-800 underline"
                  >
                    {showMap ? 'Hide Map' : '📍 Select Location on Map'}
                  </button>
                </div>
                {showMap && formData.latitude && formData.longitude && (
                  <div className="mt-2">
                    <MapPicker
                      center={mapCenter}
                      zoom={13}
                      radius={parseInt(formData.radius_meters) || 500}
                      onLocationSelect={handleMapLocationSelect}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
                  <input
                    type="number"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.radius_meters}
                    onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
                    placeholder="e.g., 500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                    Enabled
                  </label>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Longitude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Radius (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {setting.warehouse}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {setting.latitude}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {setting.longitude}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {setting.radius_meters}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {setting.enabled ? (
                        <span className="text-green-600">Enabled</span>
                      ) : (
                        <span className="text-red-600">Disabled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(setting)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(setting.warehouse)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default GeofenceManagementPage;

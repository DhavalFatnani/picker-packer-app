import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUser, clearAuth } from '@/services/api';
import { adminApi } from '@/services/api';

function ASMDashboardPage() {
  const user = getUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'active' | 'inactive' | 'logged_in' | 'not_logged_in'>('all');
  const [pickerPackers, setPickerPackers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPickerPackers();
  }, []);

  const loadPickerPackers = async () => {
    try {
      setLoading(true);
      // Get all users
      const response = await adminApi.getAllUsers();
      
      // Filter to get all PickerPackers
      const allUsers = response.data || [];
      const ppUsers = allUsers.filter((u: any) => u.role === 'PickerPacker');
      
      setPickerPackers(ppUsers);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load picker packers');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  // Filter pickers based on selection
  const filteredPickers = pickerPackers.filter(picker => {
    if (pickerFilter === 'all') return true;
    if (pickerFilter === 'active') return picker.status === 'Approved' || picker.status === 'Active';
    if (pickerFilter === 'inactive') return picker.status === 'Inactive';
    if (pickerFilter === 'logged_in') return false; // TODO: Implement login tracking
    if (pickerFilter === 'not_logged_in') return true; // TODO: Implement login tracking
    return true;
  });

  // Calculate stats from real data
  const stats = {
    totalPickers: pickerPackers.length,
    activePickers: pickerPackers.filter(p => p.status === 'Approved' || p.status === 'Active').length,
    loggedInPickers: 0, // TODO: Implement real-time login tracking
    tasksInProgress: 0, // TODO: Get from tasks API
    tasksCompletedToday: 0, // TODO: Get from tasks API
    avgTasksPerPicker: 0, // TODO: Calculate from tasks data
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ASM Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <span className="text-xs text-gray-500">({user?.role})</span>
              <Link to="/approvals" className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700">
                Approvals
              </Link>
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
          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading picker packers...</p>
            </div>
          ) : (
            <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Pickers</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalPickers}</dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.activePickers}</dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Logged In</dt>
                  <dd className="mt-1 text-3xl font-semibold text-blue-600">{stats.loggedInPickers}</dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.tasksInProgress}</dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="mt-1 text-3xl font-semibold text-purple-600">{stats.tasksCompletedToday}</dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Tasks</dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">{stats.avgTasksPerPicker}</dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`${
                  activeTab === 'tasks'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Create & Assign Tasks
              </button>
            </nav>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Picker Packers List */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Picker Packers</h3>
                    <div className="flex space-x-2">
                      <select
                        value={pickerFilter}
                        onChange={(e) => setPickerFilter(e.target.value as any)}
                        className="text-sm border-gray-300 rounded-md"
                      >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="logged_in">Logged In</option>
                        <option value="not_logged_in">Not Logged In</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Picker ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Logged In
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Task
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tasks Completed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPickers.map((picker) => (
                          <tr key={picker.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {picker.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{picker.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  picker.status === 'Approved' || picker.status === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {picker.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800`}
                              >
                                N/A
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              N/A
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              0
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-primary-600 hover:text-primary-900">View Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Shift Overview - TODO: Implement with real shift data */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Shift Overview</h3>
                  <p className="text-sm text-gray-500 mt-1">Current shift activity across the warehouse</p>
                </div>
                <div className="p-6">
                  <div className="text-center text-gray-500">
                    <p>Shift data will appear here when available</p>
                    <p className="text-sm mt-2">Create tasks to see activity</p>
                  </div>
                </div>
              </div>

              {/* Warehouse Activity - TODO: Implement with real task activity */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Warehouse Activity</h3>
                  <p className="text-sm text-gray-500 mt-1">Real-time activity by PickerPacker level</p>
                </div>
                <div className="p-6">
                  <div className="text-center text-gray-500">
                    <p>Activity will appear here as pickers work on tasks</p>
                    <p className="text-sm mt-2">Assign tasks to see real-time activity</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create & Assign Tasks</h3>
                <p className="text-sm text-gray-500 mt-1">Create new tasks and assign them to picker packers</p>
              </div>
              <div className="p-6">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Task Type
                      </label>
                      <select className="w-full border-gray-300 rounded-md shadow-sm">
                        <option>Customer Order Pick</option>
                        <option>RTV Pick</option>
                        <option>Shoot Pick</option>
                        <option>Inventory Adjustment</option>
                        <option>Putaway</option>
                        <option>Bin to Bin Movement</option>
                        <option>Cycle Count</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign To
                      </label>
                      <select className="w-full border-gray-300 rounded-md shadow-sm">
                        {pickerPackers.map((picker) => (
                          <option key={picker.id} value={picker.id}>
                            {picker.name} ({picker.employee_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Details
                    </label>
                    <input
                      type="text"
                      placeholder="Enter order/task number"
                      className="w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input type="radio" name="priority" value="high" className="mr-2" />
                        <span className="text-sm">High</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="priority" value="medium" className="mr-2" defaultChecked />
                        <span className="text-sm">Medium</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="priority" value="low" className="mr-2" />
                        <span className="text-sm">Low</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Add any additional notes or instructions"
                      className="w-full border-gray-300 rounded-md shadow-sm"
                    ></textarea>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Create & Assign Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ASMDashboardPage;

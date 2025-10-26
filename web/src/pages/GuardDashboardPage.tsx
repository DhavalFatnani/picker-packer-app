import { useState, useEffect } from 'react';
import { clearAuth, getUser } from '@/services/api';

function GuardDashboardPage() {
  const user = getUser();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadEntries(true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadEntries = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      // TODO: Implement API endpoint for guard entries
      // For now, using placeholder data
      setEntries([]);
    } catch (err: any) {
      console.error('Failed to load entries:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Security & Access Control</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <span className="text-xs text-gray-500">({user?.employee_id})</span>
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
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Entry/Exit Log</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor and manage warehouse access</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Entries</dt>
                  <dd className="mt-1 text-2xl font-semibold text-green-600">0</dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today Entries</dt>
                  <dd className="mt-1 text-2xl font-semibold text-blue-600">0</dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today Exits</dt>
                  <dd className="mt-1 text-2xl font-semibold text-orange-600">0</dd>
                </dl>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Visitors</dt>
                  <dd className="mt-1 text-2xl font-semibold text-purple-600">0</dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Entry/Exit Log */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading entries...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🚪</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Entries Yet</h3>
                  <p className="text-sm text-gray-500">Entry and exit logs will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Entry logs will be rendered here */}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
              + Record Entry
            </button>
            <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium">
              + Record Exit
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default GuardDashboardPage;

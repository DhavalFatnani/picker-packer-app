import { Link } from 'react-router-dom';
import { getUser, clearAuth } from '@/services/api';

// Role-based dashboard configuration
const ROLE_DASHBOARDS = {
  PickerPacker: {
    title: 'PickerPacker Dashboard',
    subtitle: 'Your daily operations hub',
    quickActions: [
      { icon: '📋', title: 'My Tasks', description: 'View assigned tasks', color: 'blue' },
      { icon: '🔍', title: 'Scan Barcode', description: 'Start scanning', color: 'green' },
      { icon: '📊', title: 'Shift Status', description: 'View shift details', color: 'purple' },
    ],
    stats: [
      { label: 'Tasks Today', value: '12', change: '+2' },
      { label: 'Completed', value: '8', change: '+1' },
      { label: 'In Progress', value: '3', change: '+3' },
    ],
  },
  ASM: {
    title: 'ASM Dashboard',
    subtitle: 'Area Sales Manager Control Panel',
    quickActions: [
      { icon: '✅', title: 'Pending Approvals', description: 'Approve users', color: 'blue', link: '/approvals' },
      { icon: '📢', title: 'Announcements', description: 'Manage notices', color: 'orange' },
      { icon: '📊', title: 'Reports', description: 'View reports', color: 'purple' },
    ],
    stats: [
      { label: 'Pending Approvals', value: '5', change: '-2' },
      { label: 'Active Pickers', value: '24', change: '+3' },
      { label: 'Tasks Today', value: '156', change: '+12' },
    ],
  },
  StoreManager: {
    title: 'Store Manager Dashboard',
    subtitle: 'Store Operations Management',
    quickActions: [
      { icon: '📦', title: 'Inventory Overview', description: 'Stock levels', color: 'blue' },
      { icon: '👥', title: 'Staff Management', description: 'Manage staff', color: 'green' },
      { icon: '📈', title: 'Performance', description: 'View metrics', color: 'purple' },
    ],
    stats: [
      { label: 'Total Inventory', value: '1,245', change: '+45' },
      { label: 'Active Staff', value: '18', change: '+2' },
      { label: 'Orders Today', value: '89', change: '+15' },
    ],
  },
  OpsAdmin: {
    title: 'Operations Admin Dashboard',
    subtitle: 'System-wide Administration',
    quickActions: [
      { icon: '✅', title: 'Pending Approvals', description: 'Approve users', color: 'blue', link: '/approvals' },
      { icon: '🗺️', title: 'Geofence Settings', description: 'Manage locations', color: 'green', link: '/geofence' },
      { icon: '⚙️', title: 'System Settings', description: 'Configure system', color: 'purple' },
    ],
    stats: [
      { label: 'Total Users', value: '156', change: '+12' },
      { label: 'Active Shifts', value: '42', change: '+5' },
      { label: 'Warehouses', value: '8', change: '+1' },
    ],
  },
};

function DashboardPage() {
  const user = getUser();
  const role = user?.role || 'PickerPacker';
  const dashboard = ROLE_DASHBOARDS[role as keyof typeof ROLE_DASHBOARDS] || ROLE_DASHBOARDS.PickerPacker;

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
              <h1 className="text-xl font-bold text-gray-900">PickerPacker Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <span className="text-xs text-gray-500">({user?.role})</span>
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
            <h2 className="text-2xl font-bold text-gray-900">{dashboard.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{dashboard.subtitle}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            {dashboard.stats.map((stat, index) => (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd className="mt-1 flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {dashboard.quickActions.map((action, index) => {
              const colorClasses = {
                blue: 'bg-blue-500',
                green: 'bg-green-500',
                purple: 'bg-purple-500',
                orange: 'bg-orange-500',
              };

              const content = (
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${colorClasses[action.color as keyof typeof colorClasses]} rounded-md p-3 text-2xl`}>
                      {action.icon}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{action.title}</dt>
                        <dd className="text-lg font-medium text-gray-900">{action.description}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              );

              if (action.link) {
                return (
                  <Link
                    key={index}
                    to={action.link}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={index}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  {content}
                </div>
              );
            })}
          </div>

          {/* Welcome message */}
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 shadow-lg rounded-lg p-6 text-white">
            <h3 className="text-lg font-medium mb-2">Welcome, {user?.name}!</h3>
            <p className="text-white text-opacity-90">
              {role === 'PickerPacker' && 'Track your tasks, scan items, and complete your daily assignments efficiently.'}
              {role === 'ASM' && 'Approve users, send announcements, and monitor your team\'s performance.'}
              {role === 'StoreManager' && 'Oversee inventory, manage staff, and ensure smooth store operations.'}
              {role === 'OpsAdmin' && 'Full system administration: manage users, geofences, and system-wide settings.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

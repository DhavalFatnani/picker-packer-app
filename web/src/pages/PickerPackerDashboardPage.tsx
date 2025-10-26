import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUser, clearAuth, tasksApi } from '@/services/api';

function PickerPackerDashboardPage() {
  const user = getUser();
  const [packingQueue, setPackingQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadPackingQueue();
    
    // Auto-refresh every 5 seconds (silent mode - no loading spinner)
    const interval = setInterval(() => {
      loadPackingQueue(true);
    }, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const loadPackingQueue = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await tasksApi.getPackingQueue();
      if (response.success) {
        setPackingQueue(response.data || []);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.response?.data?.error?.message || 'Failed to load packing queue');
      }
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

  const handleStartPacking = async (taskId: string) => {
    try {
      // In a real implementation, this would assign the task to the current packer
      alert(`Starting to pack task ${taskId}\n\nThis would assign the task to you and mark it as InProgress.`);
      await loadPackingQueue(); // Refresh the queue
    } catch (err: any) {
      alert(err.message || 'Failed to start packing');
    }
  };

  // Since packing queue now returns orders with status 'Picked', all are customer orders
  const customerOrders = packingQueue;
  const otherTasks: any[] = []; // No other tasks in packing queue anymore

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Packing Dashboard</h1>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Packing Operations</h2>
                <p className="text-sm text-gray-500 mt-1">Manage packing queue and complete orders</p>
              </div>
              {lastUpdated && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">● Auto-refreshing</p>
                </div>
              )}
            </div>
          </div>

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
              <p className="mt-4 text-gray-600">Loading packing queue...</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Packing Queue</dt>
                      <dd className="mt-1">
                        <div className="text-2xl font-semibold text-gray-900">{packingQueue.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                      <dd className="mt-1">
                        <div className="text-2xl font-semibold text-yellow-600">
                          {packingQueue.filter(t => t.status === 'InProgress').length}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                      <dd className="mt-1">
                        <div className="text-2xl font-semibold text-green-600">
                          {packingQueue.filter(t => t.status === 'Completed').length}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                      <dd className="mt-1">
                        <div className="text-2xl font-semibold text-blue-600">
                          {packingQueue.reduce((sum, order) => 
                            sum + (order.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 1), 0) || 0)
                          , 0)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

                        {/* Packing Queue */}
              {packingQueue.length > 0 ? (
                <div className="mb-6 space-y-6">
                  {customerOrders.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Customer Orders</h3>
                            <p className="text-sm text-gray-500 mt-1">Orders ready to pack</p>
                          </div>
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {customerOrders.length} orders
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {customerOrders.slice(0, 5).map((order) => (
                            <div key={`${order.id}-${lastUpdated?.getTime()}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 border border-gray-200">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium text-gray-900">{order.order_number || order.id}</span>
                                  {order.customer_name && (
                                    <span className="text-sm text-gray-600">• {order.customer_name}</span>
                                  )}
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    order.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                    order.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {order.priority}
                                  </span>
                                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Picked</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0} items • Warehouse: {order.warehouse}
                                </p>
                              </div>
                              <button
                                onClick={() => handleStartPacking(order.id)}
                                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                              >
                                Start Packing
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {false && otherTasks.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Other Tasks</h3>
                            <p className="text-sm text-gray-500 mt-1">RTV, Shoot, and special tasks</p>
                          </div>
                          <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            {otherTasks.length} tasks
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {otherTasks.slice(0, 5).map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium text-gray-900">Task #{task.id.slice(0, 8)}</span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                    task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {task.priority}
                                  </span>
                                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">Special</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {task.items?.length || 0} items • {task.notes || 'No notes'}
                                </p>
                              </div>
                              <button
                                onClick={() => handleStartPacking(task.id)}
                                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                              >
                                Start Packing
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-12 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Packing Tasks Available</h3>
                  <p className="text-sm text-gray-500">
                    Packing tasks will appear here once pickers complete their pick tasks in the mobile app.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Quick Actions */}
          {!loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
              <button
                onClick={() => alert('Opening packing station...')}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-4xl mb-2">📦</div>
                <div className="text-sm font-medium text-gray-900">Packing Station</div>
                <div className="text-xs text-gray-500 mt-1">Access packing tools</div>
              </button>
              <button
                onClick={() => alert('Opening order search...')}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-4xl mb-2">🔍</div>
                <div className="text-sm font-medium text-gray-900">Search Orders</div>
                <div className="text-xs text-gray-500 mt-1">Find specific order</div>
              </button>
              <button
                onClick={() => alert('Opening reports...')}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-4xl mb-2">📊</div>
                <div className="text-sm font-medium text-gray-900">My Performance</div>
                <div className="text-xs text-gray-500 mt-1">View statistics</div>
              </button>
            </div>
          )}

          {/* Help Section */}
          {!loading && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg rounded-lg p-6 text-white">
              <div className="flex items-start">
                <div className="flex-shrink-0 text-3xl mr-4">📚</div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">Need Help?</h3>
                  <p className="text-white text-opacity-90 text-sm mb-4">
                    For picking tasks, use the mobile app. For packing operations, use this dashboard.
                  </p>
                  <div className="flex space-x-4 text-sm">
                    <button className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors">
                      Packing Guide
                    </button>
                    <button className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PickerPackerDashboardPage;

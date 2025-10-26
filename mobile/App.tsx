import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { api } from './src/services/api';
import { Scanner } from './src/components/Scanner';
import { SelfieCapture } from './src/components/SelfieCapture';
import { TasksMenu } from './src/components/TasksMenu';
import { TaskDetailScreen } from './src/components/TaskDetailScreen';
import { OrderPickingScreen } from './src/components/OrderPickingScreen';
import { OrderPickingDetailScreen } from './src/components/OrderPickingDetailScreen';
import { OrderCard } from './src/components/OrderCard';
import * as FileSystem from 'expo-file-system';

type ViewMode = 'auth' | 'dashboard' | 'task-detail' | 'order-picking' | 'order-picking-detail';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [shiftStats, setShiftStats] = useState({
    itemsPicked: 0,
    ordersPicked: 0,
    putawayCount: 0,
    binToBinMoved: 0,
    cycleCounts: 0,
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showTasksMenu, setShowTasksMenu] = useState(false);
  const [showAllCustomerOrders, setShowAllCustomerOrders] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [selfieForShiftAction, setSelfieForShiftAction] = useState<'start' | 'end' | null>(null);
  
  // OTP Reset Pin State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  // Calculate shift statistics from tasks
  useEffect(() => {
    if (!activeShift) {
      setShiftStats({
        itemsPicked: 0,
        ordersPicked: 0,
        putawayCount: 0,
        binToBinMoved: 0,
        cycleCounts: 0,
      });
      return;
    }

    const stats = {
      itemsPicked: 0,
      ordersPicked: 0,
      putawayCount: 0,
      binToBinMoved: 0,
      cycleCounts: 0,
    };

    tasks.forEach((task: any) => {
      switch (task.type?.toLowerCase()) {
        case 'pick':
          // Count completed pick tasks as orders picked
          if (task.status === 'Completed' || task.status === 'Picked') {
            stats.ordersPicked++;
          }
          
          // Count items scanned from pick tasks (both in progress and completed)
          if (task.items) {
            task.items.forEach((item: any) => {
              stats.itemsPicked += item.quantity_scanned || 0;
            });
          }
          break;
        case 'putaway':
          // Only count completed putaway tasks
          if (task.status === 'Completed') {
            stats.putawayCount += task.items?.length || 0;
          }
          break;
        case 'bintobin':
        case 'bin_to_bin':
          // Only count completed bin-to-bin tasks
          if (task.status === 'Completed') {
            stats.binToBinMoved += task.items?.length || 0;
          }
          break;
        case 'cyclecount':
        case 'cycle_count':
          // Only count completed cycle count tasks
          if (task.status === 'Completed') {
            stats.cycleCounts += task.items?.length || 0;
          }
          break;
      }
    });

    setShiftStats(stats);
  }, [tasks, activeShift]);

  const loadDashboard = async () => {
    try {
      // Load tasks and orders in parallel
      const [tasksData, ordersData] = await Promise.all([
        api.getTasks(),
        api.getOrders()
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      
      // Filter out completed orders (Picked, Packed, Shipped)
      const activeOrders = Array.isArray(ordersData) 
        ? ordersData.filter((order: any) => 
            order.status !== 'Picked' && order.status !== 'Packed' && order.status !== 'Shipped'
          )
        : [];
      setOrders(activeOrders);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setTasks([]);
      setOrders([]);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please enter your name and phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.signup(name, phone);
      Alert.alert(
        'Account Created!',
        `Employee ID: ${response.employee_id}\n\n🔐 Your PIN: ${response.pin}\n\n⚠️ IMPORTANT: Save this PIN securely!\n\nYou will need it to login after ASM approval.`,
        [
          {
            text: 'I\'ve Saved My PIN',
            onPress: () => {
              // Clear form and switch to login
              setName('');
              setPhone('');
              setIsLogin(true);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone.trim() || !pin.trim()) {
      Alert.alert('Error', 'Please enter phone and PIN');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(phone, pin);
      setUser(data.user);
      
      // Try to fetch active shift after login
      try {
        const activeShiftData = await api.getActiveShift();
        if (activeShiftData) {
          setActiveShift(activeShiftData);
        }
      } catch (error) {
        // No active shift, that's fine
        console.log('No active shift found');
      }
      
      setViewMode('dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number first');
      return;
    }

    setLoading(true);
    try {
      const response = await api.requestOTP(phone);
      setOtpSent(true);
      Alert.alert(
        'OTP Sent',
        `Your OTP is: ${response.otp}\n\n(In production, this would be sent via SMS)\n\nValid for 5 minutes.`,
        [{ text: 'OK', onPress: () => setShowOTPModal(true) }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.verifyOTPAndResetPin(phone, otp);
      setShowOTPModal(false);
      setOtpSent(false);
      setOtp('');
      Alert.alert(
        'PIN Reset Successfully',
        `Your new PIN is: ${response.pin}\n\n⚠️ Please save this PIN securely!`,
        [
          {
            text: 'I\'ve Saved It',
            onPress: () => {
              setPin(''); // Clear PIN field for user to enter new one
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setActiveShift(null);
    setTasks([]);
    setAnnouncements([]);
    setPhone('');
    setPin('');
  };

  const handleStartShift = () => {
    // Show selfie capture
    setSelfieForShiftAction('start');
    setShowSelfieCapture(true);
  };

  const handleStartShiftWithSelfie = async (selfieUri: string) => {
    try {
      setLoading(true);
      
      console.log('Starting shift with selfie...');
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to start a shift');
        setLoading(false);
        return;
      }

      // Get current location
      console.log('Getting current location...');
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      console.log('Location:', { latitude, longitude });

      // Start shift via API
      console.log('Calling API to start shift...');
      const response = await api.startShift(latitude, longitude, selfieUri);
      console.log('Shift response:', response);
      
      // Set active shift from response
      const shift = response.shift || response;
      setActiveShift(shift);
      console.log('Active shift set:', shift);
      
      Alert.alert('Shift Started', 'Your shift has been started successfully!');
      await loadDashboard();
    } catch (error: any) {
      console.error('Start shift error:', error);
      Alert.alert('Error', error.message || 'Failed to start shift');
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = () => {
    // Show selfie capture
    setSelfieForShiftAction('end');
    setShowSelfieCapture(true);
  };

  const handleEndShiftWithSelfie = async (selfieUri: string) => {
    try {
      setLoading(true);

      // End shift via API with selfie
      const response = await api.endShift(selfieUri);
      setActiveShift(null);
      
      const summary = response.summary;
      Alert.alert(
        'Shift Ended',
        `Shift completed!\n\nTasks: ${summary.tasks_completed}\nDuration: ${summary.duration_minutes} min`
      );
      await loadDashboard();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to end shift');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskPress = (task: any) => {
    setSelectedTask(task);
    setViewMode('task-detail');
  };

  const handleBackToDashboard = async () => {
    // Reload dashboard data to get latest task updates
    await loadDashboard();
    setViewMode('dashboard');
    setSelectedTask(null);
  };

  const handleCompleteTask = async () => {
    await loadDashboard();
    // Navigate back to Order Picking Screen after completing an order
    setViewMode('order-picking');
  };

  const handleShowOrderPicking = () => {
    setViewMode('order-picking');
  };

  const handleStartOrderPicking = async (taskOrOrderId: string | any) => {
    try {
      let taskToUse = null;
      
      console.log('handleStartOrderPicking called with:', taskOrOrderId);
      
      // If it's a task object, use it directly
      if (typeof taskOrOrderId === 'object' && taskOrOrderId.task) {
        // It's an order object with task included
        taskToUse = taskOrOrderId.task;
        console.log('Using task from order object:', taskToUse);
      } else if (typeof taskOrOrderId === 'object') {
        // It's a task object directly
        taskToUse = taskOrOrderId;
        console.log('Using task object directly:', taskToUse);
      } else {
        // It's an orderId string - fetch the full order with task
        console.log('Fetching order by ID:', taskOrOrderId);
        setLoading(true);
        const orderData = await api.getOrder(taskOrOrderId);
        console.log('Order data received:', orderData);
        
        if (orderData.task) {
          taskToUse = orderData.task;
          console.log('Using task from order data:', taskToUse);
        } else {
          // Fallback: try to find task in local tasks list
          console.log('No task in order data, searching local tasks...');
          taskToUse = tasks.find((t: any) => t.notes?.includes(taskOrOrderId));
          console.log('Found task in local list:', taskToUse);
        }
      }
      
      if (taskToUse) {
        console.log('Setting selected task and navigating to order-picking-detail');
        setSelectedTask(taskToUse);
        setViewMode('order-picking-detail');
      } else {
        console.error('Task not found for order:', taskOrOrderId);
        Alert.alert('Error', 'Task not found for this order');
      }
    } catch (error: any) {
      console.error('Error starting order picking:', error);
      console.error('Error stack:', error.stack);
      
      // More detailed error message
      const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';
      console.error('Error message:', errorMessage);
      Alert.alert('Error', `Failed to load order details: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const isCustomerOrderTask = (task: any) => {
    return (task.type === 'Pick' || task.type === 'pick') && 
           task.notes?.toLowerCase().includes('order');
  };

  // Helper functions for OrderCard component
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return { bg: '#ff3b30', text: '#fff' };
      case 'high':
        return { bg: '#ff9500', text: '#fff' };
      case 'normal':
        return { bg: '#8e8e93', text: '#fff' };
      case 'low':
        return { bg: '#e5e5ea', text: '#8e8e93' };
      default:
        return { bg: '#8e8e93', text: '#fff' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned':
        return '#007aff';
      case 'InProgress':
        return '#ff9500';
      case 'Picked':
        return '#34c759';
      default:
        return '#8e8e93';
    }
  };

  const estimatePickTime = (itemCount: number) => {
    return Math.ceil(itemCount * 3);
  };

  const getZones = (items: any[]) => {
    const zones = ['A', 'B']; // Simplified for now
    return zones.join(', ');
  };

  const getDueTime = (assignedAt: string) => {
    if (!assignedAt) return 'N/A';
    const date = new Date(assignedAt);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const taskToOrder = (task: any) => {
    // Convert task to order format for OrderCard
    return {
      id: task.id,
      order_number: task.notes || 'Unknown',
      customer_name: 'Customer', // Will be fetched from backend
      priority: task.priority || 'Normal',
      status: task.status || 'Assigned',
      total_items: task.items?.length || 0,
      warehouse: task.warehouse || 'Unknown',
      assigned_at: task.assigned_at || new Date().toISOString(),
      items: task.items || [],
    };
  };

  const handleScan = (data: string, type: string) => {
    Alert.alert('Scan Successful', `Type: ${type}\nData: ${data}`, [
      { text: 'OK' },
    ]);
  };

  const handleSelfieCapture = (selfieUri: string) => {
    if (selfieForShiftAction === 'start') {
      handleStartShiftWithSelfie(selfieUri);
    } else if (selfieForShiftAction === 'end') {
      handleEndShiftWithSelfie(selfieUri);
    }
  };

  // Order Picking Detail View
  if (user && viewMode === 'order-picking-detail' && selectedTask) {
    return (
      <OrderPickingDetailScreen
        task={selectedTask}
        onBack={handleBackToDashboard}
        onTaskComplete={handleCompleteTask}
      />
    );
  }

  // Order Picking View
  if (user && viewMode === 'order-picking') {
    return (
      <OrderPickingScreen
        onBack={handleBackToDashboard}
        onStartPicking={handleStartOrderPicking}
        orders={orders}
      />
    );
  }

  // Task Detail View
  if (user && viewMode === 'task-detail' && selectedTask) {
    return (
      <TaskDetailScreen
        task={selectedTask}
        onBack={handleBackToDashboard}
        onTaskComplete={handleCompleteTask}
      />
    );
  }

  // Dashboard View
  if (user && viewMode === 'dashboard') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView style={styles.scrollView}>
        
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello, {user.name}!</Text>
              <Text style={styles.employeeId}>{user.employee_id}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shift Summary</Text>
          {activeShift ? (
            <View style={styles.shiftActiveCard}>
              <View style={styles.shiftHeaderRow}>
                <View style={styles.shiftStatusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.shiftStatusActive}>Active Shift</Text>
                </View>
                <TouchableOpacity 
                  onPress={handleEndShift}
                  style={styles.endShiftButton}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.endShiftButtonText}>End Shift</Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.shiftInfo}>
                <View style={styles.shiftInfoItem}>
                  <Text style={styles.shiftInfoLabel}>Start Time</Text>
                  <Text style={styles.shiftInfoValue}>
                    {activeShift.started_at 
                      ? new Date(activeShift.started_at).toLocaleString() 
                      : activeShift.start_time 
                        ? new Date(activeShift.start_time).toLocaleString()
                        : 'N/A'}
                  </Text>
                </View>
                <View style={styles.shiftInfoItem}>
                  <Text style={styles.shiftInfoLabel}>Warehouse</Text>
                  <Text style={styles.shiftInfoValue}>{activeShift.warehouse || 'N/A'}</Text>
                </View>
              </View>
              
              {/* Shift Statistics */}
              <View style={styles.shiftStatsContainer}>
                <View style={styles.shiftStatsGrid}>
                  <View style={styles.shiftStatItem}>
                    <Text style={styles.shiftStatValue}>{shiftStats.itemsPicked}</Text>
                    <Text style={styles.shiftStatLabel}>Items Picked</Text>
                  </View>
                  <View style={styles.shiftStatItem}>
                    <Text style={styles.shiftStatValue}>{shiftStats.ordersPicked}</Text>
                    <Text style={styles.shiftStatLabel}>Orders Picked</Text>
                  </View>
                  <View style={styles.shiftStatItem}>
                    <Text style={styles.shiftStatValue}>{shiftStats.putawayCount}</Text>
                    <Text style={styles.shiftStatLabel}>Putaway</Text>
                  </View>
                  <View style={styles.shiftStatItem}>
                    <Text style={styles.shiftStatValue}>{shiftStats.binToBinMoved}</Text>
                    <Text style={styles.shiftStatLabel}>Bin to Bin</Text>
                  </View>
                  <View style={styles.shiftStatItem}>
                    <Text style={styles.shiftStatValue}>{shiftStats.cycleCounts}</Text>
                    <Text style={styles.shiftStatLabel}>Cycle Counts</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.shiftInactiveCard}>
              <Text style={styles.shiftInactiveText}>⚪ No Active Shift</Text>
              <Text style={styles.shiftInactiveSubtext}>Start your shift to begin tasks and view your shift summary.</Text>
              <TouchableOpacity 
                onPress={handleStartShift} 
                style={styles.startButton}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.startButtonIcon}>▶</Text>
                    <Text style={styles.startButtonText}>Start Shift</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Customer Orders Section - Only show if shift is active */}
        {activeShift && (
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Customer Orders</Text>
            <TouchableOpacity 
              onPress={handleShowOrderPicking}
              style={styles.orderPickingButton}>
              <Text style={styles.orderPickingButtonText}>View All Orders</Text>
            </TouchableOpacity>
          </View>
          {(() => {
            // Use orders from api.getOrders() which are already in the correct format
            const displayOrders = showAllCustomerOrders ? orders : orders.slice(0, 3);
            
            if (orders.length === 0) {
              return <Text style={styles.emptyText}>No customer orders</Text>;
            }
            
            return (
              <>
                {displayOrders.map((order) => {
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStartPicking={handleStartOrderPicking}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      estimatePickTime={estimatePickTime}
                      getZones={getZones}
                      getDueTime={getDueTime}
                    />
                  );
                })}
                
                {orders.length > 3 && (
                  <TouchableOpacity
                    onPress={() => setShowAllCustomerOrders(!showAllCustomerOrders)}
                    style={styles.viewAllButton}>
                    <Text style={styles.viewAllButtonText}>
                      {showAllCustomerOrders ? 'Show Less' : `View All (${orders.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
        </View>
        )}

        {/* Other Tasks Section - Only show if shift is active */}
        {activeShift && (
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Other Tasks</Text>
            <TouchableOpacity 
              onPress={() => setShowTasksMenu(true)}
              style={styles.tasksMenuButton}>
              <Text style={styles.tasksMenuButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          {(() => {
                          const otherTasks = tasks.filter((task: any) => {
                const isPick = task.type === 'Pick' || task.type === 'pick';
                const isCustomerOrder = task.notes?.toLowerCase().includes('order');
                return !isPick || !isCustomerOrder;
              });
            return otherTasks.length === 0 ? (
              <Text style={styles.emptyText}>No other tasks</Text>
            ) : (
              otherTasks.slice(0, 5).map((item) => {
                const taskTypeColors: any = {
                  Pick: { bg: '#e3f2fd', border: '#2196f3', icon: '📦' },
                  pick: { bg: '#e3f2fd', border: '#2196f3', icon: '📦' },
                  Pack: { bg: '#f3e5f5', border: '#9c27b0', icon: '📋' },
                  pack: { bg: '#f3e5f5', border: '#9c27b0', icon: '📋' },
                  Putaway: { bg: '#fff3e0', border: '#ff9800', icon: '📥' },
                  putaway: { bg: '#fff3e0', border: '#ff9800', icon: '📥' },
                  BinToBin: { bg: '#e0f2f1', border: '#009688', icon: '🔄' },
                  bin_to_bin: { bg: '#e0f2f1', border: '#009688', icon: '🔄' },
                  binToBin: { bg: '#e0f2f1', border: '#009688', icon: '🔄' },
                  CycleCount: { bg: '#fce4ec', border: '#e91e63', icon: '🔍' },
                  cycle_count: { bg: '#fce4ec', border: '#e91e63', icon: '🔍' },
                };
                const colors = taskTypeColors[item.type] || { bg: '#f5f5f5', border: '#9e9e9e', icon: '📋' };
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.taskCard, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}
                    onPress={() => handleTaskPress(item)}>
                    <View style={styles.taskCardHeader}>
                      <Text style={styles.taskIcon}>{colors.icon}</Text>
                      <View style={styles.taskCardContent}>
                        <Text style={styles.taskType}>
                          {item.type?.toUpperCase() || 'TASK'}
                        </Text>
                        <Text style={styles.taskWarehouse}>
                          {item.warehouse || 'Unknown'} {item.zone ? `• ${item.zone}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.taskStatusBadge, 
                        item.status === 'completed' && styles.taskStatusBadgeCompleted]}>
                        <Text style={styles.taskStatusText}>
                          {item.status?.toUpperCase() || 'PENDING'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.taskItemCount}>
                      {item.items?.length || 0} item{item.items?.length !== 1 ? 's' : ''}
                    </Text>
                    {item.priority === 'high' && (
                      <Text style={styles.taskPriority}>⚠️ High Priority</Text>
                    )}
                  </TouchableOpacity>
                );
              })
            );
          })()}
        </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {announcements.length === 0 ? (
            <Text style={styles.emptyText}>No announcements</Text>
          ) : (
            announcements.map((ann) => (
              <View key={ann.id} style={styles.announcementCard}>
                <Text style={styles.announcementTitle}>{ann.title}</Text>
                <Text style={styles.announcementMessage}>{ann.message}</Text>
              </View>
            ))
          )}
        </View>
        </ScrollView>
        
        {/* Floating Scan Button */}
        <TouchableOpacity
          style={styles.floatingScanButton}
          onPress={() => setShowScanner(true)}>
          <Text style={styles.scanButtonIcon}>🔍</Text>
        </TouchableOpacity>
        
      {/* Tasks Menu Modal */}
      <Modal
        visible={showTasksMenu}
        animationType="slide"
        onRequestClose={() => setShowTasksMenu(false)}>
        <TasksMenu
          onSelectTaskType={(taskType) => {
            console.log('Selected task type:', taskType);
            setShowTasksMenu(false);
            // Handle task type selection - filter or create tasks
          }}
          onClose={() => setShowTasksMenu(false)}
        />
      </Modal>

      {/* Scanner Modal */}
      <Scanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        title="Global Scan"
        description="Scan any SKU, lock tag, or bin to identify it"
      />
      
      {/* Selfie Capture Modal */}
      <SelfieCapture
        visible={showSelfieCapture}
        onClose={() => {
          setShowSelfieCapture(false);
          setSelfieForShiftAction(null);
        }}
        onCapture={handleSelfieCapture}
        title={selfieForShiftAction === 'start' ? 'Start Shift' : 'End Shift'}
        description={selfieForShiftAction === 'start' 
          ? 'Take a selfie to start your shift' 
          : 'Take a selfie to end your shift'}
      />
      </View>
    );
  }

  // Auth View (default)
  if (!user) {
    return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>PickerPacker</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggle, isLogin && styles.toggleActive]}
            onPress={() => setIsLogin(true)}>
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, !isLogin && styles.toggleActive]}
            onPress={() => setIsLogin(false)}>
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.form}>
        {!isLogin && (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </>
        )}

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1234567890"
          keyboardType="phone-pad"
        />

        {isLogin && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>PIN</Text>
              <TouchableOpacity onPress={handleRequestOTP} disabled={loading}>
                <Text style={styles.forgotPinText}>Forgot PIN?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter 6-digit PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={isLogin ? handleLogin : handleSignup}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.testInfo}>
          Test: +15550000001 / 123456
        </Text>
      </View>

      {/* OTP Modal */}
      <Modal
        visible={showOTPModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOTPModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter OTP</Text>
              <Text style={styles.modalSubtitle}>
                We've sent a 6-digit code to verify your phone number
              </Text>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowOTPModal(false);
                    setOtp('');
                  }}
                  disabled={loading}>
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonConfirmText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
    );
  }

  // Fallback
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  // Modern Header with Gradient
  headerGradient: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.9,
  },
  logoutButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Auth Styles
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1a1a1a',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggle: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#667eea',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  testInfo: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontSize: 13,
  },
  forgotPinText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Dashboard Styles
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  // Shift Card Styles
  shiftActiveCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#4ade80',
  },
  shiftInactiveCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shiftHeaderRow: {
    marginBottom: 16,
  },
  shiftStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  shiftStatusActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  shiftInfo: {
    marginBottom: 16,
  },
  shiftInfoItem: {
    marginBottom: 12,
  },
  shiftInfoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  shiftInfoValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  endShiftButton: {
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  endShiftButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shiftInactiveText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  shiftInactiveSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 160,
  },
  startButtonIcon: {
    color: '#fff',
    fontSize: 20,
    marginRight: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  shiftStatsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  shiftStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shiftStatItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shiftStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  shiftStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 15,
    textAlign: 'center',
    padding: 20,
  },
  // Task Card Styles
  taskCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  taskIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  taskCardContent: {
    flex: 1,
  },
  taskType: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  taskWarehouse: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskStatusBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  taskStatusBadgeCompleted: {
    backgroundColor: '#10b981',
  },
  taskStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  taskItemCount: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 10,
    fontWeight: '500',
  },
  taskPriority: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    fontWeight: '700',
  },
  // Announcement Styles
  announcementCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#92400e',
  },
  announcementMessage: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  // Task Detail Styles
  backButton: {
    fontSize: 18,
    color: '#667eea',
    padding: 8,
    fontWeight: '600',
  },
  taskDetailCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskDetailLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  taskDetailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  itemSku: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  itemLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemLockTag: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  completeButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  // Floating Scan Button
  floatingScanButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  scanButtonIcon: {
    fontSize: 28,
  },
  // Tasks Menu Button
  tasksMenuButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#667eea',
    borderRadius: 20,
  },
  tasksMenuButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // Order Picking Button
  orderPickingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007aff',
    borderRadius: 20,
  },
  orderPickingButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  // View All Orders Button
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '600',
  },
  // OTP Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonConfirm: {
    backgroundColor: '#667eea',
  },
  modalButtonCancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

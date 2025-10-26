import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { api } from '../services/api';

interface OrderItem {
  id: string;
  order_id: string;
  sku_code: string;
  quantity: number;
  quantity_picked: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  priority: string;
  status: string;
  total_items: number;
  warehouse: string;
  assigned_at: string;
  items: OrderItem[];
}

interface OrderPickingScreenProps {
  onBack: () => void;
  onStartPicking: (orderId: string) => void;
  orders?: Order[]; // Pass orders from parent to keep in sync
}

export function OrderPickingScreen({ onBack, onStartPicking, orders: propOrders }: OrderPickingScreenProps) {
  const [orders, setOrders] = useState<Order[]>(propOrders || []);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    if (propOrders) {
      // Use orders from props if available - filter out completed orders
      const activeOrders = propOrders.filter(order => 
        order.status !== 'Picked' && order.status !== 'Packed' && order.status !== 'Shipped'
      );
      setOrders(activeOrders);
    } else {
      // Otherwise load orders
      loadOrders();
    }
  }, [propOrders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      // Filter out completed orders
      const activeOrders = data.filter((order: Order) => 
        order.status !== 'Picked' && order.status !== 'Packed' && order.status !== 'Shipped'
      );
      setOrders(activeOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

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
    // Estimate ~3 minutes per item
    return Math.ceil(itemCount * 3);
  };

  const getZones = (items: OrderItem[]) => {
    // In real implementation, this would get zones from items
    const zones = ['A', 'B']; // Simplified for now
    return zones.join(', ');
  };

  const getDueTime = (assignedAt: string) => {
    // Add 2 hours to assigned time for due time
    const assigned = new Date(assignedAt);
    assigned.setHours(assigned.getHours() + 2);
    return assigned.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: statusBarHeight + 16 }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Order Picking</Text>
          <Text style={styles.subtitle}>Select an order to start picking</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Pick Queue Section */}
        <View style={styles.pickQueueCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>📋</Text>
              <Text style={styles.sectionTitle}>Pick Queue</Text>
            </View>
            <View style={styles.orderCountBadge}>
              <Text style={styles.orderCountText}>{orders.length} orders</Text>
            </View>
          </View>

          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders available</Text>
          ) : (
            orders.map((order) => {
              const priorityColors = getPriorityColor(order.priority);
              const dueTime = getDueTime(order.assigned_at);
              const estimatedTime = estimatePickTime(order.total_items);
              const zones = getZones(order.items || []);

              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderId}>{order.order_number}</Text>
                      <View
                        style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}
                      >
                        <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                          {order.priority}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dueTimeContainer}>
                      <Text style={styles.clockIcon}>🕐</Text>
                      <Text style={styles.dueTime}>Due: {dueTime}</Text>
                    </View>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Customer</Text>
                        <Text style={styles.detailValue}>{order.customer_name || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Items</Text>
                        <Text style={styles.detailValue}>{order.total_items} items</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Zone</Text>
                        <Text style={styles.detailValue}>{zones}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Est. Time</Text>
                        <Text style={styles.detailValue}>{estimatedTime} min</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() =>
                        setShowDetails(showDetails === order.id ? null : order.id)
                      }
                    >
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.startPickingButton}
                      onPress={() => onStartPicking(order.id)}
                    >
                      <Text style={styles.startPickingText}>Start Picking</Text>
                    </TouchableOpacity>
                  </View>

                  {showDetails === order.id && (
                    <View style={styles.orderDetailsExpanded}>
                      <Text style={styles.detailsTitle}>Order Items</Text>
                      {order.items?.map((item, index) => (
                        <View key={index} style={styles.orderItemRow}>
                          <Text style={styles.orderItemText}>
                            {item.sku_code} x{item.quantity} ({item.quantity_picked} picked)
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Today's Performance Section */}
        {orders.length > 0 && (
          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Today's Performance</Text>
            <View style={styles.performanceMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>0</Text>
                <Text style={styles.metricLabel}>Orders Picked</Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: '#007aff' }]}>--</Text>
                <Text style={styles.metricLabel}>Accuracy Rate</Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: '#ff9500' }]}>--</Text>
                <Text style={styles.metricLabel}>Avg Pick Time</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007aff',
  },
  headerContent: {
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8e8e93',
  },
  scrollView: {
    flex: 1,
  },
  pickQueueCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  orderCountBadge: {
    backgroundColor: '#e5e5ea',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderCountText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8e8e93',
    fontSize: 16,
    marginVertical: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    padding: 12,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  dueTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8e8e93',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
  },
  startPickingButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
  },
  startPickingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  orderDetailsExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  orderItemRow: {
    paddingVertical: 4,
  },
  orderItemText: {
    fontSize: 13,
    color: '#8e8e93',
  },
  performanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  performanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007aff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
});

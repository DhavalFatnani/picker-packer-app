import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

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

interface OrderCardProps {
  order: Order;
  onStartPicking: (orderId: string) => void;
  getPriorityColor: (priority: string) => { bg: string; text: string };
  getStatusColor: (status: string) => string;
  estimatePickTime: (itemCount: number) => number;
  getZones: (items: OrderItem[]) => string;
  getDueTime: (assignedAt: string) => string;
}

export function OrderCard({
  order,
  onStartPicking,
  getPriorityColor,
  getStatusColor,
  estimatePickTime,
  getZones,
  getDueTime,
}: OrderCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const priorityColors = getPriorityColor(order.priority);
  const dueTime = getDueTime(order.assigned_at);
  const estimatedTime = estimatePickTime(order.total_items);
  const zones = getZones(order.items || []);

  return (
    <View style={styles.orderCard}>
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
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.startPickingButton}
          onPress={() => onStartPicking((order as any).task || order)}
        >
          <Text style={styles.startPickingText}>Start Picking</Text>
        </TouchableOpacity>
      </View>

      {showDetails && (
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
}

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5ea',
    paddingVertical: 12,
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
    fontWeight: '600',
    color: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007aff',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#007aff',
    fontSize: 14,
    fontWeight: '600',
  },
  startPickingButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#34c759',
    alignItems: 'center',
  },
  startPickingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
});

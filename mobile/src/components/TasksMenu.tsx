import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface TaskCategory {
  title: string;
  tasks: {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
  }[];
}

const TASK_CATEGORIES: TaskCategory[] = [
  {
    title: 'Picking Tasks',
    tasks: [
      {
        id: 'rtv',
        name: 'RTV Pick',
        icon: '📦',
        color: '#ef4444',
        description: 'Return to Vendor picking',
      },
      {
        id: 'shoot',
        name: 'Shoot Pick',
        icon: '📸',
        color: '#f59e0b',
        description: 'Photo shoot picking',
      },
      {
        id: 'inventory_adjustment',
        name: 'Inventory Adjustment',
        icon: '📊',
        color: '#8b5cf6',
        description: 'Adjust inventory levels',
      },
    ],
  },
  {
    title: 'Putaway Tasks',
    tasks: [
      {
        id: 'new_brand',
        name: 'New Brand Putaway',
        icon: '🆕',
        color: '#10b981',
        description: 'Put away new brand inventory',
      },
      {
        id: 'returns',
        name: 'Returns Putaway',
        icon: '🔙',
        color: '#06b6d4',
        description: 'Put away returned items',
      },
      {
        id: 'cancelled_orders',
        name: 'Cancelled Orders Putaway',
        icon: '❌',
        color: '#f97316',
        description: 'Put away cancelled orders',
      },
      {
        id: 'shoot_returns',
        name: 'Shoot Returns Putaway',
        icon: '📷',
        color: '#ec4899',
        description: 'Put away shoot returns',
      },
      {
        id: 'inventory_adjustment_putaway',
        name: 'Inventory Adjustment Putaway',
        icon: '📉',
        color: '#a855f7',
        description: 'Put away adjusted items',
      },
    ],
  },
  {
    title: 'Movement Tasks',
    tasks: [
      {
        id: 'bin_to_bin',
        name: 'Bin to Bin Movement',
        icon: '↔️',
        color: '#3b82f6',
        description: 'Move items between bins',
      },
    ],
  },
  {
    title: 'Counting Tasks',
    tasks: [
      {
        id: 'cycle_count',
        name: 'Cycle Count',
        icon: '🔢',
        color: '#6366f1',
        description: 'Count inventory for accuracy',
      },
    ],
  },
];

interface TasksMenuProps {
  onSelectTaskType: (taskType: string) => void;
  onClose: () => void;
}

export const TasksMenu: React.FC<TasksMenuProps> = ({ onSelectTaskType, onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Tasks</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {TASK_CATEGORIES.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.tasksGrid}>
              {category.tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskCard, { borderLeftColor: task.color }]}
                  onPress={() => onSelectTaskType(task.id)}>
                  <View style={styles.taskIconContainer}>
                    <Text style={styles.taskIcon}>{task.icon}</Text>
                  </View>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#667eea',
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  tasksGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  taskCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskIcon: {
    fontSize: 24,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 14,
  },
});

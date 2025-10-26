import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { Scanner } from './Scanner';
import { api } from '../services/api';

interface TaskDetailScreenProps {
  task: any;
  onBack: () => void;
  onTaskComplete: () => void;
}

export function TaskDetailScreen({ task, onBack, onTaskComplete }: TaskDetailScreenProps) {
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState(task);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  useEffect(() => {
    loadTaskDetails();
  }, [task.id]);

  const loadTaskDetails = async () => {
    try {
      const details = await api.getTaskDetails(task.id);
      setTaskData(details);
    } catch (error) {
      console.error('Failed to load task details:', error);
    }
  };

  const handleScan = async (data: string) => {
    if (selectedItemIndex === null) {
      Alert.alert('Error', 'Please select an item first');
      setShowScanner(false);
      return;
    }

    const item = taskData.items[selectedItemIndex];
    setLoading(true);

    try {
      // Scan the item
      await api.scanTaskItem(task.id, item.id, data);
      
      // Reload task details to get updated quantities
      await loadTaskDetails();
      
      Alert.alert('Success', `Scanned: ${data}`);
      setShowScanner(false);
      setSelectedItemIndex(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to scan item');
    } finally {
      setLoading(false);
    }
  };

  const handleScanItem = (index: number) => {
    setSelectedItemIndex(index);
    setShowScanner(true);
  };

  const handleCompleteTask = async () => {
    Alert.alert(
      'Complete Task',
      'Are you sure all items are picked?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setLoading(true);
            try {
              await api.completeTask(task.id);
              Alert.alert('Success', 'Task completed successfully!');
              onTaskComplete();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete task');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getTaskTypeColor = () => {
    const colors: any = {
      Pick: { bg: '#e3f2fd', border: '#2196f3', icon: '📦' },
      Pack: { bg: '#f3e5f5', border: '#9c27b0', icon: '📋' },
      Putaway: { bg: '#fff3e0', border: '#ff9800', icon: '📥' },
      BinToBin: { bg: '#e0f2f1', border: '#009688', icon: '🔄' },
      CycleCount: { bg: '#fce4ec', border: '#e91e63', icon: '🔍' },
    };
    return colors[taskData.type] || { bg: '#f5f5f5', border: '#9e9e9e', icon: '📋' };
  };

  const getStatusColor = () => {
    const colors: any = {
      Pending: '#ff9800',
      Assigned: '#2196f3',
      InProgress: '#2196f3',
      Completed: '#4caf50',
      Cancelled: '#f44336',
    };
    return colors[taskData.status] || '#9e9e9e';
  };

  const colors = getTaskTypeColor();
  const totalItems = taskData.items?.length || 0;
  const completedItems = taskData.items?.filter((item: any) => 
    (item.scanned_quantity || 0) >= item.required_quantity
  ).length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight + 16 }]}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Task Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Task Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={styles.typeIcon}>{colors.icon}</Text>
          <Text style={styles.typeText}>{taskData.type?.toUpperCase()}</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20', borderColor: getStatusColor() }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {taskData.status?.toUpperCase().replace('_', ' ')}
          </Text>
        </View>

        {/* Task Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warehouse:</Text>
            <Text style={styles.infoValue}>{taskData.warehouse || 'N/A'}</Text>
          </View>
          {taskData.zone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Zone:</Text>
              <Text style={styles.infoValue}>{taskData.zone}</Text>
            </View>
          )}
          {taskData.priority && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Priority:</Text>
              <Text style={[styles.infoValue, { color: taskData.priority === 'High' ? '#f44336' : taskData.priority === 'Urgent' ? '#e91e63' : '#4caf50' }]}>
                {taskData.priority}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress</Text>
            <Text style={styles.progressText}>{completedItems} / {totalItems} items</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.round(progress)}% Complete</Text>
        </View>

        {/* Items Section */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items to Pick</Text>
          {taskData.items && taskData.items.length > 0 ? (
            taskData.items.map((item: any, index: number) => {
              const itemProgress = item.required_quantity > 0 
                ? ((item.scanned_quantity || 0) / item.required_quantity) * 100 
                : 0;
              const isComplete = (item.scanned_quantity || 0) >= item.required_quantity;

              return (
                <View 
                  key={item.id || index} 
                  style={[
                    styles.itemCard,
                    isComplete && styles.itemCardComplete
                  ]}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemSku}>{item.sku}</Text>
                    <View style={[styles.itemStatusBadge, isComplete && styles.itemStatusComplete]}>
                      <Text style={[styles.itemStatusText, isComplete && styles.itemStatusTextComplete]}>
                        {isComplete ? '✓' : '○'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.itemInfo}>
                    {item.bin_location && (
                      <Text style={styles.itemLocation}>📍 {item.bin_location}</Text>
                    )}
                    {item.lock_tag_id && (
                      <Text style={styles.itemLockTag}>🔒 Lock Tag: {item.lock_tag_id}</Text>
                    )}
                  </View>

                  <View style={styles.itemProgress}>
                    <Text style={styles.itemQuantity}>
                      {item.scanned_quantity || 0} / {item.required_quantity}
                    </Text>
                    <View style={styles.itemProgressBar}>
                      <View style={[styles.itemProgressFill, { width: `${itemProgress}%` }]} />
                    </View>
                  </View>

                  {!isComplete && (
                    <TouchableOpacity
                      style={styles.scanButton}
                      onPress={() => handleScanItem(index)}
                      disabled={loading}>
                      <Text style={styles.scanButtonText}>📷 Scan Item</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No items in this task</Text>
          )}
        </View>

        {/* Complete Task Button */}
        {taskData.status !== 'Completed' && (
          <TouchableOpacity
            style={[
              styles.completeButton,
              progress < 100 && styles.completeButtonDisabled
            ]}
            onPress={handleCompleteTask}
            disabled={progress < 100 || loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>
                {progress === 100 
                  ? 'Complete Task'
                  : `Complete Task (${completedItems}/${totalItems})`}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Task Completed Message */}
        {taskData.status === 'Completed' && (
          <View style={styles.taskCompletedMessage}>
            <Text style={styles.taskCompletedText}>✓ Task Completed</Text>
          </View>
        )}
      </ScrollView>

      {/* Scanner Modal */}
      <Scanner
        visible={showScanner}
        onClose={() => {
          setShowScanner(false);
          setSelectedItemIndex(null);
        }}
        onScan={handleScan}
        title="Scan Item"
        description={`Scan ${taskData.items?.[selectedItemIndex || 0]?.sku || 'item'}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 16,
    borderWidth: 2,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  progressPercent: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  itemsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  itemCardComplete: {
    borderLeftColor: '#4caf50',
    backgroundColor: '#f1f8f4',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemSku: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemStatusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemStatusComplete: {
    backgroundColor: '#4caf50',
  },
  itemStatusText: {
    fontSize: 16,
    color: '#666',
  },
  itemStatusTextComplete: {
    color: '#fff',
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemLockTag: {
    fontSize: 14,
    color: '#666',
  },
  itemProgress: {
    marginBottom: 12,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemProgressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  itemProgressFill: {
    height: '100%',
    backgroundColor: '#2196f3',
  },
  scanButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 24,
  },
  taskCompletedMessage: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  taskCompletedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

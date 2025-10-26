import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { api } from '../services/api';

interface OrderPickingDetailScreenProps {
  task: any;
  onBack: () => void;
  onTaskComplete: () => void;
}

export function OrderPickingDetailScreen({ task, onBack, onTaskComplete }: OrderPickingDetailScreenProps) {
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState(task);
  const [lockTags, setLockTags] = useState<any[]>([]); // Each lock tag is a separate "item"
  const [currentLockTagIndex, setCurrentLockTagIndex] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [pendingIssueType, setPendingIssueType] = useState<string | null>(null);
  const [damagePhotoUri, setDamagePhotoUri] = useState<string | null>(null);

  useEffect(() => {
    loadTaskDetails();
    setScanned(false);
  }, [task.id]);

  const loadTaskDetails = async () => {
    try {
      const details = await api.getTaskDetails(task.id);
      setTaskData(details);
      
      // Load lock tags for all task items
      // Each lock tag represents a separate item to scan
      const tags: any[] = [];
      if (details.items) {
        for (const item of details.items) {
          // Use lock_tags from API if available, otherwise create placeholders
          if (item.lock_tags && item.lock_tags.length > 0) {
            // Use real lock tags from the database
            for (const lockTag of item.lock_tags) {
              tags.push({
                id: lockTag.id,
                task_item_id: item.id,
                sku_code: item.sku_code,
                bin_code: item.bin_code,
                lock_tag_code: lockTag.lock_tag_code,
                scanned: lockTag.scanned === 1,
              });
            }
          } else {
            // Fallback: create placeholders based on quantity
            for (let i = 0; i < (item.quantity || 1); i++) {
              tags.push({
                id: `${item.id}-${i}`,
                task_item_id: item.id,
                sku_code: item.sku_code,
                bin_code: item.bin_code,
                lock_tag_code: `${item.bin_code}-${i + 1}`, // Placeholder
                scanned: false,
                item_index: i,
              });
            }
          }
        }
      }
      setLockTags(tags);
      console.log('Loaded lock tags:', tags);
      
      // Find the first unscanned lock tag index
      const firstUnscannedIndex = tags.findIndex(lt => !lt.scanned);
      setCurrentLockTagIndex(firstUnscannedIndex >= 0 ? firstUnscannedIndex : tags.length);
    } catch (error) {
      console.error('Failed to load task details:', error);
    }
  };

  const handleScan = async (data: string) => {
    if (scanned) return;
    
    const currentLockTag = lockTags[currentLockTagIndex];
    if (!currentLockTag) return;

    setScanned(true);
    setLoading(true);

    try {
      // Scan the lock tag
      const result = await api.scanTaskItem(task.id, currentLockTag.task_item_id, data);
      
      // Mark this lock tag as scanned
      const updatedLockTags = [...lockTags];
      updatedLockTags[currentLockTagIndex].scanned = true;
      setLockTags(updatedLockTags);
      
      // Move to next lock tag
      setTimeout(() => {
        if (currentLockTagIndex < lockTags.length - 1) {
          setCurrentLockTagIndex(currentLockTagIndex + 1);
          setScanned(false); // Reset for next lock tag scan
        } else {
          // All lock tags scanned - increment index so currentLockTag becomes null
          setCurrentLockTagIndex(lockTags.length);
          setScanned(false);
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert('Error', error.message || 'Failed to scan item');
      setTimeout(() => setScanned(false), 1000); // Reset after error
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    // Use the actual scanned barcode
    console.log('Barcode scanned:', data);
    handleScan(data);
  };

  // Manual scan increment for testing
  const handleManualScan = () => {
    const currentLockTag = lockTags[currentLockTagIndex];
    if (!currentLockTag) return;

    // Create a timestamp-based barcode for uniqueness
    const testBarcode = `TEST-${Date.now()}`;
    console.log('Manual scan with barcode:', testBarcode);
    handleScan(testBarcode);
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'What issue are you encountering?',
      [
        { 
          text: 'Item Missing', 
          onPress: () => {
            setPendingIssueType('missing_item');
            handleIssue('missing_item');
          }
        },
        { 
          text: 'Damaged Item', 
          onPress: () => {
            setPendingIssueType('damaged_item');
            setShowPhotoModal(true); // Show photo modal for damaged items
          }
        },
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
      ]
    );
  };

  const handleDamagePhotoTaken = () => {
    // After photo is taken, submit the issue report
    setShowPhotoModal(false);
    handleIssue('damaged_item');
  };

  const handleIssue = async (issueType: string) => {
    try {
      setLoading(true);
      
      const issueTypeLabel = issueType === 'missing_item' ? 'Item Missing' : 
                            issueType === 'damaged_item' ? 'Damaged Item' : 'Unknown';
      
      console.log('Reporting issue:', issueType);
      
      // Create exception via API (with photo if available)
      await api.createException(issueTypeLabel, issueType);
      
      // Clear photo state after reporting
      setDamagePhotoUri(null);
      setPendingIssueType(null);
      
      Alert.alert(
        'Issue Reported',
        `${issueTypeLabel} has been reported and submitted for review.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error reporting issue:', error);
      Alert.alert('Error', error.message || 'Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    // Check if task is already completed
    if (task.status === 'Completed' || task.status === 'Picked') {
      console.log('Task already completed, redirecting...');
      onTaskComplete();
      return;
    }

    // Check if all lock tags have been scanned
    const unscannedTags = lockTags.filter(lt => !lt.scanned);
    
    if (unscannedTags.length > 0) {
      Alert.alert(
        'Incomplete Order',
        `You still have ${unscannedTags.length} item(s) to scan.\n\nPlease complete all items before finishing the order.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Complete order immediately without confirmation
    setLoading(true);
    try {
      console.log('Completing task:', task.id);
      await api.completeTask(task.id);
      console.log('Task completed successfully');
      
      // Redirect to Order Picking Screen
      onTaskComplete();
    } catch (error: any) {
      console.error('Error completing order:', error);
      
      // Check if error is "already completed" - just redirect in that case
      if (error.message?.includes('already completed') || error.message?.includes('already been completed')) {
        console.log('Task already completed, redirecting...');
        onTaskComplete();
      } else {
        Alert.alert(
          'Error', 
          error.message || 'An error occurred while completing the order. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getOrderNumber = () => {
    // Extract order number from task notes or use task ID
    if (taskData.notes?.includes('Order ')) {
      return taskData.notes.split('Order ')[1];
    }
    return 'ORD-' + taskData.id.substring(0, 8).toUpperCase();
  };

  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
  
  // Get current lock tag (each lock tag is a separate item to scan)
  const currentLockTag = lockTags[currentLockTagIndex];
  
  // Calculate progress based on current lock tag index
  // Cap progress at 100% when all items are scanned
  const progress = lockTags.length 
    ? Math.min(((currentLockTagIndex + 1) / lockTags.length) * 100, 100)
    : 0;
  const nextLockTags = lockTags.slice(currentLockTagIndex + 1);
  
  // Debug log to see what data we're displaying
  console.log('Rendering with:', {
    currentLockTagIndex,
    totalLockTags: lockTags.length,
    currentLockTag: currentLockTag ? {
      id: currentLockTag.id,
      sku: currentLockTag.sku_code,
      lock_tag: currentLockTag.lock_tag_code,
    } : null,
    progress
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Order Picking</Text>
          <Text style={styles.headerSubtitle}>Picking order {getOrderNumber()}</Text>
        </View>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Return to Queue</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary Card */}
        <View style={styles.orderSummaryCard}>
          <Text style={styles.orderNumber}>Order {getOrderNumber()}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Item {Math.min(currentLockTagIndex + 1, lockTags.length)} of {lockTags.length}
          </Text>
          <Text style={styles.customerText}>Customer: Premium Customer</Text>
        </View>

        {/* Current Lock Tag Card */}
        {currentLockTag && (
          <View style={styles.currentItemCard}>
            <Text style={styles.sectionTitle}>Current Item</Text>
            <View style={styles.itemContent}>
              <View style={styles.itemIcon}>
                <Text style={styles.itemIconText}>📦</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{currentLockTag.sku_code || 'Item Name'}</Text>
                <Text style={styles.itemSku}>SKU: {currentLockTag.sku_code || 'N/A'}</Text>
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{currentLockTag.lock_tag_code || currentLockTag.bin_code || 'A-15-C-03'}</Text>
                </View>
                <View style={styles.quantityRow}>
                  <Text style={styles.quantityText}>
                    Status: {currentLockTag.scanned ? '✓ Scanned' : 'Awaiting Scan'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Scanning Camera Section - Only show if there are items left to scan */}
        {currentLockTag && (
          <>
            <View style={styles.scannerSection}>
              <Text style={styles.sectionTitle}>Scan Barcode</Text>
              {!permission ? (
                <ActivityIndicator size="large" color="#007AFF" />
              ) : !permission.granted ? (
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.scannerContainer}>
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code93', 'code39'],
                    }}
                  />
                  {scanned && (
                    <View style={styles.scannerOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={styles.scannerOverlayText}>Processing...</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Pick Item Actions */}
            <View style={styles.actionSection}>
              {/* Manual Scan Counter Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.testButton]}
                onPress={handleManualScan}
                disabled={loading || scanned}
              >
                <Text style={styles.testButtonText}>
                  ➕ Manual Scan
                </Text>
              </TouchableOpacity>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleReportIssue}
                >
                  <Text style={styles.actionButtonText}>Report Issue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Completion Message */}
        {!currentLockTag && lockTags.length > 0 && (
          <View style={styles.completionMessage}>
            <Text style={styles.completionIcon}>✓</Text>
            <Text style={styles.completionTitle}>All Items Picked</Text>
            <Text style={styles.completionSubtitle}>All items have been successfully scanned. You can now complete the order.</Text>
          </View>
        )}

        {/* Next Lock Tags */}
        {nextLockTags.length > 0 && (
          <View style={styles.nextItemsSection}>
            <Text style={styles.sectionTitle}>Next Items</Text>
            {nextLockTags.map((lockTag: any, index: number) => (
              <View key={index} style={styles.nextItemCard}>
                <Text style={styles.nextItemName}>{lockTag.sku_code || 'Item Name'}</Text>
                <View style={styles.nextItemRow}>
                  <Text style={styles.nextItemLabel}>Location:</Text>
                  <Text style={styles.nextItemValue}>{lockTag.lock_tag_code || 'TBD'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Complete Order Button */}
        {currentLockTagIndex >= lockTags.length - 1 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>Complete Order</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Photo Modal for Damage Reports */}
      <Modal
        visible={showPhotoModal}
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.photoModalContainer}>
          <View style={styles.photoModalHeader}>
            <Text style={styles.photoModalTitle}>Take Photo of Damage</Text>
            <TouchableOpacity
              onPress={() => setShowPhotoModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.photoModalContent}>
            <Text style={styles.photoModalInstruction}>
              Please take a clear photo of the damaged item
            </Text>
            
            {/* Camera preview would go here */}
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Camera View</Text>
            </View>
          </View>
          
          <View style={styles.photoModalActions}>
            <TouchableOpacity
              style={[styles.photoButton, styles.retakeButton]}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.photoButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, styles.usePhotoButton]}
              onPress={handleDamagePhotoTaken}
            >
              <Text style={styles.photoButtonTextWhite}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  orderSummaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
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
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  customerText: {
    fontSize: 14,
    color: '#666',
  },
  currentItemCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
  },
  itemIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIconText: {
    fontSize: 32,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  quantityRow: {
    marginTop: 8,
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  scanProgressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scanProgressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  scannerSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scannerContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  permissionButton: {
    height: 250,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  actionSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  primaryButton: {
    backgroundColor: '#4caf50',
  },
  testButton: {
    backgroundColor: '#ff9800',
    marginBottom: 12,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionButtonIconWhite: {
    fontSize: 20,
    marginRight: 8,
    color: '#fff',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  actionButtonTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  nextItemsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nextItemCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  nextItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  nextItemRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  nextItemLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  nextItemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  completeButton: {
    backgroundColor: '#2196f3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  photoModalContent: {
    flex: 1,
    padding: 16,
  },
  photoModalInstruction: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  photoModalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  photoButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  usePhotoButton: {
    backgroundColor: '#2196f3',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  photoButtonTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  completionMessage: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completionIcon: {
    fontSize: 64,
    color: '#4caf50',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

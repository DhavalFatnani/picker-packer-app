import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database';
import { config } from '../config';
import type { Role } from '@pp/shared';

/**
 * Generate a random 6-digit number for employee ID
 */
function generateEmployeeId(warehouse: string): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PP-${warehouse}-${randomNum}`;
}

/**
 * Hash a PIN
 */
async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, config.security.bcryptRounds);
}

/**
 * Seed the database with mock data
 */
export async function seedDatabase(): Promise<void> {
  const db = getDatabase();

  console.log('🌱 Seeding database...');

  try {
    // Hash default PIN (123456)
    const defaultPinHash = await hashPin('123456');

    // Seed users
    const warehouses = ['WH1', 'WH2'];
    const users: Array<{
      id: string;
      employee_id: string;
      name: string;
      phone: string;
      pin_hash: string;
      role: Role;
      status: string;
      warehouse: string;
      created_at: string;
      updated_at: string;
    }> = [];

    // Create 1 Picker-Packer (for testing)
    const pickerId = uuidv4();
    users.push({
      id: pickerId,
      employee_id: 'PP-WH1-000001',
      name: 'John Picker',
      phone: '+15550000001',
      pin_hash: defaultPinHash,
      role: 'PickerPacker' as Role,
      status: 'Approved',
      warehouse: 'WH1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create 1 Packer (for web dashboard)
    const packerId = uuidv4();
    users.push({
      id: packerId,
      employee_id: 'PP-WH1-000002',
      name: 'Jane Packer',
      phone: '+15550000002',
      pin_hash: defaultPinHash,
      role: 'PickerPacker' as Role,
      status: 'Approved',
      warehouse: 'WH1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create 1 ASM
    const asmId = uuidv4();
    users.push({
      id: asmId,
      employee_id: 'ASM-WH1-000001',
      name: 'Alice Manager',
      phone: '+15552000001',
      pin_hash: defaultPinHash,
      role: 'ASM' as Role,
      status: 'Approved',
      warehouse: 'WH1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create 1 Store Manager
    users.push({
      id: uuidv4(),
      employee_id: 'SM-WH1-000001',
      name: 'Store Manager',
      phone: '+15552500001',
      pin_hash: defaultPinHash,
      role: 'StoreManager' as Role,
      status: 'Approved',
      warehouse: 'WH1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create 1 Ops Admin
    users.push({
      id: uuidv4(),
      employee_id: 'ADMIN-WH1-000001',
      name: 'Operations Admin',
      phone: '+15553000001',
      pin_hash: defaultPinHash,
      role: 'OpsAdmin' as Role,
      status: 'Approved',
      warehouse: 'WH1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Insert users
    const insertUser = db.prepare(`
      INSERT INTO users (id, employee_id, name, phone, pin_hash, role, status, warehouse, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertUserMany = db.transaction((usersData: typeof users) => {
      for (const user of usersData) {
        insertUser.run(
          user.id,
          user.employee_id,
          user.name,
          user.phone,
          user.pin_hash,
          user.role,
          user.status,
          user.warehouse,
          user.created_at,
          user.updated_at
        );
      }
    });

    insertUserMany(users);
    console.log(`✓ Created ${users.length} users`);

    // Seed SKUs (minimal - just 5 for testing)
    const skus: Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      category: string;
      unit_of_measure: string;
      created_at: string;
    }> = [];
    for (let i = 1; i <= 5; i++) {
      skus.push({
        id: uuidv4(),
        code: `SKU-${String(i).padStart(4, '0')}`,
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        category: 'Test Category',
        unit_of_measure: i % 2 === 0 ? 'box' : 'each',
        created_at: new Date().toISOString(),
      });
    }

    const insertSKU = db.prepare(`
      INSERT INTO skus (id, code, name, description, category, unit_of_measure, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSKUMany = db.transaction((skusData: typeof skus) => {
      for (const sku of skusData) {
        insertSKU.run(
          sku.id,
          sku.code,
          sku.name,
          sku.description,
          sku.category,
          sku.unit_of_measure,
          sku.created_at
        );
      }
    });

    insertSKUMany(skus);
    console.log(`✓ Created ${skus.length} SKUs`);

    // Seed bins
    const bins: Array<{
      id: string;
      code: string;
      warehouse: string;
      zone: string;
      capacity: number;
      current_quantity: number;
      status: string;
      created_at: string;
      updated_at: string;
    }> = [];
    // Create minimal bins (just 3 for testing)
    for (let i = 1; i <= 3; i++) {
      bins.push({
        id: uuidv4(),
        code: `WH1-Z1-B${String(i).padStart(2, '0')}`,
        warehouse: 'WH1',
        zone: 'Z1',
        capacity: 100,
        current_quantity: 50,
        status: 'Closed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const insertBin = db.prepare(`
      INSERT INTO bins (id, code, warehouse, zone, capacity, current_quantity, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertBinMany = db.transaction((binsData: typeof bins) => {
      for (const bin of binsData) {
        insertBin.run(
          bin.id,
          bin.code,
          bin.warehouse,
          bin.zone,
          bin.capacity,
          bin.current_quantity,
          bin.status,
          bin.created_at,
          bin.updated_at
        );
      }
    });

    insertBinMany(bins);
    console.log(`✓ Created ${bins.length} bins`);

    // Seed lock tags - create more lock tags for each SKU in specific bins
    const lockTags: Array<{
      id: string;
      tag_code: string;
      sku_id: string;
      bin_id: string;
      batch_id: string;
      status: string;
      created_at: string;
    }> = [];
    
    let lockTagCounter = 1;
    // For each SKU-bin combination, create 20 lock tags
    for (const sku of skus) {
      for (const bin of bins) {
        for (let i = 0; i < 20; i++) {
          lockTags.push({
            id: uuidv4(),
            tag_code: `LT${String(lockTagCounter++).padStart(6, '0')}`,
            sku_id: sku.id,
            bin_id: bin.id,
            batch_id: 'BATCH-001',
            status: 'InStock',
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    const insertLockTag = db.prepare(`
      INSERT INTO lock_tags (id, tag_code, sku_id, bin_id, batch_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLockTagMany = db.transaction((tagsData: typeof lockTags) => {
      for (const tag of tagsData) {
        insertLockTag.run(
          tag.id,
          tag.tag_code,
          tag.sku_id,
          tag.bin_id,
          tag.batch_id,
          tag.status,
          tag.created_at
        );
      }
    });

    insertLockTagMany(lockTags);
    console.log(`✓ Created ${lockTags.length} lock tags`);

    // Seed customer orders (assigned to pickers)
    const pickers = users.filter(u => u.role === 'PickerPacker' && u.status === 'Approved');
    
    if (pickers.length > 0) {
      // Create 10 customer orders (distributed across pickers)
      const customerOrders = [
        { orderNumber: 'ORD-1001', customer: 'John Doe', items: [{ sku: skus[0], quantity: 5, bin: bins[0] }, { sku: skus[1], quantity: 3, bin: bins[1] }] },
        { orderNumber: 'ORD-1002', customer: 'Jane Smith', items: [{ sku: skus[2], quantity: 2, bin: bins[0] }, { sku: skus[3], quantity: 4, bin: bins[2] }] },
        { orderNumber: 'ORD-1003', customer: 'Bob Johnson', items: [{ sku: skus[4], quantity: 6, bin: bins[1] }, { sku: skus[0], quantity: 3, bin: bins[0] }] },
        { orderNumber: 'ORD-1004', customer: 'Alice Williams', items: [{ sku: skus[1], quantity: 4, bin: bins[1] }, { sku: skus[2], quantity: 5, bin: bins[0] }] },
        { orderNumber: 'ORD-1005', customer: 'Mike Brown', items: [{ sku: skus[3], quantity: 3, bin: bins[0] }, { sku: skus[4], quantity: 2, bin: bins[2] }] },
        { orderNumber: 'ORD-1006', customer: 'Sarah Davis', items: [{ sku: skus[0], quantity: 4, bin: bins[1] }, { sku: skus[1], quantity: 5, bin: bins[0] }] },
        { orderNumber: 'ORD-1007', customer: 'Tom Wilson', items: [{ sku: skus[2], quantity: 6, bin: bins[2] }, { sku: skus[3], quantity: 3, bin: bins[1] }] },
        { orderNumber: 'ORD-1008', customer: 'Emma Taylor', items: [{ sku: skus[4], quantity: 4, bin: bins[0] }, { sku: skus[0], quantity: 5, bin: bins[1] }] },
        { orderNumber: 'ORD-1009', customer: 'David Martinez', items: [{ sku: skus[1], quantity: 3, bin: bins[2] }, { sku: skus[2], quantity: 4, bin: bins[0] }] },
        { orderNumber: 'ORD-1010', customer: 'Lisa Anderson', items: [{ sku: skus[3], quantity: 5, bin: bins[1] }, { sku: skus[4], quantity: 3, bin: bins[2] }] },
      ];

      const insertOrder = db.prepare(`
        INSERT INTO orders (id, order_number, task_id, status, priority, assigned_to, warehouse, customer_name, total_items, created_at, updated_at, assigned_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (id, order_id, sku_id, sku_code, bin_id, bin_code, quantity, quantity_picked, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertTask = db.prepare(`
        INSERT INTO tasks (id, type, status, priority, warehouse, zone, assigned_to, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertTaskItem = db.prepare(`
        INSERT INTO task_items (id, task_id, sku_id, sku_code, bin_id, bin_code, quantity, quantity_scanned, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertTaskItemLockTag = db.prepare(`
        INSERT INTO task_item_lock_tags (id, task_item_id, lock_tag_id, lock_tag_code, scanned, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      // Track assigned pickers outside transaction
      let assignedPickers = 0;

      for (let i = 0; i < customerOrders.length; i++) {
        const order = customerOrders[i];
        const orderId = uuidv4();
        const taskId = uuidv4();
        const now = new Date().toISOString();
        
        // Calculate total items
        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Assign to idle picker first, then round-robin
        let assigneeId: string;
        if (assignedPickers < pickers.length) {
          // Assign to idle picker
          assigneeId = pickers[assignedPickers].id;
        } else {
          // Round-robin assignment
          const pickerIndex = assignedPickers % pickers.length;
          assigneeId = pickers[pickerIndex].id;
        }
        assignedPickers++;

        // Insert order (with task_id reference)
        insertOrder.run(
          orderId,
          order.orderNumber,
          taskId, // Link order to task
          'Assigned',
          'Urgent', // Customer orders have highest priority
          assigneeId,
          'WH1',
          order.customer,
          totalItems,
          now,
          now,
          now // assigned_at
        );

        // Insert order items
        for (const item of order.items) {
          const orderItemId = uuidv4();
          insertOrderItem.run(
            orderItemId,
            orderId,
            item.sku.id,
            item.sku.code,
            item.bin.id,
            item.bin.code,
            item.quantity,
            0, // quantity_picked starts at 0
            'Pending',
            now,
            now
          );
        }

        // Create corresponding picking task
        insertTask.run(
          taskId,
          'Pick',
          'Assigned',
          'Urgent', // Highest priority for customer orders
          'WH1',
          'Z1',
          assigneeId,
          `Order ${order.orderNumber}`,
          now,
          now
        );

        // Insert task items with lock tags
        for (const item of order.items) {
          const taskItemId = uuidv4();
          
          // Insert task item
          insertTaskItem.run(
            taskItemId,
            taskId,
            item.sku.id,        // sku_id
            item.sku.code,      // sku_code
            item.bin.id,        // bin_id
            item.bin.code,      // bin_code
            item.quantity,
            0,                  // quantity_scanned starts at 0
            'Pending'           // status
          );

          // Get available lock tags for this SKU in this bin
          const availableLockTags = db
            .prepare(`
              SELECT lt.id, lt.tag_code 
              FROM lock_tags lt
              WHERE lt.sku_id = ? AND lt.bin_id = ? AND lt.status = 'InStock'
              LIMIT ?
            `)
            .all(item.sku.id, item.bin.id, item.quantity) as any[];

          // Create lock tag entries for each unit
          for (let i = 0; i < item.quantity; i++) {
            if (i < availableLockTags.length) {
              const lockTag = availableLockTags[i];
              insertTaskItemLockTag.run(
                uuidv4(),
                taskItemId,
                lockTag.id,
                lockTag.tag_code,
                0, // Not scanned yet
                now
              );

              // Update lock tag status to 'Allocated' so it can't be used by another task
              db.prepare('UPDATE lock_tags SET status = ? WHERE id = ?').run('Allocated', lockTag.id);
            }
          }
        }
      }

      console.log(`✓ Created ${customerOrders.length} customer orders with picking tasks (auto-assigned to pickers)`);
    } else {
      console.log(`⚠ No pickers available - skipping customer orders`);
    }

    // Seed 1 announcement
    const opAdminUser = users.find(u => u.role === 'OpsAdmin');
    const announcements = opAdminUser ? [{
      id: uuidv4(),
      title: 'Welcome to PickerPacker',
      message: 'Thank you for using PickerPacker. You can now test the full workflow!',
      priority: 'High',
      created_by: opAdminUser.id,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }] : [];

    const insertAnnouncement = db.prepare(`
      INSERT INTO announcements (id, title, message, priority, created_by, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAnnouncementMany = db.transaction((announcementsData: typeof announcements) => {
      for (const announcement of announcementsData) {
        insertAnnouncement.run(
          announcement.id,
          announcement.title,
          announcement.message,
          announcement.priority,
          announcement.created_by,
          announcement.expires_at,
          announcement.created_at,
          announcement.updated_at
        );
      }
    });

    insertAnnouncementMany(announcements);
    console.log(`✓ Created ${announcements.length} announcements`);

    // Seed geofence settings
    const adminUser = users.find(u => u.role === 'OpsAdmin');
    if (adminUser) {
      const geofenceSettings = [
        {
          id: uuidv4(),
          warehouse: 'WH1',
          latitude: 37.7749,
          longitude: -122.4194,
          radius_meters: 500,
          enabled: 1,
          created_by: adminUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          warehouse: 'WH2',
          latitude: 37.7849,
          longitude: -122.4094,
          radius_meters: 500,
          enabled: 1,
          created_by: adminUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const insertGeofence = db.prepare(`
        INSERT INTO geofence_settings (id, warehouse, latitude, longitude, radius_meters, enabled, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertGeofenceMany = db.transaction((geofenceData: typeof geofenceSettings) => {
        for (const setting of geofenceData) {
          insertGeofence.run(
            setting.id,
            setting.warehouse,
            setting.latitude,
            setting.longitude,
            setting.radius_meters,
            setting.enabled,
            setting.created_by,
            setting.created_at,
            setting.updated_at
          );
        }
      });

      insertGeofenceMany(geofenceSettings);
      console.log(`✓ Created ${geofenceSettings.length} geofence settings`);
    }

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

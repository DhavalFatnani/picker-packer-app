const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'pickerpacker.db');
const db = new Database(dbPath);

try {
  console.log('Seeding 10 customer orders...');

  // Get pickers
  const pickers = db.prepare("SELECT * FROM users WHERE role = 'PickerPacker' AND status = 'Approved'").all();
  
  if (pickers.length === 0) {
    console.log('No pickers available');
    process.exit(1);
  }

  // Get SKUs and bins
  const skus = db.prepare('SELECT * FROM skus LIMIT 5').all();
  const bins = db.prepare('SELECT * FROM bins LIMIT 3').all();

  if (skus.length < 5 || bins.length < 3) {
    console.log('Not enough SKUs or bins');
    process.exit(1);
  }

  // Create 10 orders
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

  const insertMultiple = db.transaction((orders) => {
    let assignedPickers = 0;

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const orderId = uuidv4();
      const taskId = uuidv4();
      const now = new Date().toISOString();

      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

      let assigneeId;
      if (assignedPickers < pickers.length) {
        assigneeId = pickers[assignedPickers].id;
      } else {
        const pickerIndex = assignedPickers % pickers.length;
        assigneeId = pickers[pickerIndex].id;
      }
      assignedPickers++;

      // Insert task first
      insertTask.run(taskId, 'Pick', 'Assigned', 'Urgent', 'WH1', 'Z1', assigneeId, `Order ${order.orderNumber}`, now, now);
      
      // Insert order
      insertOrder.run(orderId, order.orderNumber, taskId, 'Assigned', 'Urgent', assigneeId, 'WH1', order.customer, totalItems, now, now, now);

      for (const item of order.items) {
        const orderItemId = uuidv4();
        insertOrderItem.run(orderItemId, orderId, item.sku.id, item.sku.code, item.bin.id, item.bin.code, item.quantity, 0, 'Pending', now, now);

        const taskItemId = uuidv4();
        insertTaskItem.run(taskItemId, taskId, item.sku.id, item.sku.code, item.bin.id, item.bin.code, item.quantity, 0, 'Pending');
      }
    }
  });

  insertMultiple(customerOrders);

  console.log(`✓ Successfully created ${customerOrders.length} customer orders`);
  console.log(`✓ Assigned to ${pickers.length} pickers (${pickers.map(p => p.username).join(', ')})`);

} catch (error) {
  console.error('Error seeding orders:', error);
} finally {
  db.close();
}

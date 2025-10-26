-- PickerPacker Database Schema
-- SQLite database with foreign keys enabled

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('PickerPacker', 'ASM', 'StoreManager', 'OpsAdmin', 'Guard')),
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Active', 'Inactive')),
    warehouse TEXT NOT NULL,
    otp TEXT,
    otp_expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    approved_at TEXT,
    approved_by TEXT
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('NotStarted', 'Active', 'Ended')),
    warehouse TEXT NOT NULL,
    zone TEXT,
    started_at TEXT,
    ended_at TEXT,
    selfie_uri TEXT,
    selfie_gps TEXT, -- JSON: {latitude, longitude}
    geo_validated INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('Pick', 'Pack', 'Putaway', 'BinToBin', 'CycleCount')),
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled')),
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'Normal', 'High', 'Urgent')) DEFAULT 'Normal',
    assigned_to TEXT,
    warehouse TEXT NOT NULL,
    zone TEXT,
    from_bin TEXT,
    to_bin TEXT,
    notes TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Orders table (Customer Orders)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    task_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Assigned', 'InProgress', 'Picked', 'Packed', 'Shipped', 'Cancelled')) DEFAULT 'Pending',
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'Normal', 'High', 'Urgent')) DEFAULT 'Urgent',
    assigned_to TEXT,
    warehouse TEXT NOT NULL,
    customer_name TEXT,
    customer_contact TEXT,
    total_items INTEGER NOT NULL DEFAULT 0,
    total_value REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    assigned_at TEXT,
    picked_at TEXT,
    packed_at TEXT,
    shipped_at TEXT,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    sku_code TEXT NOT NULL,
    bin_id TEXT,
    bin_code TEXT,
    quantity INTEGER NOT NULL,
    quantity_picked INTEGER NOT NULL DEFAULT 0,
    unit_price REAL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Picking', 'Picked', 'Packing', 'Packed')) DEFAULT 'Pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (sku_id) REFERENCES skus(id),
    FOREIGN KEY (bin_id) REFERENCES bins(id)
);

-- Task items table
CREATE TABLE IF NOT EXISTS task_items (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    sku_code TEXT NOT NULL,
    bin_id TEXT,
    bin_code TEXT,
    quantity INTEGER NOT NULL,
    quantity_scanned INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (sku_id) REFERENCES skus(id),
    FOREIGN KEY (bin_id) REFERENCES bins(id)
);

-- Task item lock tags table (one-to-many: each unit of a task item has a specific lock_tag)
CREATE TABLE IF NOT EXISTS task_item_lock_tags (
    id TEXT PRIMARY KEY,
    task_item_id TEXT NOT NULL,
    lock_tag_id TEXT NOT NULL,
    lock_tag_code TEXT NOT NULL,
    scanned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_item_id) REFERENCES task_items(id) ON DELETE CASCADE,
    FOREIGN KEY (lock_tag_id) REFERENCES lock_tags(id)
);

-- SKUs table
CREATE TABLE IF NOT EXISTS skus (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    unit_of_measure TEXT NOT NULL DEFAULT 'each',
    dimensions TEXT, -- JSON: {length, width, height}
    weight REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Lock tags table
CREATE TABLE IF NOT EXISTS lock_tags (
    id TEXT PRIMARY KEY,
    tag_code TEXT UNIQUE NOT NULL,
    sku_id TEXT NOT NULL,
    batch_id TEXT,
    bin_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('InStock', 'Allocated', 'Reserved', 'Damaged', 'Missing')) DEFAULT 'InStock',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (sku_id) REFERENCES skus(id),
    FOREIGN KEY (bin_id) REFERENCES bins(id)
);

-- Bins table
CREATE TABLE IF NOT EXISTS bins (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    warehouse TEXT NOT NULL,
    zone TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('Open', 'Closed', 'InUse', 'Full')) DEFAULT 'Closed',
    assigned_skus TEXT, -- JSON array of SKU IDs
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bin items table
CREATE TABLE IF NOT EXISTS bin_items (
    id TEXT PRIMARY KEY,
    bin_id TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    lock_tag_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('InStock', 'Allocated', 'Reserved', 'Damaged', 'Missing')) DEFAULT 'InStock',
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (bin_id) REFERENCES bins(id) ON DELETE CASCADE,
    FOREIGN KEY (sku_id) REFERENCES skus(id),
    FOREIGN KEY (lock_tag_id) REFERENCES lock_tags(id)
);

-- Movements table (bin-to-bin transfers)
CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY,
    from_bin_id TEXT NOT NULL,
    to_bin_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (from_bin_id) REFERENCES bins(id),
    FOREIGN KEY (to_bin_id) REFERENCES bins(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Movement items table
CREATE TABLE IF NOT EXISTS movement_items (
    id TEXT PRIMARY KEY,
    movement_id TEXT NOT NULL,
    lock_tag_id TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE CASCADE,
    FOREIGN KEY (lock_tag_id) REFERENCES lock_tags(id),
    FOREIGN KEY (sku_id) REFERENCES skus(id)
);

-- Cycle counts table
CREATE TABLE IF NOT EXISTS cycle_counts (
    id TEXT PRIMARY KEY,
    bin_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    expected_items INTEGER NOT NULL,
    actual_items INTEGER NOT NULL,
    discrepancy INTEGER NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (bin_id) REFERENCES bins(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Exceptions table
CREATE TABLE IF NOT EXISTS exceptions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('Damage', 'Missing', 'WrongItem', 'TagReplacement', 'Overstock', 'Understock', 'Other')),
    status TEXT NOT NULL CHECK(status IN ('Pending', 'InReview', 'Resolved', 'Rejected')) DEFAULT 'Pending',
    user_id TEXT NOT NULL,
    task_id TEXT,
    sku_id TEXT,
    lock_tag_id TEXT,
    bin_id TEXT,
    description TEXT NOT NULL,
    photos TEXT, -- JSON array of photo URIs
    quantity INTEGER,
    old_tag TEXT,
    new_tag TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at TEXT,
    reviewed_by TEXT,
    resolution TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (sku_id) REFERENCES skus(id),
    FOREIGN KEY (lock_tag_id) REFERENCES lock_tags(id),
    FOREIGN KEY (bin_id) REFERENCES bins(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Telemetry events table
CREATE TABLE IF NOT EXISTS telemetry_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT, -- JSON object
    gps TEXT, -- JSON: {latitude, longitude}
    device_info TEXT, -- JSON: {platform, version}
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'Normal', 'High')) DEFAULT 'Normal',
    created_by TEXT NOT NULL,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Geofence settings table for warehouse configurations
CREATE TABLE IF NOT EXISTS geofence_settings (
    id TEXT PRIMARY KEY,
    warehouse TEXT UNIQUE NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 1000,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_geofence_settings_warehouse ON geofence_settings(warehouse);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_task_items_task_id ON task_items(task_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_lock_tags_tag_code ON lock_tags(tag_code);
CREATE INDEX IF NOT EXISTS idx_lock_tags_sku_id ON lock_tags(sku_id);
CREATE INDEX IF NOT EXISTS idx_bins_code ON bins(code);
CREATE INDEX IF NOT EXISTS idx_bins_warehouse ON bins(warehouse);
CREATE INDEX IF NOT EXISTS idx_bin_items_bin_id ON bin_items(bin_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_user_id ON exceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_user_id ON telemetry_events(user_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_event_type ON telemetry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_timestamp ON telemetry_events(timestamp);

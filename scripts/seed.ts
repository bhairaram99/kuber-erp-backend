import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wood_business_erp';

async function seed() {
  console.log('🪵 Connecting to MongoDB for seeding...', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB successfully.');

  const db = mongoose.connection.db;

  // Drop existing collections to start fresh
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    console.log(`🧹 Dropping collection: ${col.name}`);
    await db.dropCollection(col.name);
  }

  // 1. Seed Permissions
  const permissionsList = [
    { code: 'dashboard.view', name: 'View Dashboard', module: 'dashboard' },
    { code: 'products.view', name: 'View Products', module: 'products' },
    { code: 'products.create', name: 'Create Product', module: 'products' },
    { code: 'products.update', name: 'Update Product', module: 'products' },
    { code: 'products.delete', name: 'Delete Product', module: 'products' },
    { code: 'categories.view', name: 'View Categories', module: 'categories' },
    { code: 'categories.create', name: 'Create Category', module: 'categories' },
    { code: 'categories.update', name: 'Update Category', module: 'categories' },
    { code: 'categories.delete', name: 'Delete Category', module: 'categories' },
    { code: 'inventory.view', name: 'View Inventory', module: 'inventory' },
    { code: 'inventory.adjust', name: 'Adjust Stock', module: 'inventory' },
    { code: 'inventory.reset', name: 'Reset Stock', module: 'inventory' },
    { code: 'inventory.history', name: 'Inventory History', module: 'inventory' },
    { code: 'customers.view', name: 'View Customers', module: 'customers' },
    { code: 'customers.create', name: 'Create Customer', module: 'customers' },
    { code: 'customers.update', name: 'Update Customer', module: 'customers' },
    { code: 'customers.delete', name: 'Delete Customer', module: 'customers' },
    { code: 'suppliers.view', name: 'View Suppliers', module: 'suppliers' },
    { code: 'suppliers.create', name: 'Create Supplier', module: 'suppliers' },
    { code: 'suppliers.update', name: 'Update Supplier', module: 'suppliers' },
    { code: 'suppliers.delete', name: 'Delete Supplier', module: 'suppliers' },
    { code: 'sales.view', name: 'View Sales', module: 'sales' },
    { code: 'sales.create', name: 'Create Sale', module: 'sales' },
    { code: 'sales.update', name: 'Update Sale', module: 'sales' },
    { code: 'sales.cancel', name: 'Cancel Sale', module: 'sales' },
    { code: 'purchases.view', name: 'View Purchases', module: 'purchases' },
    { code: 'purchases.create', name: 'Create Purchase', module: 'purchases' },
    { code: 'purchases.update', name: 'Update Purchase', module: 'purchases' },
    { code: 'purchases.cancel', name: 'Cancel Purchase', module: 'purchases' },
    { code: 'payments.view', name: 'View Payments', module: 'payments' },
    { code: 'payments.create', name: 'Create Payment', module: 'payments' },
    { code: 'expenses.view', name: 'View Expenses', module: 'expenses' },
    { code: 'expenses.create', name: 'Create Expense', module: 'expenses' },
    { code: 'expenses.update', name: 'Update Expense', module: 'expenses' },
    { code: 'expenses.delete', name: 'Delete Expense', module: 'expenses' },
    { code: 'transactions.view', name: 'View Central Transactions', module: 'transactions' },
    { code: 'reports.view', name: 'View Reports', module: 'reports' },
    { code: 'reports.export', name: 'Export Reports', module: 'reports' },
    { code: 'users.view', name: 'View Users', module: 'users' },
    { code: 'users.create', name: 'Create User', module: 'users' },
    { code: 'users.update', name: 'Update User', module: 'users' },
    { code: 'users.delete', name: 'Delete User', module: 'users' },
    { code: 'roles.view', name: 'View Roles', module: 'roles' },
    { code: 'roles.create', name: 'Create Role', module: 'roles' },
    { code: 'roles.update', name: 'Update Role', module: 'roles' },
    { code: 'roles.delete', name: 'Delete Role', module: 'roles' },
    { code: 'audit.view', name: 'View Audit Logs', module: 'audit' },
    { code: 'notifications.view', name: 'View Notifications', module: 'notifications' },
    { code: 'settings.view', name: 'View Settings', module: 'settings' },
    { code: 'settings.update', name: 'Update Settings', module: 'settings' },
  ];

  await db.collection('permissions').insertMany(
    permissionsList.map((p) => ({ ...p, createdAt: new Date(), updatedAt: new Date() })),
  );
  console.log(`✅ Seeded ${permissionsList.length} permissions.`);

  const allPermCodes = permissionsList.map((p) => p.code);

  // 2. Seed Roles
  const superAdminRole = {
    _id: new mongoose.Types.ObjectId(),
    name: 'SUPER_ADMIN',
    description: 'Full system access with complete configuration control',
    permissions: allPermCodes,
    isActive: true,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminRole = {
    _id: new mongoose.Types.ObjectId(),
    name: 'ADMIN',
    description: 'Business management, financial approvals, reports and operations',
    permissions: allPermCodes.filter(
      (p) => !['roles.delete', 'inventory.reset'].includes(p),
    ),
    isActive: true,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const managerRole = {
    _id: new mongoose.Types.ObjectId(),
    name: 'MANAGER',
    description: 'Operational store manager with inventory, sales & purchase control',
    permissions: [
      'dashboard.view',
      'products.view', 'products.create', 'products.update',
      'categories.view', 'categories.create',
      'inventory.view', 'inventory.adjust', 'inventory.history',
      'customers.view', 'customers.create', 'customers.update',
      'suppliers.view', 'suppliers.create', 'suppliers.update',
      'sales.view', 'sales.create', 'sales.update',
      'purchases.view', 'purchases.create', 'purchases.update',
      'payments.view', 'payments.create',
      'expenses.view', 'expenses.create',
      'transactions.view',
      'reports.view',
      'notifications.view',
      'settings.view',
    ],
    isActive: true,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const staffRole = {
    _id: new mongoose.Types.ObjectId(),
    name: 'STAFF',
    description: 'Sales counter staff with billing and product viewing access',
    permissions: [
      'dashboard.view',
      'products.view',
      'categories.view',
      'customers.view', 'customers.create',
      'sales.view', 'sales.create',
      'inventory.view',
      'notifications.view',
    ],
    isActive: true,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('roles').insertMany([superAdminRole, adminRole, managerRole, staffRole]);
  console.log('✅ Seeded 4 default roles (SUPER_ADMIN, ADMIN, MANAGER, STAFF).');

  // 3. Seed Users
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const staffHash = await bcrypt.hash('Staff123!', 10);

  const superAdminUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Bhairav Patel (Owner)',
    email: 'superadmin@wooderp.com',
    phone: '+91 98250 11223',
    passwordHash,
    role: superAdminRole._id,
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const managerUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Vikram Joshi (Yard Manager)',
    email: 'manager@wooderp.com',
    phone: '+91 98250 33445',
    passwordHash,
    role: managerRole._id,
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const staffUser = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Aarav Mehta (Counter Staff)',
    email: 'staff@wooderp.com',
    phone: '+91 98250 55667',
    passwordHash: staffHash,
    role: staffRole._id,
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('users').insertMany([superAdminUser, managerUser, staffUser]);
  console.log('✅ Seeded 3 users: superadmin@wooderp.com, manager@wooderp.com, staff@wooderp.com.');

  // 4. Seed Categories
  const catTeak = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Teak & Hardwood Timber',
    description: 'High-density timber logs and heavy furniture wood',
    status: 'ACTIVE',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const catPine = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Pine & Softwood Lumber',
    description: 'Construction framing timber, packaging pine and battens',
    status: 'ACTIVE',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const catPlywood = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Commercial & Marine Plywood',
    description: 'BWR/BWP certified engineered plywood boards and flush doors',
    status: 'ACTIVE',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const catVeneer = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Decorative Wood Veneers',
    description: 'Natural exotic wood face veneers and architectural panels',
    status: 'ACTIVE',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const catEngineered = {
    _id: new mongoose.Types.ObjectId(),
    name: 'MDF, HDF & Particle Boards',
    description: 'Medium density fiberboards and pre-laminated boards',
    status: 'ACTIVE',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('categories').insertMany([catTeak, catPine, catPlywood, catVeneer, catEngineered]);
  console.log('✅ Seeded 5 wood categories.');

  // 5. Seed Products
  // Note: Teak Timber begins with 100 stock, but will drop to 90 after the demo sale in Requirement 62
  const pTeak = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Teak Timber Log (CP Teak)',
    sku: 'TEAK-CP-001',
    barcode: '890100100001',
    categoryId: catTeak._id,
    description: 'Central Province premium golden teak log suitable for exterior and high-end furniture',
    woodType: 'Teak',
    grade: 'A-Grade',
    quality: 'Premium Export',
    thickness: 100,
    width: 200,
    length: 3000,
    unit: 'cft',
    color: 'Golden Teak',
    finish: 'Rough Sawn',
    brand: 'Bhairav Select',
    purchasePrice: 400,
    sellingPrice: 600,
    wholesalePrice: 550,
    taxPercentage: 18,
    openingStock: 100,
    currentStock: 90, // after 10 units sold in demo flow
    minimumStock: 25,
    maximumStock: 500,
    location: 'Yard A - Bay 1',
    image: '',
    status: 'ACTIVE',
    notes: 'Seasoned under shade for 6 months',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const pPine = {
    _id: new mongoose.Types.ObjectId(),
    name: 'New Zealand Pine Lumber',
    sku: 'PINE-NZ-002',
    barcode: '890100100002',
    categoryId: catPine._id,
    description: 'Kiln-dried radiata pine timber planks for framing and interior cabinetry',
    woodType: 'Pine',
    grade: 'KD Clean',
    quality: 'Standard',
    thickness: 50,
    width: 100,
    length: 2400,
    unit: 'cft',
    color: 'Light Amber',
    finish: 'Planed S4S',
    brand: 'KiwiWood',
    purchasePrice: 250,
    sellingPrice: 380,
    wholesalePrice: 340,
    taxPercentage: 18,
    openingStock: 200,
    currentStock: 200,
    minimumStock: 40,
    maximumStock: 800,
    location: 'Yard B - Shed 3',
    image: '',
    status: 'ACTIVE',
    notes: 'Moisture content < 12%',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const pOak = {
    _id: new mongoose.Types.ObjectId(),
    name: 'American White Oak Plank',
    sku: 'OAK-USA-003',
    barcode: '890100100003',
    categoryId: catTeak._id,
    description: 'North American White Oak with prominent grain patterns for premium flooring',
    woodType: 'White Oak',
    grade: 'Select FAS',
    quality: 'Super Premium',
    thickness: 25,
    width: 150,
    length: 2100,
    unit: 'sqft',
    color: 'Pale White/Tan',
    finish: 'Sanded',
    brand: 'Appalachian Oak',
    purchasePrice: 500,
    sellingPrice: 750,
    wholesalePrice: 700,
    taxPercentage: 18,
    openingStock: 80,
    currentStock: 80,
    minimumStock: 15,
    maximumStock: 300,
    location: 'Yard A - Bay 4',
    image: '',
    status: 'ACTIVE',
    notes: 'Hardwearing dense grain',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const pWalnut = {
    _id: new mongoose.Types.ObjectId(),
    name: 'American Black Walnut Plank',
    sku: 'WALNUT-USA-004',
    barcode: '890100100004',
    categoryId: catTeak._id,
    description: 'Rich dark chocolate tones, ideal for luxury executive desks & statement tables',
    woodType: 'Walnut',
    grade: 'FAS #1',
    quality: 'Luxury',
    thickness: 38,
    width: 250,
    length: 2400,
    unit: 'cft',
    color: 'Dark Chocolate',
    finish: 'Live Edge / Rough',
    brand: 'Midwest Timber',
    purchasePrice: 800,
    sellingPrice: 1200,
    wholesalePrice: 1100,
    taxPercentage: 18,
    openingStock: 50,
    currentStock: 50,
    minimumStock: 10,
    maximumStock: 150,
    location: 'Yard A - Rack Special',
    image: '',
    status: 'ACTIVE',
    notes: 'Steam treated for deep color',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const pMarinePly = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Marine Plywood 19mm (IS:710)',
    sku: 'PLY-MAR-019',
    barcode: '890100100005',
    categoryId: catPlywood._id,
    description: '710 BWP boiling water proof marine grade plywood with gurjan face',
    woodType: 'Hardwood Core',
    grade: 'IS:710 BWP',
    quality: 'Marine Certified',
    thickness: 19,
    width: 1220,
    length: 2440,
    unit: 'piece',
    color: 'Reddish Brown',
    finish: 'Smooth Calibrated',
    brand: 'Century Shield',
    purchasePrice: 1800,
    sellingPrice: 2400,
    wholesalePrice: 2200,
    taxPercentage: 18,
    openingStock: 100,
    currentStock: 100,
    minimumStock: 20,
    maximumStock: 400,
    location: 'Warehouse 1 - Rack B',
    image: '',
    status: 'ACTIVE',
    notes: '72hr boiling water tested',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const pCommercialPly = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Commercial Plywood 18mm (MR Grade)',
    sku: 'PLY-COM-018',
    barcode: '890100100006',
    categoryId: catPlywood._id,
    description: 'Moisture resistant commercial grade 8x4 plywood sheet for bedroom furniture',
    woodType: 'Poplar / Eucalyptus',
    grade: 'MR Grade',
    quality: 'Commercial',
    thickness: 18,
    width: 1220,
    length: 2440,
    unit: 'piece',
    color: 'Light Tan',
    finish: 'Smooth',
    brand: 'National Star',
    purchasePrice: 1200,
    sellingPrice: 1650,
    wholesalePrice: 1500,
    taxPercentage: 18,
    openingStock: 150,
    currentStock: 150,
    minimumStock: 30,
    maximumStock: 500,
    location: 'Warehouse 1 - Rack A',
    image: '',
    status: 'ACTIVE',
    notes: 'Anti-termite treated',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const pMdf = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Premium Interior MDF Board 12mm',
    sku: 'MDF-INT-012',
    barcode: '890100100007',
    categoryId: catEngineered._id,
    description: 'High surface density fiberboard for CNC routing and panel carvings',
    woodType: 'Fiberboard',
    grade: 'Interior Grade',
    quality: 'Standard',
    thickness: 12,
    width: 1220,
    length: 2440,
    unit: 'piece',
    color: 'Uniform Beige',
    finish: 'Calibrated S2S',
    brand: 'Greenpanel',
    purchasePrice: 600,
    sellingPrice: 850,
    wholesalePrice: 780,
    taxPercentage: 18,
    openingStock: 120,
    currentStock: 120,
    minimumStock: 25,
    maximumStock: 400,
    location: 'Warehouse 2 - Shelf 1',
    image: '',
    status: 'ACTIVE',
    notes: 'Uniform density for clean router bit cuts',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const pVeneer = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Natural Burma Teak Veneer Sheet (4x8 ft)',
    sku: 'VEN-TEAK-001',
    barcode: '890100100008',
    categoryId: catVeneer._id,
    description: 'Quarter sliced straight grain natural teak veneer sheets for wall paneling & doors',
    woodType: 'Natural Teak',
    grade: 'Architectural Grade',
    quality: 'A+',
    thickness: 0.55,
    width: 1220,
    length: 2440,
    unit: 'piece',
    color: 'Warm Golden',
    finish: 'Fleece Backed',
    brand: 'DecoWood',
    purchasePrice: 350,
    sellingPrice: 520,
    wholesalePrice: 480,
    taxPercentage: 18,
    openingStock: 300,
    currentStock: 300,
    minimumStock: 50,
    maximumStock: 1000,
    location: 'Showroom Rack 4',
    image: '',
    status: 'ACTIVE',
    notes: 'Match-booked consecutive flitches',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('products').insertMany([
    pTeak, pPine, pOak, pWalnut, pMarinePly, pCommercialPly, pMdf, pVeneer,
  ]);
  console.log('✅ Seeded 8 wood products with detailed lumber specifications.');

  // 6. Seed Customers (Patel Woodcraft, Sharma Furniture Works, etc.)
  // Patel Woodcraft will have purchases: ₹6,000, paid: ₹5,000, due: ₹1,000 as per Requirement 62
  const custPatel = {
    _id: new mongoose.Types.ObjectId(),
    customerCode: 'CUST-0001',
    name: 'Patel Woodcraft',
    phone: '+91 98250 88990',
    email: 'contact@patelwoodcraft.example',
    company: 'Patel Woodcraft & Modular Interiors',
    address: 'Survey 45, GIDC Phase II',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    postalCode: '382445',
    customerType: 'Furniture Manufacturer',
    taxNumber: '24ABCDE1234F1Z5',
    creditLimit: 300000,
    totalPurchases: 6000,
    totalPaid: 5000,
    totalDue: 1000,
    notes: 'Reputed furniture maker, regular bulk buyer of teak logs',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const custSharma = {
    _id: new mongoose.Types.ObjectId(),
    customerCode: 'CUST-0002',
    name: 'Sharma Furniture Works',
    phone: '+91 98110 44332',
    email: 'sharma@sharmafurn.example',
    company: 'Sharma Furniture Works Pvt Ltd',
    address: 'Plot 18, Kirti Nagar Timber Area',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    postalCode: '110015',
    customerType: 'Wholesale Buyer',
    taxNumber: '07ABCDE5678G1Z2',
    creditLimit: 500000,
    totalPurchases: 45000,
    totalPaid: 45000,
    totalDue: 0,
    notes: 'Prefers kiln dried pine and oak lumber',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const custRoyal = {
    _id: new mongoose.Types.ObjectId(),
    customerCode: 'CUST-0003',
    name: 'Royal Interior Studio',
    phone: '+91 98790 12121',
    email: 'designs@royalinterior.example',
    company: 'Royal Studio Architecture & Decor',
    address: '104, High Street Arcade, SG Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    postalCode: '380054',
    customerType: 'Architect / Interior Designer',
    taxNumber: '24XYZAB9876C1Z8',
    creditLimit: 200000,
    totalPurchases: 18000,
    totalPaid: 15000,
    totalDue: 3000,
    notes: 'Regular purchaser of decorative veneers and walnut planks',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('customers').insertMany([custPatel, custSharma, custRoyal]);
  console.log('✅ Seeded 3 business customers.');

  // 7. Seed Suppliers
  const supGujarat = {
    _id: new mongoose.Types.ObjectId(),
    supplierCode: 'SUP-0001',
    name: 'Gujarat Timber Traders',
    phone: '+91 98251 11223',
    email: 'orders@gtt-timber.example',
    company: 'Gujarat Timber Traders LLP',
    address: 'Port Timber Yard, Gandhidham',
    taxNumber: '24GTTTT9999P1Z1',
    totalPurchases: 85000,
    totalPaid: 85000,
    totalDue: 0,
    notes: 'Direct importer of Burma Teak and African lumber',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const supPremium = {
    _id: new mongoose.Types.ObjectId(),
    supplierCode: 'SUP-0002',
    name: 'Premium Timber Depot',
    phone: '+91 98980 22334',
    email: 'dispatch@premiumtimber.example',
    company: 'Premium Timber Depot Corporation',
    address: 'Timber Market Road, Yamunanagar',
    taxNumber: '06PTDDD8888K1Z3',
    totalPurchases: 60000,
    totalPaid: 45000,
    totalDue: 15000,
    notes: 'Plywood and pine wood supplier',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('suppliers').insertMany([supGujarat, supPremium]);
  console.log('✅ Seeded 2 timber suppliers.');

  // 8. Seed Opening Inventory Transactions
  const initialStockMovements = [
    {
      productId: pTeak._id,
      type: 'OPENING',
      quantity: 100,
      previousStock: 0,
      newStock: 100,
      referenceType: 'OPENING_STOCK',
      referenceId: 'INIT',
      reason: 'Initial physical inventory count',
      createdBy: superAdminUser._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    },
    {
      productId: pPine._id,
      type: 'OPENING',
      quantity: 200,
      previousStock: 0,
      newStock: 200,
      referenceType: 'OPENING_STOCK',
      referenceId: 'INIT',
      reason: 'Initial physical inventory count',
      createdBy: superAdminUser._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    },
  ];

  await db.collection('inventory_transactions').insertMany(initialStockMovements);

  // 9. Execute & Seed Requirement 62 Real Business Flow:
  // Product: Teak Timber (Purchase ₹400, Selling ₹600, Opening Stock 100)
  // Customer: Patel Woodcraft
  // Sale: 10 units @ ₹600 = ₹6,000
  // Payment: ₹5,000 (Due: ₹1,000)
  // Stock decreases: 100 -> 90
  // Inventory Transaction: SALE, quantity -10, previous: 100, new: 90
  // Financial calculation: Revenue ₹6,000, COGS: 10 * ₹400 = ₹4,000, Gross Profit = ₹2,000
  const invoiceNumber = 'INV-2026-0001';
  const saleItem = {
    productId: pTeak._id,
    productNameSnapshot: pTeak.name,
    skuSnapshot: pTeak.sku,
    unitSnapshot: pTeak.unit,
    quantity: 10,
    purchasePriceSnapshot: 400, // COGS snapshot
    sellingPrice: 600,
    discount: 0,
    tax: 0,
    subtotal: 6000,
    total: 6000,
  };

  const demoSale = {
    _id: new mongoose.Types.ObjectId(),
    invoiceNumber,
    customerId: custPatel._id,
    items: [saleItem],
    subtotal: 6000,
    discount: 0,
    tax: 0,
    total: 6000,
    costOfGoodsSold: 4000,
    grossProfit: 2000,
    paidAmount: 5000,
    dueAmount: 1000,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'UPI',
    status: 'CONFIRMED',
    saleDate: new Date(),
    notes: 'Order confirmed by Mr. Patel for modular showroom partition',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('sales').insertOne(demoSale);

  // Record Requirement 62 Inventory Transaction
  await db.collection('inventory_transactions').insertOne({
    productId: pTeak._id,
    type: 'SALE',
    quantity: -10,
    previousStock: 100,
    newStock: 90,
    referenceType: 'SALE',
    referenceId: invoiceNumber,
    reason: `Sold on invoice ${invoiceNumber}`,
    createdBy: superAdminUser._id,
    createdAt: new Date(),
  });

  // Record Payment
  const paymentNumber = 'PAY-000001';
  await db.collection('payments').insertOne({
    paymentNumber,
    type: 'RECEIVED',
    referenceType: 'SALE',
    referenceId: invoiceNumber,
    customerId: custPatel._id,
    amount: 5000,
    paymentMethod: 'UPI',
    paymentDate: new Date(),
    notes: `Advance payment for invoice ${invoiceNumber}`,
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Record Central Transactions
  await db.collection('transactions').insertMany([
    {
      transactionNumber: 'TXN-000001',
      type: 'SALE',
      referenceType: 'SALE',
      referenceId: invoiceNumber,
      amount: 6000,
      customerId: custPatel._id,
      supplierId: null,
      paymentStatus: 'PARTIAL',
      status: 'COMPLETED',
      description: `Sale invoice ${invoiceNumber} created for Patel Woodcraft`,
      createdBy: superAdminUser._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      transactionNumber: 'TXN-000002',
      type: 'PAYMENT_RECEIVED',
      referenceType: 'PAYMENT',
      referenceId: paymentNumber,
      amount: 5000,
      customerId: custPatel._id,
      supplierId: null,
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      description: `Payment received via UPI for invoice ${invoiceNumber}`,
      createdBy: superAdminUser._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // 10. Seed Realistic Operating Expenses (affecting Net Profit)
  const expenseRent = {
    title: 'Timber Yard Lease - September 2026',
    category: 'Rent & Lease',
    amount: 35000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    paymentMethod: 'BANK_TRANSFER',
    description: 'Monthly yard space rental paid to GIDC Industrial Association',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const expenseSawmill = {
    title: 'Circular Saw Blade Sharpening & Lubricants',
    category: 'Machinery & Maintenance',
    amount: 4500,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    paymentMethod: 'CASH',
    description: 'Scheduled maintenance for sawmill horizontal band saw and carbide blades',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const expenseWages = {
    title: 'Yard Loaders Weekly Wages',
    category: 'Wages & Labor',
    amount: 12000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    paymentMethod: 'UPI',
    description: 'Weekly loading/unloading labor payment for 6 workers',
    createdBy: superAdminUser._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('expenses').insertMany([expenseRent, expenseSawmill, expenseWages]);
  console.log('✅ Seeded operational expenses.');

  // 11. Seed Business Settings
  await db.collection('settings').insertOne({
    businessName: 'Bhairav Timber & Plywood Mart',
    logo: '',
    address: 'Plot 108, National Highway 8, Timber Zone, GIDC, Ahmedabad, Gujarat 382445',
    phone: '+91 98250 12345',
    email: 'contact@wooderp.com',
    taxNumber: '24AAAAA0000A1Z5',
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    invoicePrefix: 'INV',
    purchasePrefix: 'PO',
    lowStockThreshold: 20,
    allowNegativeStock: false,
    requireStockAdjustmentReason: true,
    maxDiscountPercentage: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('✅ Seeded business configuration settings.');

  // 12. Seed Initial System Notifications
  await db.collection('notifications').insertMany([
    {
      title: 'Welcome to Wood Business ERP',
      message: 'System initialization complete. Catalog, roles and permissions ready.',
      type: 'SUCCESS',
      category: 'SYSTEM',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: 'Low Stock Alert: Walnut Wood',
      message: 'Product WALNUT-USA-004 is approaching threshold (50 units remaining).',
      type: 'WARNING',
      category: 'LOW_STOCK',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('✅ Seeded notifications.');

  // 13. Seed Audit Log for Seeder
  await db.collection('audit_logs').insertOne({
    userId: superAdminUser._id,
    action: 'SYSTEM_SEED',
    module: 'database',
    entityType: 'database',
    entityId: 'ALL',
    metadata: { note: 'Fresh database initialized with realistic timber business dataset' },
    createdAt: new Date(),
  });

  console.log('====================================================');
  console.log('🪵 Database Seeding Completed Successfully!');
  console.log('🔑 Credentials:');
  console.log('   Super Admin: superadmin@wooderp.com / Admin123!');
  console.log('   Manager:     manager@wooderp.com    / Admin123!');
  console.log('   Staff:       staff@wooderp.com      / Staff123!');
  console.log('====================================================');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

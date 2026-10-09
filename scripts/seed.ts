import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ALL_PERMISSIONS } from '../src/common/constants/permissions.constant';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wood_business_erp';
const SUPER_ADMIN_PASSWORD = 'Kuberr@2026sai';

const SUPER_ADMINS = [
  { name: 'Anmol Kachhawaha', email: 'kachhawahaanmol19@gmail.com' },
  { name: 'Sai Vikas', email: 'saivikas19@gmail.com' },
];

function permissionDocument(code: string) {
  const [moduleName, action = 'view'] = code.split('.');
  const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  return {
    code,
    name: `${label(action)} ${label(moduleName)}`,
    module: moduleName,
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not ready.');
  }

  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    console.log(`Dropping collection: ${collection.name}`);
    await db.dropCollection(collection.name);
  }

  const permissions = ALL_PERMISSIONS.map(permissionDocument);
  await db.collection('permissions').insertMany(permissions);

  const superAdminRole = {
    _id: new mongoose.Types.ObjectId(),
    name: 'SUPER_ADMIN',
    description: 'Full system access',
    permissions: [...ALL_PERMISSIONS],
    isActive: true,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection('roles').insertOne(superAdminRole);

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
  await db.collection('users').insertMany(
    SUPER_ADMINS.map((admin) => ({
      _id: new mongoose.Types.ObjectId(),
      name: admin.name,
      email: admin.email.toLowerCase(),
      phone: '',
      passwordHash,
      role: superAdminRole._id,
      status: 'ACTIVE',
      avatar: '',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );

  console.log('Database cleared.');
  console.log('Created SUPER_ADMIN role and these accounts:');
  SUPER_ADMINS.forEach((admin) => console.log(`  ${admin.email}`));

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});

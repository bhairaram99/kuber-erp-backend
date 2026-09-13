const mongoose = require('mongoose');

async function fixExisting() {
  await mongoose.connect('mongodb://localhost:27017/wood_business_erp');
  const db = mongoose.connection.db;

  // 1. Fix all products currentStock
  const products = await db.collection('products').find().toArray();
  for (const p of products) {
    if (typeof p.currentStock === 'number') {
      const rounded = Math.round(p.currentStock);
      if (rounded !== p.currentStock) {
        console.log(`Fixing product: ${p.name} (${p.sku}) ${p.currentStock} -> ${rounded}`);
        await db.collection('products').updateOne({ _id: p._id }, { $set: { currentStock: rounded } });
      }
    }
  }

  // 2. Fix all inventory_transactions
  const txs = await db.collection('inventory_transactions').find().toArray();
  for (const t of txs) {
    let updateNeeded = false;
    const update = {};
    if (typeof t.quantity === 'number' && Math.round(t.quantity) !== t.quantity) {
      update.quantity = Math.round(t.quantity);
      updateNeeded = true;
    }
    if (typeof t.previousStock === 'number' && Math.round(t.previousStock) !== t.previousStock) {
      update.previousStock = Math.round(t.previousStock);
      updateNeeded = true;
    }
    if (typeof t.newStock === 'number' && Math.round(t.newStock) !== t.newStock) {
      update.newStock = Math.round(t.newStock);
      updateNeeded = true;
    }
    if (updateNeeded) {
      console.log(`Fixing transaction ${t._id}:`, update);
      await db.collection('inventory_transactions').updateOne({ _id: t._id }, { $set: update });
    }
  }

  console.log('Database cleanup completed successfully.');
  await mongoose.disconnect();
}

fixExisting().catch(console.error);

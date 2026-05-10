// IndexedDB の設定（Dexie.js を使用）
// データはすべてスマホ内のブラウザに保存される。サーバー不要。
import Dexie from 'dexie';

export const db = new Dexie('StockManagerDB');

db.version(1).stores({
  items: '++id, name, quantity, unit, location, expiryDate, price, purchaseDate, createdAt, updatedAt'
});

db.version(2).stores({
  items: '++id, name, quantity, unit, location, expiryDate, category, price, purchaseDate, createdAt, updatedAt'
});

db.version(3).stores({
  items: '++id, name, quantity, unit, location, expiryDate, category, targetQuantity, price, purchaseDate, createdAt, updatedAt',
  consumeLogs: '++id, itemId, consumedAt'
});

// version 4：stockGoals テーブルを新設
db.version(4).stores({
  items: '++id, name, quantity, unit, location, expiryDate, category, targetQuantity, price, purchaseDate, createdAt, updatedAt',
  consumeLogs: '++id, itemId, consumedAt',
  stockGoals: '++id, name, targetQuantity, unit, category, note, createdAt, updatedAt'
});

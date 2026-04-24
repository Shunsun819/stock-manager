// IndexedDB の設定（Dexie.js を使用）
// データはすべてスマホ内のブラウザに保存される。サーバー不要。
import Dexie from 'dexie';

export const db = new Dexie('StockManagerDB');

// version 1 はそのまま残す（既存データの移行に必要）
db.version(1).stores({
  items: '++id, name, quantity, unit, location, expiryDate, price, purchaseDate, createdAt, updatedAt'
});

// version 2：category フィールドを追加
// 既存アイテムの category は自動的に undefined になるが動作に問題なし
db.version(2).stores({
  items: '++id, name, quantity, unit, location, expiryDate, category, price, purchaseDate, createdAt, updatedAt'
});

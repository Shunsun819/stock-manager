// PWA用アイコン生成スクリプト（Node.js 組み込みモジュールのみ使用）
// 実行: node generate-icons.js
import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';

// 32ビット整数をビッグエンディアンのBufferに変換
const uint32BE = (n) => {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n);
  return b;
};

// PNGのCRC計算
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// PNGチャンクを作成
function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = uint32BE(crc32(crcInput));
  return Buffer.concat([uint32BE(data.length), typeBuffer, data, crc]);
}

// シンプルなRGBA PNGを生成（緑の背景 + 白い「S」文字の描画は省略してシンプルな緑の正方形）
function generateSimplePNG(size) {
  // PNGシグネチャ
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDRチャンク（画像サイズ、ビット深度、カラータイプ）
  const ihdr = Buffer.concat([
    uint32BE(size),  // 幅
    uint32BE(size),  // 高さ
    Buffer.from([8, 2, 0, 0, 0]), // 8bit RGB、圧縮なし、フィルタなし、インターレースなし
  ]);

  // ピクセルデータを生成（緑: #2E7D32 = R:46 G:125 B:50）
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 3); // フィルタバイト + RGBピクセル
    row[0] = 0; // フィルタタイプ: None
    for (let x = 0; x < size; x++) {
      row[1 + x * 3 + 0] = 46;  // R
      row[1 + x * 3 + 1] = 125; // G
      row[1 + x * 3 + 2] = 50;  // B
    }
    rows.push(row);
  }

  const rawData = Buffer.concat(rows);
  const compressed = deflateSync(rawData);

  // IDATチャンク（圧縮済みピクセルデータ）
  const idat = compressed;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// 192x192 と 512x512 を生成
writeFileSync('public/icon-192.png', generateSimplePNG(192));
console.log('Generated: public/icon-192.png');

writeFileSync('public/icon-512.png', generateSimplePNG(512));
console.log('Generated: public/icon-512.png');

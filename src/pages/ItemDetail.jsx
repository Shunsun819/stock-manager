// アイテム詳細・数量更新画面
// ＋／－ボタンでワンタップ数量更新、編集・削除も可能
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';

// 消費期限が7日以内かどうかを判定する
const isExpiringSoon = (expiryDate) => {
  if (!expiryDate) return false;
  const diffDays = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
};

// 消費期限が切れているかどうかを判定する
const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

// 日付を日本語形式（YYYY/MM/DD）で表示する
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export default function ItemDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(0); // 画面上で変更中の数量（まだDBには保存されていない）
  const [saved, setSaved] = useState(false); // 保存完了フラグ（保存ボタンを押した後に表示）

  // アイテムデータをDBから取得する
  useEffect(() => {
    db.items.get(Number(id)).then(data => {
      if (!data) {
        navigate('/');
        return;
      }
      setItem(data);
      setQuantity(data.quantity);
    });
  }, [id, navigate]);

  // 数量を1減らす（0未満にはならない）
  const handleDecrement = () => {
    setQuantity(prev => Math.max(0, prev - 1));
    setSaved(false);
  };

  // 数量を1増やす
  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
    setSaved(false);
  };

  // 数量をDBに保存する
  const handleSave = async () => {
    await db.items.update(Number(id), {
      quantity,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    // 1秒後にホーム画面へ戻る
    setTimeout(() => navigate('/'), 1000);
  };

  // アイテムを削除する
  const handleDelete = async () => {
    const confirmed = window.confirm(`「${item.name}」を削除しますか？\nこの操作は取り消せません。`);
    if (confirmed) {
      await db.items.delete(Number(id));
      navigate('/');
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* ヘッダー */}
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-white opacity-80 text-xl"
          aria-label="戻る"
        >
          ←
        </button>
        <h1 className="text-lg font-bold flex-1 truncate">{item.name}</h1>
        {/* 編集ボタン */}
        <button
          onClick={() => navigate(`/item/${id}/edit`)}
          className="text-white opacity-80 text-sm"
        >
          編集
        </button>
      </header>

      <div className="px-4 pt-6">
        {/* アイテム情報カード */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">{item.name}</h2>

          {/* 保管場所 */}
          {item.location && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-400 text-sm">📍 保管場所</span>
              <span className="text-gray-700 text-sm">{item.location}</span>
            </div>
          )}

          {/* 消費期限 */}
          {item.expiryDate && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-400 text-sm">📅 消費期限</span>
              <span className={`text-sm font-medium ${
                isExpired(item.expiryDate)
                  ? 'text-red-600'
                  : isExpiringSoon(item.expiryDate)
                    ? 'text-orange-600'
                    : 'text-gray-700'
              }`}>
                {formatDate(item.expiryDate)}
                {isExpired(item.expiryDate) && ' ⚠ 期限切れ'}
                {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && ' ⚠ まもなく期限'}
              </span>
            </div>
          )}

          {/* 購入価格（設定済みの場合のみ表示） */}
          {item.price != null && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">💴 購入価格</span>
              <span className="text-gray-700 text-sm">¥{item.price.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* 数量コントロール（メイン機能） */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-center text-sm text-gray-500 mb-4">数量を変更</p>

          <div className="flex items-center justify-center gap-6">
            {/* 「－」ボタン */}
            <button
              onClick={handleDecrement}
              className="w-14 h-14 bg-white border-2 border-gray-200 rounded-xl text-2xl flex items-center justify-center active:bg-gray-50 disabled:opacity-30"
              disabled={quantity === 0}
              aria-label="1つ減らす"
            >
              −
            </button>

            {/* 現在の数量（大きく表示） */}
            <div className="text-center">
              <span className="text-5xl font-bold text-green-800">{quantity}</span>
              <span className="text-gray-500 text-lg ml-2">{item.unit || '個'}</span>
            </div>

            {/* 「＋」ボタン */}
            <button
              onClick={handleIncrement}
              className="w-14 h-14 bg-white border-2 border-gray-200 rounded-xl text-2xl flex items-center justify-center active:bg-gray-50"
              aria-label="1つ増やす"
            >
              ＋
            </button>
          </div>
        </div>

        {/* 数量を保存ボタン */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-bold text-base mb-3 transition-colors ${
            saved
              ? 'bg-gray-400 text-white'
              : 'bg-green-800 text-white active:bg-green-900'
          }`}
          disabled={saved}
        >
          {saved ? '✅ 保存しました' : '数量を保存'}
        </button>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="w-full py-3 text-red-500 rounded-xl font-medium text-base border border-red-100"
        >
          削除する
        </button>
      </div>
    </div>
  );
}

// ホーム（一覧）画面
// 登録済みアイテム一覧と期限アラートバナー、カテゴリフィルタータブを表示する
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/db';

// カテゴリフィルターの選択肢（「すべて」を先頭に）
const FILTER_TABS = ['すべて', '食品', '日用品', '防災', 'その他'];

// カテゴリごとのアイコン
const CATEGORY_ICONS = {
  '食品': '🍱',
  '日用品': '🧴',
  '防災': '🔦',
  'その他': '📦',
};

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

export default function Home() {
  const navigate = useNavigate();

  // 選択中のカテゴリフィルター（初期値: すべて）
  const [selectedCategory, setSelectedCategory] = useState('すべて');

  // IndexedDB からアイテム一覧をリアルタイムで取得（追加・更新・削除が自動反映される）
  const items = useLiveQuery(() => db.items.orderBy('createdAt').reverse().toArray());

  // カテゴリでフィルタリング
  // 「その他」タブはカテゴリ未設定のアイテムも含める（ver.0の既存データが消えないように）
  const filteredItems = items === undefined ? undefined
    : selectedCategory === 'すべて'
      ? items
      : selectedCategory === 'その他'
        ? items.filter(item => !item.category || item.category === 'その他')
        : items.filter(item => item.category === selectedCategory);

  // 期限が近いアイテムの件数を数える（全アイテム対象・フィルターに関係なく表示）
  const expiringSoonCount = items?.filter(item => isExpiringSoon(item.expiryDate)).length ?? 0;

  return (
    <div className="min-h-screen bg-[#F5F9F5] pb-24">
      {/* ヘッダー */}
      <header className="bg-green-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold">うちのストック</h1>
        <span className="text-sm opacity-80">{items?.length ?? 0}件</span>
      </header>

      <div className="px-4 pt-4">
        {/* 期限アラートバナー（7日以内に期限が来るアイテムがあるときだけ表示） */}
        {expiringSoonCount > 0 && (
          <div className="bg-orange-50 border border-orange-300 rounded-xl p-3 mb-4 flex items-center gap-2">
            <span className="text-orange-600 text-lg">⚠</span>
            <p className="text-orange-700 text-sm font-medium">
              期限が近いアイテムが <span className="font-bold">{expiringSoonCount}件</span> あります
            </p>
          </div>
        )}

        {/* カテゴリフィルタータブ（横スクロール可） */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedCategory(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                selectedCategory === tab
                  ? 'bg-green-800 text-white border-green-800'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* アイテム一覧 */}
        {filteredItems === undefined ? (
          // データ読み込み中
          <p className="text-center text-gray-400 py-10">読み込み中...</p>
        ) : filteredItems.length === 0 ? (
          // アイテムが0件のとき（フィルター状況に応じてメッセージを変える）
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              {selectedCategory === 'すべて'
                ? <>まだアイテムがありません。<br />右下の＋ボタンから登録してください</>
                : `「${selectedCategory}」のアイテムはまだありません`}
            </p>
          </div>
        ) : (
          // アイテムカード一覧
          filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3 flex items-center gap-3 cursor-pointer active:opacity-70"
              onClick={() => navigate(`/item/${item.id}`)}
            >
              {/* アイコン（カテゴリに応じて絵文字を変える） */}
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {CATEGORY_ICONS[item.category] || '📦'}
              </div>

              {/* アイテム情報 */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {/* カテゴリバッジ */}
                  {item.category && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                      {item.category}
                    </span>
                  )}
                  {/* 保管場所 */}
                  {item.location && (
                    <span className="text-xs text-gray-500">📍{item.location}</span>
                  )}
                  {/* 消費期限 */}
                  {item.expiryDate && (
                    <span className={`text-xs font-medium ${
                      isExpired(item.expiryDate)
                        ? 'text-red-600'
                        : isExpiringSoon(item.expiryDate)
                          ? 'text-orange-600'
                          : 'text-gray-400'
                    }`}>
                      期限: {formatDate(item.expiryDate)}
                      {isExpired(item.expiryDate) && ' (期限切れ)'}
                      {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && ' ⚠'}
                    </span>
                  )}
                </div>
              </div>

              {/* 数量 */}
              <div className="flex-shrink-0 text-right">
                <span className="text-xl font-bold text-green-800">{item.quantity}</span>
                <span className="text-xs text-gray-500 ml-1">{item.unit || '個'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB（右下の登録ボタン） */}
      <button
        className="fixed bottom-16 right-4 w-14 h-14 bg-green-800 text-white rounded-2xl shadow-lg text-3xl flex items-center justify-center active:bg-green-900"
        onClick={() => navigate('/add')}
        aria-label="アイテムを登録する"
      >
        ＋
      </button>
    </div>
  );
}

// アイテム登録・編集フォーム
// URLパラメータに id がある場合は「編集モード」、ない場合は「新規登録モード」として動作する
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db/db';

// カテゴリの選択肢（固定リスト）
const CATEGORIES = ['食品', '日用品', '防災', 'その他'];

export default function AddItem() {
  const navigate = useNavigate();
  const { id } = useParams(); // 編集モードのとき: id あり、新規登録: id なし
  const isEditMode = Boolean(id);

  // フォームの入力値
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [location, setLocation] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [price, setPrice] = useState('');

  // エラーメッセージ
  const [errors, setErrors] = useState({});

  // 編集モードのとき、既存データをフォームに読み込む
  useEffect(() => {
    if (!isEditMode) return;
    db.items.get(Number(id)).then(item => {
      if (!item) {
        navigate('/');
        return;
      }
      setName(item.name);
      setCategory(item.category || '');
      setQuantity(String(item.quantity));
      setUnit(item.unit || '');
      setLocation(item.location || '');
      setExpiryDate(item.expiryDate || '');
      setPrice(item.price != null ? String(item.price) : '');
    });
  }, [id, isEditMode, navigate]);

  // バリデーション
  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'アイテム名を入力してください';
    }
    if (quantity === '' || Number(quantity) < 0 || isNaN(Number(quantity))) {
      newErrors.quantity = '数量を正しく入力してください';
    }
    return newErrors;
  };

  // フォームの送信（登録 or 更新）
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const now = new Date().toISOString();

    if (isEditMode) {
      // 更新処理
      await db.items.update(Number(id), {
        name: name.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        location: location.trim(),
        expiryDate: expiryDate || null,
        category: category || null,
        price: price ? Number(price) : null,
        updatedAt: now,
      });
    } else {
      // 新規登録処理
      await db.items.add({
        name: name.trim(),
        quantity: Number(quantity),
        unit: unit.trim(),
        location: location.trim(),
        expiryDate: expiryDate || null,
        category: category || null,
        price: price ? Number(price) : null,
        purchaseDate: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* ヘッダー */}
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-white opacity-80 text-xl"
          aria-label="戻る"
        >
          ←
        </button>
        <h1 className="text-lg font-bold">
          {isEditMode ? 'アイテムを編集' : 'アイテムを登録'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pt-6 pb-24">
        {/* アイテム名（必須） */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            アイテム名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例：サバ缶、懐中電灯、トイレットペーパー"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600 bg-white"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* カテゴリ選択（タップで選択・再タップで解除） */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat === category ? '' : cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  category === cat
                    ? 'bg-green-800 text-white border-green-800'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">選択しなくてもOKです</p>
        </div>

        {/* 数量・単位（同じ行に並べる） */}
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              数量 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              min="0"
              placeholder="0"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600 bg-white"
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">単位</label>
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="個・缶・袋…"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600 bg-white"
            />
          </div>
        </div>

        {/* 保管場所 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">保管場所</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="例：押し入れ、キッチン、玄関"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600 bg-white"
          />
        </div>

        {/* 消費期限 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">消費期限</label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600 bg-white"
          />
        </div>

        {/* 購入価格（任意） */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            購入価格 <span className="text-gray-400 text-xs">（任意・将来の家計簿連携用）</span>
          </label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            min="0"
            placeholder="例：198"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600 bg-white"
          />
        </div>

        {/* ボタン */}
        <button
          type="submit"
          className="w-full py-3 bg-green-800 text-white rounded-xl font-bold text-base mt-2 active:bg-green-900"
        >
          {isEditMode ? '更新する' : '登録する'}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full py-3 text-gray-500 rounded-xl font-medium text-base mt-3"
        >
          キャンセル
        </button>
      </form>
    </div>
  );
}

// 備蓄計画画面
// 「家に備えておきたいもの」をゴールとして登録し、達成状況を確認する。
// ストック一覧（items）に同名アイテムがあれば自動的に現在数として反映する。
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

// カテゴリの選択肢
const CATEGORIES = ['食品', '日用品', '防災', 'その他'];

// 単位のプリセット
const UNIT_PRESETS = ['個', '本', '袋', '缶', '箱', 'パック', 'kg', 'g', 'L', 'ml', '枚', 'セット'];

// 達成ステータスを返す
const getAchievementStatus = (current, target) => {
  if (current === null) return { icon: '🔴', label: '未取得', color: 'text-red-500' };
  if (current === 0)    return { icon: '🔴', label: '未達成', color: 'text-red-500' };
  if (current >= target) return { icon: '🟢', label: '達成！', color: 'text-green-600' };
  return { icon: '🟡', label: '途中', color: 'text-orange-500' };
};

// 空のゴールフォーム初期値
const emptyForm = { name: '', targetQuantity: '', unit: '個', category: '食品', note: '' };

export default function GoalManager() {
  const navigate = useNavigate();

  // 備蓄ゴール一覧
  const goals = useLiveQuery(() => db.stockGoals.orderBy('createdAt').toArray());

  // ストックアイテム一覧（名前でマッチするために取得）
  const items = useLiveQuery(() => db.items.toArray());

  // フォームの状態
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  // ゴール名でストックアイテムを自動マッチし、現在の数量を返す
  const matchedQuantity = (goalName) => {
    if (!items) return null;
    const matched = items.find(
      item => item.name.trim().toLowerCase() === goalName.trim().toLowerCase()
    );
    return matched ? matched.quantity : null;
  };

  // 達成ゴール数
  const achievedCount = goals?.filter(goal => {
    const current = matchedQuantity(goal.name);
    return current !== null && current >= goal.targetQuantity;
  }).length ?? 0;

  // フォームを開く（新規）
  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  };

  // フォームを開く（編集）
  const openEditForm = (goal) => {
    setForm({
      name: goal.name,
      targetQuantity: String(goal.targetQuantity),
      unit: goal.unit || '個',
      category: goal.category || '食品',
      note: goal.note || '',
    });
    setEditingId(goal.id);
    setFormError('');
    setShowForm(true);
  };

  // フォームを閉じる
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  };

  // ゴールを保存（新規 or 編集）
  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim()) {
      setFormError('アイテム名を入力してください');
      return;
    }
    const qty = Number(form.targetQuantity);
    if (!qty || qty <= 0 || isNaN(qty)) {
      setFormError('目標数量を正しく入力してください');
      return;
    }

    const now = new Date().toISOString();
    const data = {
      name: form.name.trim(),
      targetQuantity: qty,
      unit: form.unit.trim() || '個',
      category: form.category,
      note: form.note.trim() || null,
      updatedAt: now,
    };

    if (editingId !== null) {
      await db.stockGoals.update(editingId, data);
    } else {
      await db.stockGoals.add({ ...data, createdAt: now });
    }
    closeForm();
  };

  // ゴールを削除
  const handleDelete = async (id) => {
    if (!window.confirm('このゴールを削除しますか？')) return;
    await db.stockGoals.delete(id);
  };

  return (
    <div className="min-h-screen bg-[#F5F9F5] pb-24">

      {/* ヘッダー */}
      <header className="bg-green-800 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="text-white opacity-80 text-xl"
          aria-label="戻る"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">備蓄計画</h1>
        </div>
        {goals && goals.length > 0 && (
          <span className="text-xs opacity-80">
            {achievedCount}/{goals.length} 達成
          </span>
        )}
      </header>

      <div className="px-4 pt-4">

        {/* 説明文 */}
        <p className="text-sm text-gray-500 mb-4">
          家に備えておきたいものを登録しましょう。ストックに同じ名前のアイテムがあれば達成状況が自動で反映されます。
        </p>

        {/* ゴール追加ボタン */}
        {!showForm && (
          <button
            onClick={openAddForm}
            className="w-full py-3 mb-4 bg-green-800 text-white rounded-xl font-bold text-sm active:bg-green-900"
          >
            ＋ ゴールを追加する
          </button>
        )}

        {/* 追加・編集フォーム */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 mb-4">
            <p className="font-bold text-gray-800 text-sm mb-3">
              {editingId !== null ? 'ゴールを編集' : '新しいゴールを追加'}
            </p>

            {/* アイテム名 */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                アイテム名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="goal-name-options"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例：お米、缶詰、トイレットペーパー"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-600 bg-white"
                autoFocus
              />
              {/* ストックにある名前をサジェスト */}
              <datalist id="goal-name-options">
                {items?.map(item => (
                  <option key={item.id} value={item.name} />
                ))}
              </datalist>
            </div>

            {/* 目標数量・単位 */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  目標数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.targetQuantity}
                  onChange={e => setForm(f => ({ ...f, targetQuantity: e.target.value }))}
                  min="1"
                  placeholder="例：6"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-600 bg-white"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-600 mb-1">単位</label>
                <input
                  type="text"
                  list="goal-unit-options"
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="個"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-600 bg-white"
                />
                <datalist id="goal-unit-options">
                  {UNIT_PRESETS.map(u => <option key={u} value={u} />)}
                </datalist>
              </div>
            </div>

            {/* カテゴリ */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">カテゴリ</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      form.category === cat
                        ? 'bg-green-800 text-white border-green-800'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* メモ */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">メモ（任意）</label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="例：3ヶ月分を目標"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-600 bg-white"
              />
            </div>

            {/* エラー */}
            {formError && (
              <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            {/* ボタン */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-green-800 text-white rounded-xl font-bold text-sm active:bg-green-900"
              >
                保存する
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2.5 text-gray-500 rounded-xl font-medium text-sm border border-gray-200 bg-white"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* ゴールが0件のとき */}
        {goals !== undefined && goals.length === 0 && !showForm && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎯</p>
            <p className="text-gray-500 text-sm">
              まだゴールが登録されていません。<br />
              備えておきたいものを追加してみましょう。
            </p>
          </div>
        )}

        {/* ゴールカード一覧 */}
        {goals && goals.length > 0 && (
          <div>
            {goals.map(goal => {
              const current = matchedQuantity(goal.name);
              const status = getAchievementStatus(current, goal.targetQuantity);
              const progressPct = current === null
                ? 0
                : Math.min(100, Math.round((current / goal.targetQuantity) * 100));

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3"
                >
                  {/* 上段：名前・ステータス */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 truncate">{goal.name}</p>
                        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                          {goal.category}
                        </span>
                      </div>
                      {goal.note && (
                        <p className="text-xs text-gray-400 mt-0.5">{goal.note}</p>
                      )}
                    </div>
                    {/* 編集・削除ボタン */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditForm(goal)}
                        className="text-xs text-gray-500 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 active:bg-gray-100"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="text-xs text-gray-400 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 active:bg-gray-100"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  {/* 中段：数量・ステータス */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-sm text-gray-600">
                      {current !== null ? (
                        <>
                          <span className="font-bold text-green-800 text-base">{current}</span>
                          <span className="text-gray-400">/{goal.targetQuantity} {goal.unit}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400">ストック未登録</span>
                          <span className="text-gray-400"> / 目標 {goal.targetQuantity} {goal.unit}</span>
                        </>
                      )}
                    </div>
                    <span className={`text-xs font-bold ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>

                  {/* 進捗バー */}
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progressPct >= 100 ? 'bg-green-500' :
                        progressPct >= 30  ? 'bg-orange-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-gray-400 mt-0.5">{progressPct}%</p>

                  {/* ストック連携ヒント（未登録の場合） */}
                  {current === null && (
                    <p className="text-xs text-gray-400 mt-2 bg-gray-50 rounded-lg px-3 py-1.5">
                      💡 ストック登録で「{goal.name}」と同じ名前で登録すると自動で連携されます
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

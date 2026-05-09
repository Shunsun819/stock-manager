// ダッシュボード画面
// アプリの各機能へのナビゲーションハブ。ストック状況の概要も表示する。
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

const isExpiringSoon = (expiryDate) => {
  if (!expiryDate) return false;
  const diffDays = (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const items = useLiveQuery(() => db.items.toArray());
  const goals = useLiveQuery(() => db.stockGoals.toArray());

  const expiredCount = items?.filter(item => isExpired(item.expiryDate)).length ?? 0;
  const expiringSoonCount = items?.filter(item => isExpiringSoon(item.expiryDate)).length ?? 0;
  const needsRestockCount = items?.filter(
    item => item.targetQuantity > 0 && item.quantity < item.targetQuantity
  ).length ?? 0;

  const achievedGoalsCount = goals?.filter(goal => {
    const matched = items?.find(
      item => item.name.trim().toLowerCase() === goal.name.trim().toLowerCase()
    );
    return matched && matched.quantity >= goal.targetQuantity;
  }).length ?? 0;

  const totalGoalsCount = goals?.length ?? 0;

  const menuItems = [
    {
      icon: '📦',
      label: 'ストック一覧',
      description: items
        ? `${items.length}件登録中`
        : '登録中...',
      badge: (() => {
        if (expiredCount > 0)
          return { label: `期限切れ ${expiredCount}件`, color: 'bg-red-100 text-red-700' };
        if (expiringSoonCount > 0)
          return { label: `期限まもなく ${expiringSoonCount}件`, color: 'bg-orange-100 text-orange-700' };
        if (needsRestockCount > 0)
          return { label: `補充必要 ${needsRestockCount}件`, color: 'bg-yellow-100 text-yellow-700' };
        return null;
      })(),
      path: '/',
      accent: 'border-green-200 bg-white',
    },
    {
      icon: '🎯',
      label: '備蓄計画',
      description: totalGoalsCount > 0
        ? `${achievedGoalsCount}/${totalGoalsCount} 達成`
        : 'なにを備えるか計画する',
      badge: (() => {
        if (totalGoalsCount === 0) return null;
        if (achievedGoalsCount === totalGoalsCount)
          return { label: 'すべて達成！', color: 'bg-green-100 text-green-700' };
        const unachieved = totalGoalsCount - achievedGoalsCount;
        return { label: `未達成 ${unachieved}件`, color: 'bg-orange-100 text-orange-700' };
      })(),
      path: '/goals',
      accent: 'border-green-200 bg-white',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F9F5] pb-24">
      <header className="bg-green-800 text-white px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-bold">うちのストック</h1>
      </header>

      <div className="px-4 pt-4">
        <p className="text-sm text-gray-500 mb-4">何をしますか？</p>

        <div className="flex flex-col gap-3">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left rounded-2xl border p-4 shadow-sm active:opacity-70 ${item.accent}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                {item.badge && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.badge.color}`}>
                    {item.badge.label}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

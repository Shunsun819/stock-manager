// アプリのルーティング定義
// React Router を使って、URLに応じて表示する画面を切り替える
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ホーム（一覧）画面 */}
        <Route path="/" element={<Home />} />

        {/* アイテム新規登録画面 */}
        <Route path="/add" element={<AddItem />} />

        {/* アイテム詳細・数量更新画面 */}
        <Route path="/item/:id" element={<ItemDetail />} />

        {/* アイテム編集画面（AddItem を編集モードで表示） */}
        <Route path="/item/:id/edit" element={<AddItem />} />
      </Routes>
    </BrowserRouter>
  );
}

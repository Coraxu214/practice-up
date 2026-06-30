import { Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './lib/store.jsx';
import Home from './pages/Home.jsx';
import Import from './pages/Import.jsx';
import Today from './pages/Today.jsx';
import Share from './pages/Share.jsx';
import TabBar from './components/TabBar.jsx';

export default function App() {
  return (
    <StoreProvider>
      <div className="flex flex-col min-h-svh bg-cream">
        <main className="flex-1 pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/import" element={<Import />} />
            <Route path="/today" element={<Today />} />
            <Route path="/share/:date" element={<Share />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </StoreProvider>
  );
}

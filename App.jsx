import { useState, useEffect } from 'react';
// Components are located in the project root, adjust imports accordingly
import StartPage from './StartPage';
import MemorialPage from './MemorialPage';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('start');
  const [currentMemorialCode, setCurrentMemorialCode] = useState('');

  useEffect(() => {
    // Kiểm tra URL để xem có phải đang truy cập trang memorial không
    const path = window.location.pathname;
    const memorialMatch = path.match(/^\/memory\/(.+)$/);
    
    if (memorialMatch) {
      const code = memorialMatch[1];
      setCurrentMemorialCode(code);
      setCurrentView('memorial');
    }
  }, []);

  const handleNavigateToMemorial = (code) => {
    setCurrentMemorialCode(code);
    setCurrentView('memorial');
    // Cập nhật URL
    window.history.pushState({}, '', `/memory/${code}`);
  };

  const handleBackToStart = () => {
    setCurrentView('start');
    setCurrentMemorialCode('');
    // Cập nhật URL
    window.history.pushState({}, '', '/start');
  };

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const memorialMatch = path.match(/^\/memory\/(.+)$/);
      
      if (memorialMatch) {
        const code = memorialMatch[1];
        setCurrentMemorialCode(code);
        setCurrentView('memorial');
      } else {
        setCurrentView('start');
        setCurrentMemorialCode('');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentView === 'memorial') {
    return (
      <MemorialPage 
        code={currentMemorialCode} 
        onBack={handleBackToStart}
      />
    );
  }

  return (
    <StartPage onNavigateToMemorial={handleNavigateToMemorial} />
  );
}

export default App;

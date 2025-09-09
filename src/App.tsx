import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Memorial from './pages/Memorial';

type Page = 'landing' | 'dashboard' | 'memorial';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Loading Legacy.ai...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onGetStarted={() => setCurrentPage(isAuthenticated ? 'dashboard' : 'landing')} />;
      case 'dashboard':
        if (!isAuthenticated) {
          setCurrentPage('landing');
          return null;
        }
        return <Dashboard onNavigateToMemorial={() => setCurrentPage('memorial')} />;
      case 'memorial':
        return <Memorial />;
      default:
        return <Landing onGetStarted={() => setCurrentPage(isAuthenticated ? 'dashboard' : 'landing')} />;
    }
  };

  return <div className="App">{renderPage()}</div>;
}

export default App;
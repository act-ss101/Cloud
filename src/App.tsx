import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import MyFiles from './pages/MyFiles';
import Backups from './pages/Backups';
import Shared from './pages/Shared';
import Storage from './pages/Storage';
import Versions from './pages/Versions';
import TrashPage from './pages/Trash';
import AuthPage from './pages/Auth';
import { apiClient, type User } from './lib/api';

export type Page = 'dashboard' | 'files' | 'backups' | 'shared' | 'versions' | 'storage' | 'trash';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await apiClient.getMe();
        setIsAuthenticated(true);
        setCurrentUser(user);
      } catch {
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = async () => {
    try {
      const { user } = await apiClient.getMe();
      setIsAuthenticated(true);
      setCurrentUser(user);
    } catch {
      // Ignore
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('dashboard');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">Loading CloudVault...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'files':
        return <MyFiles />;
      case 'backups':
        return <Backups />;
      case 'shared':
        return <Shared />;
      case 'versions':
        return <Versions />;
      case 'storage':
        return <Storage />;
      case 'trash':
        return <TrashPage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          user={currentUser}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

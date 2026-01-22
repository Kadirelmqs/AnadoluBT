import { useNavigate } from 'react-router-dom';
import { LogOut, Code } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function DeveloperNavigation() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login/developer');
  };
  
  return (
    <nav className="bg-gradient-to-r from-red-600 to-pink-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-white" />
            <span className="text-white font-bold text-xl">Developer Panel - Anadolu BT</span>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Çıkış</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function DeveloperLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DeveloperNavigation />
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {children}
      </div>
      <footer className="bg-white border-t py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">Powered by <span className="font-semibold text-red-600">Anadolu BT</span></p>
        </div>
      </footer>
    </div>
  );
}
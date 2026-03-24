import { Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (user?.role === 'staff') return '/dashboard/worker';
    return '/dashboard/customer';
  };

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="bg-domestic-red w-10 h-10 rounded-2xl flex items-center justify-center text-white transform group-hover:rotate-12 transition-transform shadow-red-glow">
              <Building2 size={24} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900 leading-none mt-1">
              Domestic<span className="text-domestic-red">.</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/how-it-works" className="text-sm font-semibold text-gray-500 hover:text-domestic-red transition-colors">Nasıl Çalışır?</Link>
            <Link to="/" className="text-sm font-semibold text-gray-500 hover:text-domestic-red transition-colors">Hizmetler</Link>
            <Link to="/" className="text-sm font-semibold text-gray-500 hover:text-domestic-red transition-colors">Yorumlar</Link>
          </div>

          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="hidden sm:block text-sm font-bold text-gray-600 hover:text-domestic-red transition-colors px-3 py-2">
                  Giriş Yap
                </Link>
                <Link to="/role-selection" className="bg-domestic-red hover:bg-red-600 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-red-glow hover:shadow-lg transition-all active:scale-95">
                  Kayıt Ol
                </Link>
              </>
            ) : (
              <>
                <Link to={getDashboardPath()} className="hidden sm:block text-sm font-bold text-gray-600 hover:text-domestic-red transition-colors px-3 py-2">
                  Panelim
                </Link>
                <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold px-6 py-2.5 rounded-full transition-all active:scale-95">
                  Çıkış Yap
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

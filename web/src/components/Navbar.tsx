import { Building2, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (user?.role === 'worker') return '/dashboard/worker';
    return '/dashboard/customer';
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-sm shadow-md z-50 border-b border-gray-100/50 transition-all duration-300">
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

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/how-it-works" className="text-sm font-semibold text-gray-500 hover:text-domestic-red transition-colors">Nasıl Çalışır?</Link>
              <Link to="/" className="text-sm font-semibold text-gray-500 hover:text-domestic-red transition-colors">Hizmetler</Link>
              <Link to="/" className="text-sm font-semibold text-gray-500 hover:text-domestic-red transition-colors">Yorumlar</Link>
            </div>

            {/* Desktop Auth Actions */}
            <div className="hidden md:flex items-center gap-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-domestic-red transition-colors px-3 py-2">
                    Giriş Yap
                  </Link>
                  <Link to="/role-selection" className="bg-domestic-red hover:bg-red-600 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-red-glow hover:shadow-lg transition-all active:scale-95">
                    Kayıt Ol
                  </Link>
                </>
              ) : (
                <>
                  <Link to={getDashboardPath()} className="text-sm font-bold text-gray-600 hover:text-domestic-red transition-colors px-3 py-2">
                    Panelim
                  </Link>
                  <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold px-6 py-2.5 rounded-full transition-all active:scale-95">
                    Çıkış Yap
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/how-it-works" className="block px-4 py-3 text-base font-bold text-gray-700 hover:bg-red-50 hover:text-domestic-red rounded-xl transition-colors">Nasıl Çalışır?</Link>
            <Link to="/" className="block px-4 py-3 text-base font-bold text-gray-700 hover:bg-red-50 hover:text-domestic-red rounded-xl transition-colors">Hizmetler</Link>
            <Link to="/" className="block px-4 py-3 text-base font-bold text-gray-700 hover:bg-red-50 hover:text-domestic-red rounded-xl transition-colors">Yorumlar</Link>
            <div className="pt-4 border-t border-gray-100 space-y-3">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="block w-full text-center py-4 text-base font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Giriş Yap</Link>
                  <Link to="/role-selection" className="block w-full text-center py-4 text-base font-bold text-white bg-domestic-red rounded-xl shadow-red-glow">Kayıt Ol</Link>
                </>
              ) : (
                <>
                  <Link to={getDashboardPath()} className="block w-full text-center py-4 text-base font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">Panelim</Link>
                  <button onClick={handleLogout} className="w-full py-4 text-base font-bold text-gray-700 bg-gray-100 rounded-xl transition-colors">Çıkış Yap</button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

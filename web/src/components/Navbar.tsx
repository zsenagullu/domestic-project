import { Building2, Menu, X, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosInstance';

interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosInstance.get('/notifications/');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosInstance.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Poll notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsNotifOpen(false);
    }
  }, [isAuthenticated]);

  // Click away to close notifications dropdown
  useEffect(() => {
    if (!isNotifOpen) return;
    const closeNotif = () => setIsNotifOpen(false);
    document.addEventListener('click', closeNotif);
    return () => document.removeEventListener('click', closeNotif);
  }, [isNotifOpen]);

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
                  {/* Notifications Icon and Dropdown */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="relative p-2 rounded-full text-gray-600 hover:text-domestic-red hover:bg-gray-100 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                    >
                      <Bell size={22} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotifOpen && (
                      <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-fade-in origin-top-right">
                        <div className="flex justify-between items-center px-4 pb-2 border-b border-gray-100">
                          <span className="text-sm font-extrabold text-gray-900">Bildirimler</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-[11px] font-semibold text-domestic-red hover:underline cursor-pointer"
                            >
                              Tümünü Okundu İşaretle
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="text-center py-6 text-xs text-gray-400 font-medium">
                              Bildiriminiz bulunmuyor.
                            </div>
                          ) : (
                            notifications.slice(0, 10).map((notif) => (
                              <div
                                key={notif.id}
                                onClick={(e) => !notif.is_read && handleMarkAsRead(notif.id, e)}
                                className={`px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer transition-colors ${
                                  notif.is_read ? 'bg-white hover:bg-gray-50' : 'bg-red-50/40 hover:bg-red-50/60'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <h4 className={`text-xs ${notif.is_read ? 'font-semibold text-gray-700' : 'font-extrabold text-gray-900'}`}>
                                    {notif.title}
                                  </h4>
                                  {!notif.is_read && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1 shrink-0"></span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-gray-400 mt-2 block font-medium">
                                  {new Date(notif.created_at).toLocaleString('tr-TR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link to={getDashboardPath()} className="text-sm font-bold text-gray-600 hover:text-domestic-red transition-colors px-3 py-2">
                    Panelim
                  </Link>
                  <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold px-6 py-2.5 rounded-full transition-all active:scale-95">
                    Çıkış Yap
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button and Notification Bell */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 rounded-xl text-gray-600 hover:text-domestic-red hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-fade-in origin-top-right">
                      <div className="flex justify-between items-center px-4 pb-2 border-b border-gray-100">
                        <span className="text-sm font-extrabold text-gray-900">Bildirimler</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] font-semibold text-domestic-red hover:underline cursor-pointer"
                          >
                            Tümünü Oku
                          </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-xs text-gray-400 font-medium">
                            Bildiriminiz bulunmuyor.
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={(e) => !notif.is_read && handleMarkAsRead(notif.id, e)}
                              className={`px-4 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer transition-colors ${
                                notif.is_read ? 'bg-white' : 'bg-red-50/45'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <h4 className={`text-xs ${notif.is_read ? 'font-semibold text-gray-700' : 'font-extrabold text-gray-900'}`}>
                                  {notif.title}
                                </h4>
                                {!notif.is_read && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1 shrink-0"></span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                                {notif.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const loginRes = await axiosInstance.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      // Get user profile to determine role
      const userRes = await axiosInstance.get('/users/me', {
        headers: { Authorization: `Bearer ${loginRes.data.access_token}` }
      });
      
      login(loginRes.data.access_token, userRes.data);
      
      if (userRes.data.role === 'customer') {
        navigate('/dashboard/customer');
      } else {
        navigate('/dashboard/worker');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Giriş yaparken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center pt-28 pb-20 px-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 max-w-lg w-full">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Giriş Yap</h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">E-posta</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Şifre</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white bg-gray-900 hover:bg-black transition-all active:scale-95 shadow-md ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? "Giriş yapılıyor..." : "Devam Et"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500">
            Hesabın yok mu? <Link to="/role-selection" className="text-domestic-red font-bold hover:underline">Hemen Kayıt Ol</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

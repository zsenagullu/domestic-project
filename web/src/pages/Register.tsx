import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role') || 'customer';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axiosInstance.post('/auth/register', {
        name,
        email,
        password,
        role: requestedRole
      });
      console.log("Register Response:", res.data);
      
      // Auto login post registration
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const loginRes = await axiosInstance.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      console.log("Login (Auto) Response:", loginRes.data);
      
      if (loginRes.data && loginRes.data.access_token) {
        login(loginRes.data.access_token, res.data);
        
        if (res.data.role === 'customer') {
          navigate('/dashboard/customer');
        } else {
          navigate('/dashboard/worker');
        }
      } else {
        console.error("Token not found in response:", loginRes.data);
        setError("Token alınamadı, lütfen giriş yapmayı deneyin.");
      }
    } catch (err: any) {
      console.error("Register Error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.detail || 'Kayıt olurken bir hata oluştu';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = requestedRole === 'customer';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center pt-28 pb-20 px-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 max-w-lg w-full">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Kayıt Ol</h1>
          <p className="text-gray-500 mb-8 font-medium">
            {isCustomer ? "Müşteri olarak devam ediyorsun." : "Ev Asistanı olarak devam ediyorsun."}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">İsim Soyisim</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-domestic-red focus:ring-1 focus:ring-domestic-red transition-all"
                placeholder="Ad Soyad"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">E-posta</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-domestic-red focus:ring-1 focus:ring-domestic-red transition-all"
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
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-domestic-red focus:ring-1 focus:ring-domestic-red transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 ${
                isCustomer ? "bg-domestic-red hover:bg-red-600 shadow-red-glow" : "bg-[#1E3A8A] hover:bg-blue-900 shadow-md"
              } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? "Kayıt olunuyor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500">
            Zaten hesabın var mı? <Link to="/login" className="text-gray-900 font-bold hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Briefcase, FileText, User } from 'lucide-react';

export default function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState<'open_jobs' | 'bids' | 'profile'>('open_jobs');
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  if (!isAuthenticated || user?.role !== 'staff') return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pt-20">
      <Navbar />
      
      <main className="flex-grow w-full">
        <div className="bg-[#1E3A8A] text-white py-12 mb-8 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Ev Asistanı Paneli
            </h1>
            <p className="text-blue-200 mt-2 text-lg">
              Hoş geldin, {user.name}. Yeni görevleri incele ve kariyerini yönet.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex space-x-1 sm:space-x-4 mb-8 border-b border-gray-200 bg-white p-2 rounded-t-2xl shadow-sm">
            <button
              onClick={() => setActiveTab('open_jobs')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'open_jobs'
                  ? 'bg-blue-50 text-[#1E3A8A] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={18} /> Açık İlanlar
            </button>
            <button
              onClick={() => setActiveTab('bids')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'bids'
                  ? 'bg-blue-50 text-[#1E3A8A] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} /> Tekliflerim
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-[#1E3A8A] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User size={18} /> Profilim
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-20 min-h-[300px]">
            {activeTab === 'open_jobs' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Pazaryeri (Açık İlanlar)</h2>
                <p className="text-gray-500 mb-8 font-medium">
                  Burada müşterilerin oluşturduğu genel açık ilanları görebilirsiniz. Listeyi inceleyip sana uygun olanlara teklif ver!
                </p>
                <div className="border border-dashed border-gray-300 rounded-2xl p-10 flex text-center justify-center text-gray-400 font-bold">
                  İlan veritabanı yakında entegre edilecek...
                </div>
              </div>
            )}
            
            {activeTab === 'bids' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Mevcut Tekliflerim</h2>
                <p className="text-gray-500 mb-8 font-medium">
                  Müşterilere daha önce gönderdiğiniz freelance teklifleri buradan yönetebilirsiniz.
                </p>
                <div className="border border-dashed border-gray-300 rounded-2xl p-10 flex text-center justify-center text-gray-400 font-bold">
                  Henüz bir teklif göndermediniz.
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Profil Bilgileri</h2>
                <p className="text-gray-500 mb-8 font-medium">
                  Hizmet profilini eksiksiz tutarak daha çok müşteriye ulaşabilirsin. Becerilerinizi ve saatlik ücretinizi güncellemeyi unutmayın.
                </p>
                <div className="border border-dashed border-gray-300 rounded-2xl p-10 flex text-center justify-center text-gray-400 font-bold">
                  Profil düzenleme yakında eklenecek...
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

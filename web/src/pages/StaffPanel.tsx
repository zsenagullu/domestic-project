import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function StaffPanel() {
  const [activeTab, setActiveTab] = useState<'open_jobs' | 'direct_requests'>('open_jobs');
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-domestic-beige">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Personel Paneli
          </h1>
          <p className="text-gray-500 mt-2">Hoş geldin, {user?.name || 'Personel'}.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('open_jobs')}
            className={`pb-4 px-2 text-sm font-bold transition-colors ${
              activeTab === 'open_jobs'
                ? 'text-domestic-red border-b-2 border-domestic-red'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Açık İlanlar
          </button>
          <button
            onClick={() => setActiveTab('direct_requests')}
            className={`pb-4 px-2 text-sm font-bold transition-colors ${
              activeTab === 'direct_requests'
                ? 'text-domestic-red border-b-2 border-domestic-red'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Direkt İş Taleplerim
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'open_jobs' ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Pazaryeri (Açık İlanlar)</h2>
              <p className="text-gray-500">
                Burada müşterilerin oluşturduğu genel açık ilanları görebilirsiniz.
              </p>
              {/* İlan Listesi Bileşeni Gelecek */}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Direkt Booking Talepleri</h2>
              <p className="text-gray-500">
                Burada müşterilerin doğrudan size gönderdiği iş taleplerini görebilirsiniz.
              </p>
              {/* Direkt Talep Listesi Bileşeni Gelecek */}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

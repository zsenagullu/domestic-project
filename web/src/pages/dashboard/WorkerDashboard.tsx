import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Briefcase, FileText, User, MapPin, Home, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import OfferModal from '../../components/OfferModal';


interface Job {
  id: number;
  title: string;
  description: string;
  location?: string;
  house_size?: string;
  price?: number;
  created_at: string;
  service_type: string;
}

interface Offer {
  id: number;
  offered_price: number;
  message: string;
  estimated_time: string;
  status: 'pending' | 'accepted' | 'rejected';
  job_id: number;
  user_id: number;
  created_at: string;
  job?: Job;
}

export default function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState<'open_jobs' | 'bids' | 'profile'>('open_jobs');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Job states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Offer states
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isOffersLoading, setIsOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);

  // Offer modal state
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);


  useEffect(() => {
    if (activeTab === 'open_jobs') {
      fetchJobs();
    } else if (activeTab === 'bids') {
      fetchOffers();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    setIsJobsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/jobs/');
      setJobs(response.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('İlanlar yüklenemedi. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setIsJobsLoading(false);
    }
  };

  const fetchOffers = async () => {
    setIsOffersLoading(true);
    setOffersError(null);
    try {
      const response = await axiosInstance.get('/offers/user/me');
      setOffers(response.data);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setOffersError('Teklifler yüklenemedi');
    } finally {
      setIsOffersLoading(false);
    }
  };

  const handleGiveOffer = (job: Job) => {
    setSelectedJob(job);
    setIsOfferModalOpen(true);
  };


  if (authLoading) return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  if (!isAuthenticated || user?.role !== 'worker') return <Navigate to="/login" replace />;

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
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Pazaryeri (Açık İlanlar)</h2>
                    <p className="text-gray-500 font-medium">
                      İlanları inceleyip sana uygun olanlara teklif ver!
                    </p>
                  </div>
                  <button 
                    onClick={fetchJobs}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
                    title="Yenile"
                  >
                    <Loader2 size={24} className={isJobsLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {isJobsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 grayscale opacity-70">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-500 font-medium">İlanlar yükleniyor...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-bold">
                    {error}
                  </div>
                ) : jobs.filter(job => job.service_type === 'MARKETPLACE_BIDDING').length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-2xl p-16 flex flex-col items-center text-center justify-center text-gray-400">
                    <Briefcase size={48} className="mb-4 opacity-20" />
                    <p className="text-xl font-bold">Henüz teklif alımına açık ilan yok.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs
                      .filter(job => job.service_type === 'MARKETPLACE_BIDDING')
                      .map((job) => (
                        <div key={job.id} className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors">{job.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                              job.service_type === 'MARKETPLACE_BIDDING' 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-blue-50 text-blue-600'
                            }`}>
                              {job.service_type === 'MARKETPLACE_BIDDING' ? 'Teklif Alımı' : 'Hızlı Eşleşme'}
                            </span>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-gray-500 text-sm italic">
                            <MapPin size={16} className="text-blue-500" />
                            {job.location || 'Konum belirtilmedi'}
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Home size={16} className="text-gray-400" />
                            <span>Ev Büyüklüğü: </span>
                            <span className="font-bold text-gray-800">{job.house_size === 'small' ? 'Küçük' : job.house_size === 'medium' ? 'Orta' : 'Büyük'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <DollarSign size={16} className="text-green-600" />
                            <span>Bütçe: </span>
                            <span className="font-bold text-green-700">{job.price ? `${job.price} TL` : 'Belirtilmedi'}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <Calendar size={14} />
                            <span>{new Date(job.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleGiveOffer(job)}

                          className="w-full bg-[#1E3A8A] text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-sm"
                        >
                          Teklif Ver
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bids' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Tekliflerim</h2>
                    <p className="text-gray-500 font-medium">
                      Müşterilere daha önce gönderdiğiniz freelance teklifleri buradan yönetebilirsiniz.
                    </p>
                  </div>
                  <button 
                    onClick={fetchOffers}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
                    title="Yenile"
                  >
                    <Loader2 size={24} className={isOffersLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {isOffersLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 grayscale opacity-70">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-500 font-medium">Teklifler yükleniyor...</p>
                  </div>
                ) : offersError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-bold">
                    {offersError}
                  </div>
                ) : offers.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-2xl p-16 flex flex-col items-center text-center justify-center text-gray-400">
                    <FileText size={48} className="mb-4 opacity-20" />
                    <p className="text-xl font-bold">Henüz bir teklif göndermediniz.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.map((offer) => (
                      <div key={offer.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold text-gray-900">{offer.job?.title || 'İlan Başlığı'}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                            offer.status === 'accepted' 
                              ? 'bg-green-100 text-green-700' 
                              : offer.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {offer.status === 'accepted' ? 'Kabul Edildi' : offer.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 flex items-center gap-1"><DollarSign size={14} /> Teklif Fiyatı:</span>
                            <span className="font-bold text-gray-900">{offer.offered_price} TL</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> Tahmini Süre:</span>
                            <span className="font-bold text-gray-900">{offer.estimated_time}</span>
                          </div>

                          <div className="pt-3 border-t border-gray-50">
                            <span className="text-xs text-gray-400 block mb-1">Mesajınız:</span>
                            <p className="text-sm text-gray-600 line-clamp-2 italic">"{offer.message}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      <OfferModal 
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        jobId={selectedJob?.id || null}
        jobTitle={selectedJob?.title || ''}
      />
    </div>

  );
}

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FormFlowIntro from '../../components/FormFlowIntro';
import PostJobIntro from '../../components/PostJobIntro';
import FormSection from '../../components/FormSection';
import Results from '../../components/Results';
import PostJobModal from '../../components/PostJobModal';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosInstance';
import { 
  FileText, 
  User as UserIcon, 
  DollarSign, 
  Clock, 
  Check, 
  X, 
  Loader2,
  Briefcase
} from 'lucide-react';

interface User {
  id: number;
  name: string;
}

interface Offer {
  id: number;
  offered_price: number;
  message: string;
  estimated_time: string;
  status: 'pending' | 'accepted' | 'rejected';
  worker?: User;
}

interface Job {
  id: number;
  title: string;
  user_id: number;
  offers: Offer[];
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<'service' | 'offers'>('service');
  const [formDataSubmitted, setFormDataSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Offers state
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'offers') {
      fetchMyJobsAndOffers();
    }
  }, [activeTab]);

  const fetchMyJobsAndOffers = async () => {
    setIsJobsLoading(true);
    setJobsError(null);
    try {
      // Get all jobs and filter by current user
      const response = await axiosInstance.get('/jobs/');
      const userJobs = response.data.filter((job: Job) => job.user_id === user?.id);
      setMyJobs(userJobs);
    } catch (err) {
      console.error('Error fetching jobs/offers:', err);
      setJobsError('Bilgiler yüklenemedi. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setIsJobsLoading(false);
    }
  };

  const handleOfferAction = async (offerId: number, status: 'accepted' | 'rejected') => {
    try {
      await axiosInstance.patch(`/offers/${offerId}/status`, { status });
      // Refresh list
      fetchMyJobsAndOffers();
    } catch (err) {
      console.error(`Error updating offer status to ${status}:`, err);
      alert('İşlem başarısız oldu. Lütfen tekrar deneyin.');
    }
  };

  const handleScrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      const element = document.getElementById("service-details");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  if (!isAuthenticated || user?.role !== 'customer') return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col min-h-screen bg-domestic-beige pt-20">
      <Navbar />
      
      <main className="flex-grow w-full">
        <div className="bg-white border-b border-gray-100 py-12 mb-8 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Müşteri Paneli
            </h1>
            <p className="text-lg text-gray-500 mt-2">
              Hoş geldin, {user.name}. Evin için en doğru uzmanı bulmaya hazır mısın?
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex space-x-4 mb-8 border-b border-gray-200 bg-white p-2 rounded-t-2xl shadow-sm">
            <button
              onClick={() => setActiveTab('service')}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'service'
                  ? 'bg-[#1E3A8A] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Briefcase size={18} /> Hızlı Hizmet Al
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'offers'
                  ? 'bg-[#1E3A8A] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} /> Gelen Teklifler
              {myJobs.reduce((acc, job) => acc + job.offers.filter(o => o.status === 'pending').length, 0) > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                  {myJobs.reduce((acc, job) => acc + job.offers.filter(o => o.status === 'pending').length, 0)}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'service' && (
            <>
              <section className="relative z-20 w-full mb-20">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  <FormFlowIntro onToggleForm={handleScrollToForm} />
                  <PostJobIntro onPostJob={() => setShowPostJobModal(true)} />
                </div>
              </section>

              {showForm && <FormSection setFormDataSubmitted={setFormDataSubmitted} />}
              {formDataSubmitted && <Results />}
            </>
          )}

          {activeTab === 'offers' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-20 min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Gelen Teklifler</h2>
                  <p className="text-gray-500 font-medium">İlanlarınıza gelen teklifleri inceleyin, karşılaştırın ve onaylayın.</p>
                </div>
                <button 
                  onClick={fetchMyJobsAndOffers}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#1E3A8A]"
                  title="Yenile"
                >
                  <Loader2 size={24} className={isJobsLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {isJobsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                  <Loader2 size={48} className="animate-spin text-[#1E3A8A] mb-4" />
                  <p className="text-gray-500 font-medium">Teklifler yükleniyor...</p>
                </div>
              ) : jobsError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-bold">
                  {jobsError}
                </div>
              ) : myJobs.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-2xl p-16 flex flex-col items-center text-center justify-center text-gray-400">
                  <Briefcase size={48} className="mb-4 opacity-20" />
                  <p className="text-xl font-bold">Henüz yayınlanmış bir ilanınız bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {myJobs.map(job => (
                    <div key={job.id} className="border-b border-gray-100 pb-8 last:border-0">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-50 p-2 rounded-lg text-[#1E3A8A]">
                          <Briefcase size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-bold">
                          {job.offers.length} Teklif
                        </span>
                      </div>

                      {job.offers.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 italic">
                          Bu ilan için henüz bir teklif gelmedi.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {job.offers.map(offer => (
                            <div key={offer.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#1E3A8A]">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                    <UserIcon size={16} />
                                  </div>
                                  <span className="font-bold text-gray-900">{offer.worker?.name || 'Uzman'}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  offer.status === 'accepted' 
                                    ? 'bg-green-100 text-green-700' 
                                    : offer.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {offer.status === 'accepted' ? 'Kabul Edildi' : offer.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                                </span>
                              </div>

                              <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 flex items-center gap-1"><DollarSign size={14} /> Teklif:</span>
                                  <span className="font-bold text-green-600">{offer.offered_price} TL</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 flex items-center gap-1"><Clock size={14} /> Süre:</span>
                                  <span className="font-bold text-gray-900">{offer.estimated_time}</span>
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-50">
                                  <p className="text-sm text-gray-600 italic">"{offer.message}"</p>
                                </div>
                              </div>

                              {offer.status === 'pending' && (
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                  <button
                                    onClick={() => handleOfferAction(offer.id, 'accepted')}
                                    className="flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
                                  >
                                    <Check size={16} /> Kabul Et
                                  </button>
                                  <button
                                    onClick={() => handleOfferAction(offer.id, 'rejected')}
                                    className="flex items-center justify-center gap-1 bg-white border border-red-200 text-red-600 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                                  >
                                    <X size={16} /> Reddet
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <PostJobModal 
          isOpen={showPostJobModal} 
          onClose={() => setShowPostJobModal(false)} 
        />
      </main>

      <Footer />
    </div>
  );
}

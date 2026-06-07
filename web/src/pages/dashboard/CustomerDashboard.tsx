import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FormFlowIntro from '../../components/FormFlowIntro';
import PostJobIntro from '../../components/PostJobIntro';
import DirectBookingModal from '../../components/DirectBookingModal';
import EditJobModal from '../../components/EditJobModal';
import Results from '../../components/Results';
import PostJobModal from '../../components/PostJobModal';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosInstance';
import Toast from '../../components/Toast';
import { 
  FileText, 
  User as UserIcon, 
  DollarSign, 
  Clock, 
  Check, 
  X, 
  Loader2,
  Briefcase,
  Sparkles,
  MapPin,
  Mic
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
  description: string;
  user_id: number;
  offers: Offer[];
  location?: string;
  house_size?: string;
  price?: number;
  status: string;
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<'service' | 'offers'>('service');
  const [formDataSubmitted, setFormDataSubmitted] = useState(false);
  const [showDirectBookingModal, setShowDirectBookingModal] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // AI Analysis state
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInitialData, setAiInitialData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Speech Recognition API is not supported in this browser.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setAiInput((prev) => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setRecognitionInstance(recognition);
    } catch (error) {
      console.error('Speech recognition failed to start:', error);
      setIsListening(false);
    }
  };

  // Offers state
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'offers') {
      fetchMyJobsAndOffers();
    }
  }, [activeTab]);

  const handleAIAnalysis = async () => {
    if (!aiInput.trim()) return;
    
    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const response = await axiosInstance.post('/ai/analyze-voice', { text: aiInput });
      const data = response.data;
      const result = JSON.parse(data.raw_json);
      setAiResult(result);
    } catch (err) {
      console.error('AI Analysis error:', err);
      setToast({ message: 'Analiz yapılamadı. Lütfen tekrar deneyiniz.', type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePostAIJob = () => {
    if (!aiResult) return;
    
    setAiInitialData({
      title: `${aiResult.location || 'Evin'} İçin Temizlik Talebi`,
      description: aiResult.description || aiInput,
      location: aiResult.location,
      house_size: aiResult.house_size,
      price: aiResult.estimated_price,
      cleaning_type: aiResult.cleaning_type,
      preferred_date: aiResult.preferred_date,
      has_pets: aiResult.has_pets,
      has_allergies: aiResult.has_allergies,
      special_notes: aiResult.special_notes
    });
    setShowPostJobModal(true);
  };

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
      setToast({ 
        message: status === 'accepted' ? 'Teklif kabul edildi!' : 'Teklif reddedildi!', 
        type: 'success' 
      });
      // Refresh list
      fetchMyJobsAndOffers();
    } catch (err) {
      console.error(`Error updating offer status to ${status}:`, err);
      setToast({ message: 'İşlem başarısız oldu. Lütfen tekrar deneyin.', type: 'error' });
    }
  };

  const handleScrollToForm = () => {
    setShowDirectBookingModal(true);
  };

  const handleEditJobClick = (job: Job) => {
    setSelectedJobForEdit(job);
    setShowEditJobModal(true);
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
              {/* AI Analysis Section */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-12 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles size={120} className="text-[#1E3A8A]" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                      <Sparkles size={20} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900">AI ile Hızlı Planla</h2>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Örn: Ankara Çankaya'da 3 odalı evim var, bu hafta sonu temizlenmesi lazım, bütçem 500 TL"
                        className="w-full h-32 px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-200 focus:bg-white rounded-3xl outline-none transition-all font-medium resize-none text-gray-700 placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="flex flex-row gap-3 justify-end items-end">
                        <button
                          onClick={handleAIAnalysis}
                          disabled={isAnalyzing || !aiInput.trim()}
                          className="flex-grow md:flex-grow-0 whitespace-nowrap px-8 py-4 bg-gradient-to-r from-purple-600 to-[#1E3A8A] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-100 hover:shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              Analiz ediliyor...
                            </>
                          ) : (
                            <>
                              <Sparkles size={20} />
                              AI ile Analiz Et
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={toggleSpeechRecognition}
                          className={`p-4 rounded-2xl font-bold flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 shadow-md ${
                            isListening
                              ? 'bg-red-500 text-white animate-pulse shadow-red-200 hover:bg-red-600'
                              : 'bg-purple-100 text-purple-600 hover:bg-purple-200 shadow-purple-100'
                          }`}
                          title="Sesle Konuş"
                        >
                          <Mic size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {aiResult && (
                    <div className="mt-8 bg-purple-50/50 border border-purple-100 rounded-[2rem] p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      <h3 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-4">Analiz Sonucu</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Konum</span>
                          <p className="font-bold text-gray-900 flex items-center gap-1">
                            <MapPin size={14} className="text-purple-500" /> {aiResult.location || 'Belirtilmedi'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Ev Büyüklüğü</span>
                          <p className="font-bold text-gray-900 flex items-center gap-1 text-sm">
                            {aiResult.house_size === 'small' ? 'Küçük' : aiResult.house_size === 'large' ? 'Büyük' : 'Orta'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Tahmini Fiyat</span>
                          <p className="font-bold text-green-600">{aiResult.estimated_price} TL</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Hizmet Tipi</span>
                          <p className="font-bold text-purple-600 text-xs">
                            {aiResult.service_type === 'DIRECT_BOOKING' ? 'Hızlı Eşleşme' : 'Teklif Usulü'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-purple-100 flex justify-end">
                        <button
                          onClick={handlePostAIJob}
                          className="bg-white text-purple-600 border-2 border-purple-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all flex items-center gap-2"
                        >
                          <Briefcase size={16} /> Bu Bilgilerle İlan Oluştur
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <section className="relative z-20 w-full mb-20">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  <FormFlowIntro onToggleForm={handleScrollToForm} />
                  <PostJobIntro onPostJob={() => {
                    setAiInitialData(null); // Clear AI data if manually opening
                    setShowPostJobModal(true);
                  }} />
                </div>
              </section>

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
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="bg-blue-50 p-2 rounded-lg text-[#1E3A8A]">
                            <Briefcase size={20} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-bold">
                            {job.offers.length} Teklif
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-md font-bold ${
                            job.status === 'open' ? 'bg-green-100 text-green-700' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            job.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {job.status === 'open' ? 'Açık' :
                             job.status === 'in_progress' ? 'Devam Ediyor' :
                             job.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEditJobClick(job)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all"
                        >
                          İlanı Düzenle
                        </button>
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
          initialData={aiInitialData}
        />
        <DirectBookingModal
          isOpen={showDirectBookingModal}
          onClose={() => setShowDirectBookingModal(false)}
          onSuccess={() => setFormDataSubmitted(true)}
        />
        <EditJobModal
          isOpen={showEditJobModal}
          onClose={() => {
            setShowEditJobModal(false);
            setSelectedJobForEdit(null);
          }}
          onSuccess={fetchMyJobsAndOffers}
          job={selectedJobForEdit}
        />
      </main>

      <Footer />
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FormFlowIntro from '../../components/FormFlowIntro';
import PostJobIntro from '../../components/PostJobIntro';
import DirectBookingModal from '../../components/DirectBookingModal';
import EditJobModal from '../../components/EditJobModal';
import MatchingResultsModal from '../../components/MatchingResultsModal';
import PostJobModal from '../../components/PostJobModal';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
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
  photo_url?: string;
}

interface Offer {
  id: number;
  offered_price: number;
  message: string;
  estimated_time: string;
  status: 'pending' | 'accepted' | 'rejected';
  worker?: User;
  reviews?: any[];
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
  const [submittedData, setSubmittedData] = useState<{ location: string; houseSize: string; jobId: number } | null>(null);
  const [showDirectBookingModal, setShowDirectBookingModal] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Review System state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOfferForReview, setSelectedOfferForReview] = useState<Offer | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleOpenReviewModal = (offer: Offer) => {
    setSelectedOfferForReview(offer);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedOfferForReview) return;
    setIsSubmittingReview(true);
    try {
      await axiosInstance.post('/reviews/', {
        offer_id: selectedOfferForReview.id,
        worker_id: selectedOfferForReview.worker?.id,
        rating: reviewRating,
        comment: reviewComment || null
      });
      showToast('Değerlendirmeniz alındı!', 'success');
      setIsReviewModalOpen(false);
      setSelectedOfferForReview(null);
      setReviewRating(5);
      setReviewComment('');
      // Refresh list
      fetchMyJobsAndOffers();
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('Değerlendirme gönderilemedi. Lütfen tekrar deneyin.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isReviewed = (offer: Offer) => {
    return !!(offer.reviews && offer.reviews.length > 0);
  };

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
      showToast('Analiz yapılamadı. Lütfen tekrar deneyiniz.', 'error');
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
      showToast(
        status === 'accepted' ? 'Teklif kabul edildi!' : 'Teklif reddedildi!', 
        'success' 
      );
      // Refresh list
      fetchMyJobsAndOffers();
    } catch (err) {
      console.error(`Error updating offer status to ${status}:`, err);
      showToast('İşlem başarısız oldu. Lütfen tekrar deneyin.', 'error');
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
                                  {offer.worker?.photo_url ? (
                                    <img 
                                      src={offer.worker.photo_url} 
                                      alt="" 
                                      className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                      <UserIcon size={16} />
                                    </div>
                                  )}
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

                              {offer.status === 'accepted' && (
                                <div className="mt-4">
                                  <button
                                    onClick={() => handleOpenReviewModal(offer)}
                                    disabled={isReviewed(offer)}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                                      isReviewed(offer)
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                                  >
                                    <Sparkles size={16} /> {isReviewed(offer) ? 'Değerlendirildi' : 'Değerlendir'}
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
          onSuccess={(data) => setSubmittedData(data)}
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
        <MatchingResultsModal
          isOpen={submittedData !== null}
          onClose={() => setSubmittedData(null)}
          location={submittedData?.location || ''}
          houseSize={submittedData?.houseSize || ''}
          jobId={submittedData?.jobId || 0}
        />

        {/* Review Modal */}
        {isReviewModalOpen && selectedOfferForReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50">
            <div className="relative w-full max-w-md mx-auto my-6 px-4">
              <div className="relative flex flex-col w-full bg-white border-0 rounded-3xl shadow-xl outline-none focus:outline-none overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900">Uzmanı Değerlendir</h3>
                  <button
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      setSelectedOfferForReview(null);
                      setReviewRating(5);
                      setReviewComment('');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {/* Body */}
                <div className="relative p-6 flex-auto space-y-6">
                  <div className="flex items-center gap-3">
                    {selectedOfferForReview.worker?.photo_url ? (
                      <img 
                        src={selectedOfferForReview.worker.photo_url} 
                        alt="" 
                        className="w-12 h-12 rounded-full object-cover border border-gray-200" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <UserIcon size={24} />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900">{selectedOfferForReview.worker?.name || 'Uzman'}</h4>
                      <p className="text-xs text-gray-500">Bu uzmanla eşleşen teklifinizi puanlayın</p>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 block">Puanınız</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110"
                        >
                          <svg
                            className={`w-10 h-10 ${
                              star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 block">Yorumunuz (Opsiyonel)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Hizmet kalitesi, hız ve iletişim hakkında ne düşünüyorsunuz?"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:outline-none text-sm min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      setSelectedOfferForReview(null);
                      setReviewRating(5);
                      setReviewComment('');
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Gönderiliyor...
                      </>
                    ) : (
                      'Değerlendirmeyi Gönder'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Briefcase, FileText, User, MapPin, Home, DollarSign, Calendar, Loader2, Inbox, TrendingUp, Star, Check, X, Crown } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import OfferModal from '../../components/OfferModal';
import { useToast } from '../../context/ToastContext';
import LocationSelector from '../../components/LocationSelector';


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
  const [activeTab, setActiveTab] = useState<'open_jobs' | 'bids' | 'profile' | 'direct_requests' | 'stats' | 'subscription'>('open_jobs');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  interface DirectRequest {
    id: number;
    customer_id: number;
    worker_id: number;
    job_id: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    customer?: {
      id: number;
      name: string;
      email: string;
    };
    job?: {
      id: number;
      title: string;
      description: string;
      location?: string;
      house_size?: string;
      price?: number;
      created_at: string;
    };
  }
  
  const [directRequests, setDirectRequests] = useState<DirectRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  
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

  // Profile states
  const [profileData, setProfileData] = useState({
    location: '',
    hourly_rate: '',
    skills: [] as string[],
    about: '',
    photo_url: '',
    rating: 5.0
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  // Subscription states
  const [currentPlan, setCurrentPlan] = useState<{ plan: string | null; expires_at: string | null } | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const fetchMyPlan = async () => {
    setIsPlanLoading(true);
    try {
      const response = await axiosInstance.get('/subscriptions/my-plan');
      setCurrentPlan(response.data);
    } catch (err) {
      console.error('Error fetching current plan:', err);
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanToBuy) return;
    setIsSubscribing(true);
    try {
      await axiosInstance.post('/subscriptions/subscribe', { plan: selectedPlanToBuy });
      showToast('Aboneliğiniz başarıyla aktif edildi!', 'success');
      setShowPaymentModal(false);
      setSelectedPlanToBuy(null);
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      fetchMyPlan();
    } catch (err) {
      console.error('Error subscribing to plan:', err);
      showToast('Abonelik işlemi gerçekleştirilemedi. Lütfen tekrar deneyiniz.', 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'open_jobs') {
      fetchJobs();
    } else if (activeTab === 'bids') {
      fetchOffers();
    } else if (activeTab === 'profile') {
      fetchProfile();
    } else if (activeTab === 'direct_requests') {
      fetchDirectRequests();
    } else if (activeTab === 'stats') {
      fetchOffers();
      fetchProfile();
    } else if (activeTab === 'subscription') {
      fetchMyPlan();
    }
  }, [activeTab]);

  const fetchDirectRequests = async () => {
    setIsRequestsLoading(true);
    setRequestsError(null);
    try {
      const response = await axiosInstance.get('/direct-requests/worker/me');
      setDirectRequests(response.data);
    } catch (err) {
      console.error('Error fetching direct requests:', err);
      setRequestsError('Gelen talepler yüklenemedi');
    } finally {
      setIsRequestsLoading(false);
    }
  };

  const handleRequestStatusUpdate = async (id: number, status: 'accepted' | 'rejected') => {
    try {
      await axiosInstance.patch(`/direct-requests/${id}/status`, { status });
      showToast(
        status === 'accepted' 
          ? 'Talep kabul edildi!' 
          : 'Talep reddedildi.', 
        'success'
      );
      fetchDirectRequests();
    } catch (err) {
      console.error('Error updating direct request status:', err);
      showToast('İşlem gerçekleştirilirken bir hata oluştu.', 'error');
    }
  };

  const fetchProfile = async () => {
    setIsProfileLoading(true);
    try {
      const response = await axiosInstance.get('/users/me');
      const data = response.data;
      setProfileData({
        location: data.location || '',
        hourly_rate: data.hourly_rate?.toString() || '',
        skills: data.skills || [],
        about: data.bio || '',
        photo_url: data.photo_url || '',
        rating: data.rating || 5.0
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      showToast('Profil bilgileri alınamadı.', 'error');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);
    try {
      const payload = {
        location: profileData.location,
        hourly_rate: profileData.hourly_rate ? parseFloat(profileData.hourly_rate) : null,
        skills: profileData.skills,
        bio: profileData.about
      };
      await axiosInstance.patch('/users/me', payload);
      showToast('Profiliniz güncellendi!', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Profil güncellenirken bir hata oluştu.', 'error');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Dosya boyutu 5MB\'tan küçük olmalıdır.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => {
      setIsPhotoUploading(true);
    };
    reader.onload = async () => {
      const base64String = reader.result as string;
      try {
        const response = await axiosInstance.post('/users/me/photo', {
          photo: base64String
        });
        showToast('Profil fotoğrafınız güncellendi!', 'success');
        setProfileData(prev => ({
          ...prev,
          photo_url: response.data.photo_url || base64String
        }));
      } catch (err) {
        console.error('Error uploading photo:', err);
        showToast('Profil fotoğrafı yüklenirken bir hata oluştu.', 'error');
      } finally {
        setIsPhotoUploading(false);
      }
    };
    reader.onerror = () => {
      showToast('Dosya okunurken bir hata oluştu.', 'error');
      setIsPhotoUploading(false);
    };
    reader.readAsDataURL(file);
  };

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
              onClick={() => setActiveTab('direct_requests')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'direct_requests'
                  ? 'bg-blue-50 text-[#1E3A8A] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Inbox size={18} /> Gelen Talepler
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'stats'
                  ? 'bg-blue-50 text-[#1E3A8A] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TrendingUp size={18} /> İstatistikler
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'subscription'
                  ? 'bg-blue-50 text-[#1E3A8A] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Crown size={18} /> Abonelik
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

            {activeTab === 'direct_requests' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Gelen Talepler</h2>
                    <p className="text-gray-500 font-medium">
                      Müşterilerden doğrudan size gelen hızlı eşleşme taleplerini buradan yönetebilirsiniz.
                    </p>
                  </div>
                  <button 
                    onClick={fetchDirectRequests}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
                    title="Yenile"
                  >
                    <Loader2 size={24} className={isRequestsLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {isRequestsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 grayscale opacity-70">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-500 font-medium">Talepler yükleniyor...</p>
                  </div>
                ) : requestsError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-bold">
                    {requestsError}
                  </div>
                ) : directRequests.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-2xl p-16 flex flex-col items-center text-center justify-center text-gray-400">
                    <Inbox size={48} className="mb-4 opacity-20" />
                    <p className="text-xl font-bold">Henüz gelen bir talep yok.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {directRequests.map((req) => (
                      <div key={req.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{req.job?.title || 'Hızlı Eşleşme Talebi'}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                              req.status === 'accepted' 
                                ? 'bg-green-100 text-green-700' 
                                : req.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {req.status === 'accepted' ? 'Kabul Edildi' : req.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                            </span>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <span className="text-gray-400 font-bold">Müşteri:</span>
                              <span className="font-bold text-gray-800">{req.customer?.name || 'Müşteri'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <span className="text-gray-400 font-bold">Ev Büyüklüğü:</span>
                              <span className="font-bold text-gray-800">
                                {req.job?.house_size === 'small' ? 'Küçük' : req.job?.house_size === 'medium' ? 'Orta' : 'Büyük'}
                              </span>
                            </div>
                            
                            {req.job?.location && (
                              <div className="flex items-center gap-2 text-gray-650 text-sm">
                                <span className="text-gray-400 font-bold">Konum:</span>
                                <span className="font-medium text-gray-700">{req.job.location}</span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-gray-50">
                              <span className="text-xs text-gray-400 block mb-1">Açıklama:</span>
                              <p className="text-xs text-gray-650 line-clamp-3 italic">"{req.job?.description || 'Açıklama yok'}"</p>
                            </div>
                          </div>
                        </div>

                        {req.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                              onClick={() => handleRequestStatusUpdate(req.id, 'accepted')}
                              className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                            >
                              Kabul Et
                            </button>
                            <button
                              onClick={() => handleRequestStatusUpdate(req.id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                            >
                              Reddet
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">İstatistikler</h2>
                    <p className="text-gray-500 font-medium">
                      Hizmet performansınızı ve tekliflerinizi buradan takip edebilirsiniz.
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
                    <p className="text-gray-500 font-medium">İstatistikler yükleniyor...</p>
                  </div>
                ) : (
                  <div>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                      {/* Total Bids */}
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="p-4 bg-blue-500 rounded-2xl text-white">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-600 mb-1">Toplam Teklif Sayısı</p>
                          <p className="text-3xl font-extrabold text-blue-900">{offers.length}</p>
                        </div>
                      </div>

                      {/* Accepted Bids */}
                      <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="p-4 bg-green-500 rounded-2xl text-white">
                          <Check size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-600 mb-1">Kabul Edilen Teklif</p>
                          <p className="text-3xl font-extrabold text-green-900">
                            {offers.filter(o => o.status === 'accepted').length}
                          </p>
                        </div>
                      </div>

                      {/* Rejected Bids */}
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="p-4 bg-red-500 rounded-2xl text-white">
                          <X size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-600 mb-1">Reddedilen Teklif</p>
                          <p className="text-3xl font-extrabold text-red-900">
                            {offers.filter(o => o.status === 'rejected').length}
                          </p>
                        </div>
                      </div>

                      {/* Average Rating */}
                      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
                        <div className="p-4 bg-yellow-500 rounded-2xl text-white">
                          <Star size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-yellow-600 mb-1">Ortalama Puan</p>
                          <p className="text-3xl font-extrabold text-yellow-900">
                            {user?.rating ? user.rating.toFixed(1) : '5.0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Latest Offers */}
                    <div className="border-t border-gray-100 pt-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-5">Son Tekliflerim</h3>
                      {offers.length === 0 ? (
                        <p className="text-gray-500 text-sm">Henüz bir teklifiniz bulunmamaktadır.</p>
                      ) : (
                        <div className="space-y-4">
                          {[...offers]
                            .sort((a, b) => b.id - a.id)
                            .slice(0, 3)
                            .map((offer) => (
                              <div key={offer.id} className="border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div>
                                  <h4 className="font-bold text-gray-900 mb-1">{offer.job?.title || 'Temizlik İşi'}</h4>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><MapPin size={12} /> {offer.job?.location || 'Belirtilmedi'}</span>
                                    <span>Teklif: <span className="font-bold text-green-600">{offer.offered_price} TL</span></span>
                                    <span>Süre: {offer.estimated_time}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-center">
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                    offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                    offer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {offer.status === 'accepted' ? 'Kabul Edildi' : offer.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setActiveTab('bids');
                                    }}
                                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                                  >
                                    Detayları Gör
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil Bilgileri</h2>
                <p className="text-gray-500 mb-8 font-medium">
                  Hizmet profilinizi eksiksiz tutarak müşterilere güven verin ve daha fazla teklif alın.
                </p>

                {isProfileLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-70">
                    <Loader2 size={36} className="animate-spin text-[#1E3A8A] mb-3" />
                    <p className="text-gray-500 text-sm">Profil yükleniyor...</p>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Profil Fotoğrafı */}
                      <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border border-gray-100 rounded-3xl mb-2">
                        <div className="relative group">
                          {isPhotoUploading ? (
                            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 shadow-sm">
                              <Loader2 size={24} className="animate-spin text-[#1E3A8A]" />
                            </div>
                          ) : profileData.photo_url ? (
                            <img 
                              src={profileData.photo_url} 
                              alt="Profil Fotoğrafı" 
                              className="w-24 h-24 rounded-full object-cover border border-gray-200 group-hover:border-domestic-red transition-all shadow-sm"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200 group-hover:border-domestic-red transition-all shadow-sm text-3xl font-black uppercase">
                              {user?.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-center sm:items-start gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">Profil Fotoğrafı</h4>
                          <p className="text-gray-400 text-xs font-medium text-center sm:text-left">
                            JPG, PNG formatlarında profil resmi yükleyin.
                          </p>
                          <label className={`cursor-pointer bg-gray-55 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm ${isPhotoUploading ? 'pointer-events-none opacity-50' : ''}`}>
                            <span>Fotoğraf Değiştir</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handlePhotoChange} 
                              disabled={isPhotoUploading}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Konum Seçimi */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center gap-1">
                          <MapPin size={16} className="text-[#1E3A8A]" /> Konum (Şehir ve İlçe)
                        </label>
                        <LocationSelector
                          value={profileData.location}
                          onChange={(val) => setProfileData({ ...profileData, location: val })}
                          placeholder="Örn: İstanbul, Beşiktaş"
                        />
                      </div>

                      {/* Hourly Rate Input */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center gap-1">
                          <DollarSign size={16} className="text-[#1E3A8A]" /> Saatlik Ücret (TL)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Örn: 250"
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 focus:border-blue-300 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                          value={profileData.hourly_rate}
                          onChange={(e) => setProfileData({ ...profileData, hourly_rate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Skills Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 px-1">
                        Hizmet Becerileriniz (Seçiniz)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          "Genel Temizlik",
                          "Derin Temizlik",
                          "Cam Temizliği",
                          "Halı Yıkama",
                          "İnşaat Sonrası Temizlik",
                          "Ofis Temizliği"
                        ].map((skill) => {
                          const isSelected = profileData.skills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => {
                                const newSkills = isSelected
                                  ? profileData.skills.filter((s) => s !== skill)
                                  : [...profileData.skills, skill];
                                setProfileData({ ...profileData, skills: newSkills });
                              }}
                              className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* About Textarea */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                        Hakkımda
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Müşterilere kendinizden ve tecrübelerinizden bahsedin..."
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 focus:border-blue-300 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none text-sm"
                        value={profileData.about}
                        onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isProfileLoading}
                        className="w-full sm:w-auto px-8 py-3.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-blue-200 active:scale-95 transition-all text-sm disabled:opacity-50"
                      >
                        {isProfileLoading && <Loader2 size={16} className="animate-spin" />}
                        Profili Güncelle
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'subscription' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Abonelik Yönetimi</h2>
                    <p className="text-gray-500 font-medium">
                      Teklif verebilmek ve daha fazla ayrıcalıktan yararlanmak için aboneliğinizi yönetin.
                    </p>
                  </div>
                  <button 
                    onClick={fetchMyPlan}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
                    title="Yenile"
                  >
                    <Loader2 size={24} className={isPlanLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {isPlanLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 grayscale opacity-70">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-500 font-medium">Abonelik bilgileri yükleniyor...</p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Mevcut Plan */}
                    <div className="p-6 rounded-2xl border bg-gradient-to-r from-blue-900 to-[#1E3A8A] text-white shadow-md">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="text-xs uppercase tracking-wider font-bold text-yellow-400 block mb-1">Mevcut Durum</span>
                          {currentPlan && currentPlan.plan ? (
                            <div>
                              <h3 className="text-2xl font-extrabold flex items-center gap-2">
                                <Crown className="text-yellow-400 animate-pulse" size={24} />
                                {currentPlan.plan === 'basic' ? 'Temel Plan' : currentPlan.plan === 'professional' ? 'Profesyonel Plan' : 'Premium Plan'}
                              </h3>
                              <p className="text-blue-100 text-sm mt-1">
                                Son Geçerlilik Tarihi: <span className="font-bold text-white">{new Date(currentPlan.expires_at!).toLocaleDateString('tr-TR')}</span>
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h3 className="text-2xl font-extrabold flex items-center gap-2 text-red-200">
                                Aboneliğiniz Yok
                              </h3>
                              <p className="text-blue-200 text-sm mt-1">
                                İş ilanlarına teklif verebilmek için lütfen bir plana abone olun.
                              </p>
                            </div>
                          )}
                        </div>
                        {currentPlan && currentPlan.plan && (
                          <div className="bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
                            <span className="text-xs text-blue-200 font-bold block mb-1">Plan Özellikleri:</span>
                            <ul className="text-xs space-y-1">
                              {currentPlan.plan === 'basic' && (
                                <>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> 5 teklif/ay</li>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Profil sayfası</li>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Temel destek</li>
                                </>
                              )}
                              {currentPlan.plan === 'professional' && (
                                <>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Sınırsız teklif</li>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Öne çıkan profil</li>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Öncelikli destek</li>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> İstatistikler</li>
                                </>
                              )}
                              {currentPlan.plan === 'premium' && (
                                <>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Her şey dahil</li>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Öncelikli eşleşme</li>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> 7/24 destek</li>
                                  <li className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Gelişmiş istatistikler</li>
                                </>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plan Seçenekleri */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Abonelik Planları</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Temel Plan */}
                        <div className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative bg-white ${
                          currentPlan?.plan === 'basic' 
                            ? 'border-yellow-500 shadow-xl ring-2 ring-yellow-400' 
                            : 'border-gray-200 hover:shadow-lg'
                        }`}>
                          {currentPlan?.plan === 'basic' && (
                            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm flex items-center gap-1">
                              <Crown size={12} /> Aktif Planınız
                            </span>
                          )}
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Temel Plan</h4>
                            <div className="flex items-baseline mb-6">
                              <span className="text-3xl font-extrabold text-gray-900">99 TL</span>
                              <span className="text-gray-500 text-sm ml-1">/ay</span>
                            </div>
                            <ul className="space-y-3.5 mb-8">
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> 5 teklif/ay
                              </li>
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> Profil sayfası
                              </li>
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> Temel destek
                              </li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlanToBuy('basic');
                              setShowPaymentModal(true);
                            }}
                            disabled={currentPlan?.plan === 'basic'}
                            className={`w-full py-3 rounded-2xl font-bold transition-all shadow-sm ${
                              currentPlan?.plan === 'basic'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-900 hover:bg-blue-955 text-white hover:scale-102'
                            }`}
                          >
                            {currentPlan?.plan === 'basic' ? 'Mevcut Plan' : 'Seç'}
                          </button>
                        </div>

                        {/* Profesyonel Plan */}
                        <div className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative bg-white ${
                          currentPlan?.plan === 'professional' 
                            ? 'border-yellow-500 shadow-xl ring-2 ring-yellow-400' 
                            : 'border-blue-900 hover:shadow-lg shadow-md'
                        }`}>
                          <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs px-3.5 py-1 rounded-full font-bold shadow-sm flex items-center gap-1">
                            {currentPlan?.plan === 'professional' ? (
                              <>
                                <Crown size={12} /> Aktif Planınız
                              </>
                            ) : (
                              'Önerilen'
                            )}
                          </span>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Profesyonel</h4>
                            <div className="flex items-baseline mb-6">
                              <span className="text-3xl font-extrabold text-blue-900">199 TL</span>
                              <span className="text-gray-500 text-sm ml-1">/ay</span>
                            </div>
                            <ul className="space-y-3.5 mb-8">
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> Sınırsız teklif
                              </li>
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> Öne çıkan profil
                              </li>
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> Öncelikli destek
                              </li>
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> İstatistikler
                              </li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlanToBuy('professional');
                              setShowPaymentModal(true);
                            }}
                            disabled={currentPlan?.plan === 'professional'}
                            className={`w-full py-3 rounded-2xl font-bold transition-all shadow-sm ${
                              currentPlan?.plan === 'professional'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white hover:scale-102'
                            }`}
                          >
                            {currentPlan?.plan === 'professional' ? 'Mevcut Plan' : 'Seç'}
                          </button>
                        </div>

                        {/* Premium Plan */}
                        <div className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative bg-white ${
                          currentPlan?.plan === 'premium' 
                            ? 'border-yellow-500 shadow-xl ring-2 ring-yellow-400' 
                            : 'border-gray-200 hover:shadow-lg'
                        }`}>
                          {currentPlan?.plan === 'premium' && (
                            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm flex items-center gap-1">
                              <Crown size={12} /> Aktif Planınız
                            </span>
                          )}
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Premium</h4>
                            <div className="flex items-baseline mb-6">
                              <span className="text-3xl font-extrabold text-gray-900">399 TL</span>
                              <span className="text-gray-500 text-sm ml-1">/ay</span>
                            </div>
                            <ul className="space-y-3.5 mb-8">
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> Her şey dahil
                              </li>
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> Öncelikli eşleşme
                              </li>
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> 7/24 destek
                              </li>
                              <li className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                                <Check size={16} className="text-green-500" /> Gelişmiş istatistikler
                              </li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlanToBuy('premium');
                              setShowPaymentModal(true);
                            }}
                            disabled={currentPlan?.plan === 'premium'}
                            className={`w-full py-3 rounded-2xl font-bold transition-all shadow-sm ${
                              currentPlan?.plan === 'premium'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-900 hover:bg-blue-955 text-white hover:scale-102'
                            }`}
                          >
                            {currentPlan?.plan === 'premium' ? 'Mevcut Plan' : 'Seç'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* Ödeme Simülasyon Modali */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-gray-100 transform scale-100 transition-transform duration-300">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <Crown className="text-yellow-500" size={24} />
              Kredi Kartı ile Öde
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Aboneliğinizi başlatmak için ödeme simülasyonunu tamamlayın.
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kart Üzerindeki İsim</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ahmet Yılmaz" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-300 focus:bg-white rounded-xl outline-none font-medium text-sm transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kart Numarası</label>
                <input 
                  type="text" 
                  required
                  maxLength={19}
                  placeholder="1234 5678 1234 5678" 
                  value={cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                    setCardNumber(val);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-300 focus:bg-white rounded-xl outline-none font-medium text-sm transition-all font-mono"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Son Kullanma (AA/YY)</label>
                  <input 
                    type="text" 
                    required
                    maxLength={5}
                    placeholder="12/28" 
                    value={expiryDate}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      }
                      setExpiryDate(val);
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-300 focus:bg-white rounded-xl outline-none font-medium text-sm transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CVV</label>
                  <input 
                    type="text" 
                    required
                    maxLength={3}
                    placeholder="123" 
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-300 focus:bg-white rounded-xl outline-none font-medium text-sm transition-all font-mono"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isSubscribing}
                className="w-full py-4 mt-4 bg-gradient-to-r from-blue-900 to-[#1E3A8A] hover:from-blue-950 hover:to-blue-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all disabled:opacity-50 text-sm"
              >
                {isSubscribing && <Loader2 size={16} className="animate-spin" />}
                Ödemeyi Tamamla
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

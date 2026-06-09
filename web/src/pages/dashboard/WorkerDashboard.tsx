import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Briefcase, FileText, User, MapPin, Home, DollarSign, Calendar, Loader2, Inbox } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'open_jobs' | 'bids' | 'profile' | 'direct_requests'>('open_jobs');
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
    photo_url: ''
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  useEffect(() => {
    if (activeTab === 'open_jobs') {
      fetchJobs();
    } else if (activeTab === 'bids') {
      fetchOffers();
    } else if (activeTab === 'profile') {
      fetchProfile();
    } else if (activeTab === 'direct_requests') {
      fetchDirectRequests();
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
        photo_url: data.photo_url || ''
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

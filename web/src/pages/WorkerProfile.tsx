import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { axiosInstance } from '../api/axiosInstance';
import { 
  Star, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  MessageSquare,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface WorkerData {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string | null;
  photo_url?: string | null;
  bio: string | null;
  hourly_rate: number | null;
  rating: number | null;
  skills: string[] | null;
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: number;
  reviewer?: {
    name: string;
  };
}

export default function WorkerProfile() {
  const { workerId } = useParams<{ workerId: string }>();
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ completed_jobs_count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkerData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch worker profile details (Public endpoint)
        const userRes = await axiosInstance.get(`/users/${workerId}`);
        setWorker(userRes.data);

        // Fetch worker stats (Public endpoint)
        const statsRes = await axiosInstance.get(`/users/${workerId}/stats`);
        setStats(statsRes.data);

        // Fetch worker reviews (Public endpoint)
        const reviewsRes = await axiosInstance.get(`/reviews/worker/${workerId}`);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error('Error fetching worker profile:', err);
        setError('Profil bilgileri yüklenirken bir hata oluştu veya bu kullanıcı bulunamadı.');
      } finally {
        setLoading(false);
      }
    };

    if (workerId) {
      fetchWorkerData();
    }
  }, [workerId]);

  const renderStars = (rating: number | null) => {
    const stars = [];
    const val = rating || 5.0;
    const fullStars = Math.floor(val);
    const hasHalf = val % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={18} className="fill-yellow-500 text-yellow-500" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<Star key={i} size={18} className="fill-yellow-500 text-yellow-500 opacity-50" />);
      } else {
        stars.push(<Star key={i} size={18} className="text-gray-300" />);
      }
    }
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-base font-bold text-yellow-600 ml-2">{val.toFixed(1)}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-domestic-beige pt-20">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center justify-center opacity-70">
            <Loader2 size={48} className="animate-spin text-domestic-red mb-4" />
            <p className="text-gray-650 font-bold text-lg">Profil yükleniyor...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="flex flex-col min-h-screen bg-domestic-beige pt-20">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-lg text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-950 mb-2">Hata Oluştu</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">{error || 'Kullanıcı bulunamadı.'}</p>
            <Link 
              to="/" 
              className="inline-block w-full py-3 bg-[#1E3A8A] text-white rounded-2xl font-bold hover:bg-blue-900 transition-colors shadow-md"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-domestic-beige pt-20">
      <Navbar />
      
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upper Section - Worker Card */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          {/* Subtle Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-domestic-red/5 rounded-full -mr-20 -mt-20 blur-2xl z-0" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Picture */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              {worker.photo_url ? (
                <img 
                  src={worker.photo_url} 
                  alt={worker.name} 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gray-50 shadow-md" 
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-black text-5xl uppercase border-4 border-gray-50 shadow-md">
                  {worker.name.charAt(0)}
                </div>
              )}
            </div>

            {/* General Info */}
            <div className="flex-grow w-full space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-950 text-center md:text-left">{worker.name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-gray-500 text-sm font-medium">
                    {worker.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-domestic-red" />
                        {worker.location}
                      </span>
                    )}
                    <span className="bg-domestic-red/10 text-domestic-red px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                      Temizlik Uzmanı
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-50/50 border border-yellow-100 px-5 py-3 rounded-2xl flex flex-col items-center md:items-start self-center md:self-auto shadow-sm">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">ORTALAMA PUAN</span>
                  <div className="mt-1">
                    {renderStars(worker.rating)}
                  </div>
                </div>
              </div>

              {/* Bio / Hakkımda */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Hakkımda</h3>
                <p className="text-gray-750 text-base font-medium leading-relaxed italic bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  {worker.bio ? `"${worker.bio}"` : 'Bu uzman henüz hakkında kısmını doldurmadı.'}
                </p>
              </div>

              {/* Skills / Beceriler */}
              {worker.skills && worker.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Uzmanlık Alanları</h3>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="bg-blue-50 text-[#1E3A8A] border border-blue-100 text-xs px-3.5 py-1.5 rounded-xl font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Stats Block */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="bg-green-50/40 border border-green-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-gray-450 uppercase tracking-wider block">SAATLİK ÜCRET</span>
                    <span className="text-lg font-black text-green-600 leading-none">
                      {worker.hourly_rate ? `${worker.hourly_rate} TL` : 'Belirtilmedi'}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50/30 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-[#1E3A8A]">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-gray-450 uppercase tracking-wider block">TAMAMLANAN İŞ</span>
                    <span className="text-lg font-black text-[#1E3A8A] leading-none">
                      {stats ? `${stats.completed_jobs_count} İş` : '0 İş'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Lower Section - Reviews */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <MessageSquare size={20} />
            </div>
            <h2 className="text-2xl font-black text-gray-950">Müşteri Değerlendirmeleri ({reviews.length})</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400">
              <MessageSquare size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-gray-650">Henüz yorum yok</p>
              <p className="text-sm mt-1">Bu temizlik uzmanı için henüz bir değerlendirme yapılmamış.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs uppercase">
                        {review.reviewer?.name.charAt(0) || 'M'}
                      </div>
                      <span className="font-bold text-gray-900">{review.reviewer?.name || 'Müşteri'}</span>
                    </div>

                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(review.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={14} 
                        className={star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"} 
                      />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 text-sm font-medium leading-relaxed pl-1">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

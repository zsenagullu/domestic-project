import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, Loader2, ArrowLeft, X } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';

interface Worker {
  id: number;
  name: string;
  location: string | null;
  hourly_rate: number | null;
  rating: number | null;
  skills: string[] | null;
  photo_url?: string | null;
  bio?: string | null;
}

interface MatchingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  houseSize: string;
  jobId: number;
}

export default function MatchingResultsModal({ isOpen, onClose, location, houseSize, jobId }: MatchingResultsModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen || !location) return;

    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/users/match', {
          params: {
            location: location,
            house_size: houseSize,
            service_type: 'DIRECT_BOOKING'
          }
        });
        setWorkers(response.data);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Eşleşen uzmanlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isOpen, location, houseSize]);

  if (!isOpen) return null;

  const renderStars = (rating: number | null) => {
    const stars = [];
    const val = rating || 5.0;
    const fullStars = Math.floor(val);
    const hasHalf = val % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={16} className="fill-yellow-500 text-yellow-500" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<Star key={i} size={16} className="fill-yellow-500 text-yellow-500 opacity-50" />);
      } else {
        stars.push(<Star key={i} size={16} className="text-gray-300" />);
      }
    }
    return (
      <div className="flex items-center gap-0.5">
        {stars}
        <span className="text-sm font-semibold text-yellow-600 ml-1.5">{val.toFixed(1)}</span>
      </div>
    );
  };

  const handleSelectWorker = async (worker: Worker) => {
    try {
      await axiosInstance.post('/direct-requests/', {
        worker_id: worker.id,
        job_id: jobId
      });
      showToast(`${worker.name}'ya talep gönderildi!`, 'success');
      onClose();
    } catch (err) {
      console.error('Error sending direct request:', err);
      showToast('Talep gönderilemedi, lütfen tekrar deneyin.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-gray-55 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-gray-100">
        
        {/* Sticky Header with Back Button */}
        <div className="p-6 md:p-8 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-30">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 group text-sm"
          >
            <ArrowLeft size={16} className="text-gray-500 group-hover:-translate-x-1 transition-transform" />
            Geri Dön
          </button>
          
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-gray-50 rounded-full transition-all hover:scale-105 active:scale-95 text-gray-550 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-8 md:p-10 overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <Loader2 size={48} className="animate-spin text-domestic-red mb-4" />
              <p className="text-gray-500 font-bold text-lg">Kriterlerinize en uygun uzmanlar bulunuyor...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-bold">
              {error}
            </div>
          ) : workers.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-[2rem] p-16 flex flex-col items-center text-center justify-center text-gray-400">
              <Bookmark size={48} className="mb-4 opacity-20 text-[#1E3A8A]" />
              <p className="text-xl font-bold text-gray-700">Kriterlere uygun uzman bulunamadı</p>
              <p className="text-gray-500 mt-2 font-medium">Lütfen konum veya diğer tercihlerinizi değiştirerek tekrar deneyiniz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {workers.map(worker => (
                <div key={worker.id} className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-3.5">
                        {worker.photo_url ? (
                          <img 
                            src={worker.photo_url} 
                            alt={worker.name} 
                            className="w-14 h-14 rounded-full object-cover border border-gray-200 group-hover:border-domestic-red transition-all shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-55 flex items-center justify-center text-gray-500 font-black text-xl uppercase border border-gray-200 group-hover:border-domestic-red transition-all">
                            {worker.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-domestic-red transition-colors">
                            {worker.name}
                          </h3>
                          <div className="mt-1">
                            {renderStars(worker.rating)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">KONUM</p>
                        <p className="text-sm text-gray-800 font-medium">{worker.location || 'Belirtilmedi'}</p>
                      </div>
                      
                      {worker.skills && worker.skills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">BECERİLER</p>
                          <div className="flex flex-wrap gap-1">
                            {worker.skills.map((skill, idx) => (
                              <span 
                                key={idx} 
                                className="bg-blue-50 text-[#1E3A8A] border border-blue-100 text-[10px] px-2.5 py-0.5 rounded-lg font-bold"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {worker.bio && (
                        <div className="mt-3">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">HAKKIMDA</p>
                          <p className="text-xs text-gray-600 italic line-clamp-2">"{worker.bio}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold text-gray-400 mb-0.5 tracking-wider">SAATLİK ÜCRET</p>
                      <p className="text-base font-extrabold text-green-600 leading-none">
                        {worker.hourly_rate ? `${worker.hourly_rate} TL/saat` : 'Belirtilmedi'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/worker/${worker.id}`}
                        target="_blank"
                        className="text-gray-500 hover:text-domestic-red px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all font-bold text-xs flex items-center"
                      >
                        Profili Gör
                      </Link>
                      <button 
                        onClick={() => handleSelectWorker(worker)}
                        className="bg-domestic-red text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-md hover:shadow-red-200 active:scale-95 text-xs"
                      >
                        Seç
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Star, Bookmark, Loader2 } from 'lucide-react';
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
}

interface ResultsProps {
  location: string;
  houseSize: string;
}

export default function Results({ location, houseSize }: ResultsProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
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

    if (location) {
      fetchMatches();
    }
  }, [location, houseSize]);

  // Star display helper function
  const renderStars = (rating: number | null) => {
    const stars = [];
    const val = rating || 5.0; // default to 5.0 if rating is null
    const fullStars = Math.floor(val);
    const hasHalf = val % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={16} className="fill-yellow-500 text-yellow-500" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<Star key={i} size={16} className="text-yellow-500" />);
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

  const handleSelectWorker = (workerName: string) => {
    showToast(`${workerName} seçildi! Teklif bekleme süreci başlatıldı.`, 'success');
  };

  return (
    <section className="py-24 bg-domestic-beige animate-in slide-in-from-bottom-12 fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
             <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Kriterinize Uygun Personeller</h2>
             <p className="text-lg text-gray-500">Formunuzdaki bilgilere göre bölgenizdeki en iyi uzmanları sıraladık.</p>
          </div>
        </div>

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
              <div key={worker.id} className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all group">
                 <div className="flex justify-between items-start mb-6">
                   <div className="flex gap-4">
                      {worker.photo_url ? (
                        <img 
                          src={worker.photo_url} 
                          alt={worker.name} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-transparent group-hover:border-domestic-red transition-all shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-domestic-gray overflow-hidden border-2 border-transparent group-hover:border-domestic-red transition-all flex items-center justify-center text-gray-400 font-black text-2xl uppercase">
                          {worker.name.charAt(0)}
                        </div>
                      )}
                     <div>
                       <h3 className="text-xl font-bold text-gray-900 leading-tight">{worker.name}</h3>
                       <div className="mt-1">
                         {renderStars(worker.rating)}
                       </div>
                     </div>
                   </div>
                   <button className="text-gray-300 hover:text-domestic-red transition-colors">
                     <Bookmark size={24} />
                   </button>
                 </div>

                 <div className="space-y-2 mb-6">
                   <p className="text-sm text-gray-500 font-bold">Konum: <span className="text-gray-800 font-medium">{worker.location || 'Belirtilmedi'}</span></p>
                   {worker.skills && worker.skills.length > 0 && (
                     <div className="flex flex-wrap gap-1.5 pt-1">
                       {worker.skills.map((skill, idx) => (
                         <span key={idx} className="bg-blue-50 text-[#1E3A8A] border border-blue-100 text-[10px] px-2.5 py-1 rounded-lg font-bold">
                           {skill}
                         </span>
                       ))}
                     </div>
                   )}
                 </div>

                 <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                   <div>
                     <p className="text-xs font-bold text-gray-400 mb-1">SAATLİK ÜCRET</p>
                     <p className="text-lg font-extrabold text-green-600 leading-none">
                       {worker.hourly_rate ? `${worker.hourly_rate} TL/saat` : 'Belirtilmedi'}
                     </p>
                   </div>
                   <button 
                     onClick={() => handleSelectWorker(worker.name)}
                     className="bg-domestic-red text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-md hover:shadow-red-200 active:scale-95"
                   >
                      Seç
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

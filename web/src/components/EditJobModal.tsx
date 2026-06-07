import { useState, useEffect } from 'react';
import { X, Briefcase, MapPin, Home, DollarSign, Loader2 } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import Toast from './Toast';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  job: {
    id: number;
    title: string;
    description: string;
    location?: string;
    house_size?: string;
    price?: number;
    status: string;
  } | null;
}

export default function EditJobModal({ isOpen, onClose, onSuccess, job }: EditJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    house_size: 'medium',
    price: '',
    status: 'open'
  });

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        location: job.location || '',
        house_size: job.house_size || 'medium',
        price: job.price?.toString() || '',
        status: job.status || 'open'
      });
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      // 1. Update general fields via PATCH /api/v1/jobs/{job_id}
      await axiosInstance.patch(`/jobs/${job.id}`, {
        title: formData.title,
        description: formData.description,
        location: formData.location || null,
        house_size: formData.house_size,
        price: formData.price ? parseFloat(formData.price) : null
      });

      // 2. Update status via PATCH /api/v1/jobs/{job_id}/status
      await axiosInstance.patch(`/jobs/${job.id}/status`, {
        status: formData.status
      });

      setToast({ message: 'İlan başarıyla güncellendi!', type: 'success' });
      setTimeout(() => {
        onClose();
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error('Job update error:', error);
      setToast({ message: 'Güncelleme esnasında bir hata oluştu.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-domestic-red/10 rounded-2xl flex items-center justify-center text-domestic-red">
                <Briefcase size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">İlanı Düzenle</h2>
                <p className="text-gray-500 text-sm font-medium">İlan detaylarını ve durumunu güncelleyin</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">İlan Başlığı</label>
                <input
                  required
                  type="text"
                  placeholder="İlan Başlığı"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Açıklama</label>
                <textarea
                  required
                  rows={3}
                  placeholder="İlan Açıklaması"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1 flex items-center gap-1">
                    <MapPin size={14} /> Konum
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="İstanbul, Beşiktaş"
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1 flex items-center gap-1">
                    <Home size={14} /> Ev Büyüklüğü
                  </label>
                  <select
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                    value={formData.house_size}
                    onChange={(e) => setFormData({...formData, house_size: e.target.value})}
                  >
                    <option value="small">Küçük (1+0, 1+1)</option>
                    <option value="medium">Orta (2+1, 3+1)</option>
                    <option value="large">Büyük (4+1+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1 flex items-center gap-1">
                    <DollarSign size={14} /> Tahmini Bütçe (TL - Opsiyonel)
                  </label>
                  <input
                    type="number"
                    placeholder="Örn: 1500"
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">İlan Durumu</label>
                  <select
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="open">Açık (open)</option>
                    <option value="in_progress">Devam Ediyor (in_progress)</option>
                    <option value="completed">Tamamlandı (completed)</option>
                    <option value="cancelled">İptal Edildi (cancelled)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-domestic-red text-white py-4 rounded-[1.5rem] font-black text-lg hover:bg-domestic-dark-red transition-all shadow-lg hover:shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Güncelle'}
            </button>
          </form>
        </div>
      </div>
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

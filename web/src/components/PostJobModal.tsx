import { useState } from 'react';
import { X, Briefcase, MapPin, Home, DollarSign, Loader2 } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostJobModal({ isOpen, onClose }: PostJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    house_size: 'medium',
    price: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post('/jobs/', {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        service_type: "MARKETPLACE_BIDDING"
      });
      
      alert('İlanınız oluşturuldu!');
      onClose();
      // Optionally refresh list or redirect
    } catch (error) {
      console.error('Job creation error:', error);
      alert('İlan oluşturulurken bir hata oluştu.');
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
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-domestic-red/10 rounded-2xl flex items-center justify-center text-domestic-red">
                <Briefcase size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">İlan Oluştur</h2>
                <p className="text-gray-500 text-sm font-medium">Uzmanların tekliflerini bekle</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">İlan Başlığı</label>
                <input
                  required
                  type="text"
                  placeholder="Örn: 3+1 Ev Temizliği"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Açıklama</label>
                <textarea
                  required
                  rows={3}
                  placeholder="İhtiyaçlarını detaylıca buraya yazabilirsin..."
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center gap-1">
                    <MapPin size={14} /> Konum
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="İstanbul, Beşiktaş"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center gap-1">
                    <Home size={14} /> Ev Büyüklüğü
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                    value={formData.house_size}
                    onChange={(e) => setFormData({...formData, house_size: e.target.value})}
                  >
                    <option value="small">Küçük (1+0, 1+1)</option>
                    <option value="medium">Orta (2+1, 3+1)</option>
                    <option value="large">Büyük (4+1+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center gap-1">
                  <DollarSign size={14} /> Tahmini Bütçe (TL - Opsiyonel)
                </label>
                <input
                  type="number"
                  placeholder="Örn: 1500"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium shadow-sm"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-domestic-red text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-domestic-dark-red transition-all shadow-lg hover:shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'İlanı Yayınla'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

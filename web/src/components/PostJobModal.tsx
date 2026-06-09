import { useState, useEffect } from 'react';
import { X, Briefcase, MapPin, Home, DollarSign, Loader2 } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import LocationSelector from './LocationSelector';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    title?: string;
    description?: string;
    location?: string;
    house_size?: string;
    price?: string | number;
    cleaning_type?: string;
    preferred_date?: string;
    has_pets?: boolean;
    has_allergies?: boolean;
    special_notes?: string;
  };
}

export default function PostJobModal({ isOpen, onClose, initialData }: PostJobModalProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    house_size: initialData?.house_size || 'medium',
    price: initialData?.price?.toString() || '',
    cleaning_type: initialData?.cleaning_type || 'Genel Temizlik',
    preferred_date: initialData?.preferred_date || '',
    has_pets: initialData?.has_pets || false,
    has_allergies: initialData?.has_allergies || false,
    special_notes: initialData?.special_notes || ''
  });
  const [location, setLocation] = useState('');

  // Update form if initialData changes (e.g. from AI)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        house_size: initialData.house_size || 'medium',
        price: initialData.price?.toString() || '',
        cleaning_type: initialData.cleaning_type || 'Genel Temizlik',
        preferred_date: initialData.preferred_date || '',
        has_pets: initialData.has_pets || false,
        has_allergies: initialData.has_allergies || false,
        special_notes: initialData.special_notes || ''
      });
      setLocation(initialData.location || '');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const combinedLocation = location;

    try {
      await axiosInstance.post('/jobs/', {
        ...formData,
        location: combinedLocation,
        price: formData.price ? parseFloat(formData.price) : null,
        service_type: "MARKETPLACE_BIDDING"
      });
      
      showToast('İlanınız oluşturuldu!', 'success');
      onClose();
      // Optionally refresh list or redirect
    } catch (error) {
      console.error('Job creation error:', error);
      showToast('İlan oluşturulurken bir hata oluştu.', 'error');
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

          <form onSubmit={handleSubmit} className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">İlan Başlığı</label>
                <input
                  required
                  type="text"
                  placeholder="Örn: 3+1 Ev Temizliği"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Açıklama</label>
                <textarea
                  required
                  rows={2.5}
                  placeholder="İhtiyaçlarını detaylıca buraya yazabilirsin..."
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1 flex items-center gap-1">
                  <MapPin size={14} /> Konum (Şehir ve İlçe)
                </label>
                <LocationSelector
                  value={location}
                  onChange={setLocation}
                  placeholder="İstanbul, Beşiktaş"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Temizlik Tipi</label>
                  <select
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                    value={formData.cleaning_type}
                    onChange={(e) => setFormData({...formData, cleaning_type: e.target.value})}
                  >
                    <option value="Genel Temizlik">Genel Temizlik</option>
                    <option value="Derin Temizlik">Derin Temizlik</option>
                    <option value="Cam Temizliği">Cam Temizliği</option>
                    <option value="Halı Yıkama">Halı Yıkama</option>
                    <option value="İnşaat Sonrası Temizlik">İnşaat Sonrası Temizlik</option>
                    <option value="Ofis Temizliği">Ofis Temizliği</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Tercih Edilen Tarih</label>
                  <input
                    type="date"
                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Evcil Hayvan</label>
                  <div className="flex bg-gray-50 p-1 rounded-2xl border-2 border-transparent">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, has_pets: false})}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${!formData.has_pets ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Yok
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, has_pets: true})}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${formData.has_pets ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Var
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Alerjim Var</label>
                  <div className="flex bg-gray-50 p-1 rounded-2xl border-2 border-transparent">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, has_allergies: false})}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${!formData.has_allergies ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Hayır
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, has_allergies: true})}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${formData.has_allergies ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Evet
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1 flex items-center gap-1">
                  <DollarSign size={14} /> Tahmini Bütçe (TL - Opsiyonel)
                </label>
                <input
                  type="number"
                  placeholder="Örn: 1500"
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm shadow-sm"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">Özel Notlar (Opsiyonel)</label>
                <textarea
                  rows={2}
                  placeholder="Çalışana iletmek istediğin ekstra bir detay varsa yazabilirsin..."
                  className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-domestic-red/20 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none text-sm"
                  value={formData.special_notes}
                  onChange={(e) => setFormData({...formData, special_notes: e.target.value})}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-domestic-red text-white py-4 rounded-[1.5rem] font-black text-lg hover:bg-domestic-dark-red transition-all shadow-lg hover:shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'İlanı Yayınla'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

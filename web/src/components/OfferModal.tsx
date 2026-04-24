import { useState } from 'react';
import { X, DollarSign, MessageSquare, Clock, Loader2 } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number | null;
  jobTitle: string;
}

export default function OfferModal({ isOpen, onClose, jobId, jobTitle }: OfferModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    offered_price: '',
    message: '',
    estimated_time: ''
  });

  if (!isOpen || !jobId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.offered_price || !formData.message || !formData.estimated_time) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post('/offers/', {
        job_id: jobId,
        offered_price: parseFloat(formData.offered_price),
        message: formData.message,
        estimated_time: formData.estimated_time
      });
      
      alert('Teklifiniz başarıyla gönderildi!');
      onClose();
      // Reset form
      setFormData({
        offered_price: '',
        message: '',
        estimated_time: ''
      });
    } catch (error) {
      console.error('Offer submission error:', error);
      alert('Teklif gönderilemedi, tekrar deneyin.');
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
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-[#1E3A8A]">
                <DollarSign size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Teklif Ver</h2>
                <p className="text-gray-500 text-sm font-medium">{jobTitle}</p>
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
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center gap-1">
                  <DollarSign size={14} /> Teklif Fiyatı (TL)
                </label>
                <input
                  required
                  type="number"
                  placeholder="Örn: 1200"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  value={formData.offered_price}
                  onChange={(e) => setFormData({...formData, offered_price: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center gap-1">
                  <Clock size={14} /> Tahmini Süre
                </label>
                <input
                  required
                  type="text"
                  placeholder="Örn: 3 saat"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({...formData, estimated_time: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center gap-1">
                  <MessageSquare size={14} /> Mesajınız
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Müşteriye neden seni seçmesi gerektiğini açıkla..."
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-200 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#1E3A8A] text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-blue-800 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Teklif Gönder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

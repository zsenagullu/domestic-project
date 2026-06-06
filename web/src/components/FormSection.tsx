import { useState } from 'react';
import { Mic, CheckCircle2, MapPin, Home, Loader2, Calendar, Clipboard, ShieldAlert } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import Toast from './Toast';

export default function FormSection({ setFormDataSubmitted }: { setFormDataSubmitted: (val: boolean) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    saat: 'Haftada 1',
    boyut: '2+1',
    evcilHayvan: false,
    konum: '',
    temizlikTipi: 'Genel Temizlik',
    tarih: '',
    alerji: false,
    ozelNotlar: ''
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    const houseSizeMap: { [key: string]: string } = {
      '1+0 (Stüdyo)': 'small',
      '1+1': 'small',
      '2+1': 'medium',
      '3+1': 'medium',
      '4+1 ve üzeri': 'large'
    };
    const houseSizeVal = houseSizeMap[formData.boyut] || 'medium';

    const petsText = formData.evcilHayvan ? 'Var' : 'Yok';
    const allergyText = formData.alerji ? 'Evet' : 'Hayır';
    
    // Combining information to create description:
    // "[Açıklama] | Temizlik: [tip] | Tarih: [tarih] | Evcil Hayvan: [var/yok] | Alerji: [evet/hayır] | Not: [notlar]"
    const combinedDescription = `Ev Büyüklüğü: ${formData.boyut}, Hizmet Sıklığı: ${formData.saat} | Temizlik: ${formData.temizlikTipi} | Tarih: ${formData.tarih} | Evcil Hayvan: ${petsText} | Alerji: ${allergyText} | Not: ${formData.ozelNotlar || ''}`;

    try {
      await axiosInstance.post('/jobs/', {
        title: `Hızlı Eşleşme Talebi (${formData.konum})`,
        description: combinedDescription,
        location: formData.konum,
        house_size: houseSizeVal,
        price: null,
        service_type: 'DIRECT_BOOKING',
        cleaning_type: formData.temizlikTipi,
        preferred_date: formData.tarih || null,
        has_pets: formData.evcilHayvan,
        has_allergies: formData.alerji,
        special_notes: formData.ozelNotlar
      });

      setToast({ message: 'Talebiniz başarıyla oluşturuldu!', type: 'success' });
      setTimeout(() => {
        setFormDataSubmitted(true);
      }, 1500);
    } catch (error: any) {
      console.error('Submit error:', error);
      const isAuthError = error.response?.status === 401;
      setToast({
        message: isAuthError 
          ? 'Lütfen önce giriş yapın.' 
          : 'İstek gönderilirken bir hata oluştu.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setFormData({
        saat: 'Ayda 1',
        boyut: '3+1',
        evcilHayvan: true,
        konum: 'Kadıköy, İstanbul',
        temizlikTipi: 'Derin Temizlik',
        tarih: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
        alerji: true,
        ozelNotlar: 'Sesli komutla otomatik dolduruldu.'
      });
    }, 2500);
  };

  return (
    <section id="service-details" className="py-24 bg-white relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Hizmet Detayları</h2>
          <p className="text-lg text-gray-500 mb-8">Nasıl bir profesyonel arıyorsunuz? Seçimlerinizi yapın ya da sesinizle bize tarif edin!</p>
        </div>

        <div className="mt-6">
          <div className="bg-white rounded-[2rem] shadow-soft border border-gray-100 p-8 md:p-12">
            
            <div className="flex justify-center mb-10">
               <button 
                 type="button"
                 onClick={handleVoiceRecording}
                 className={`group rounded-full py-4 px-8 font-bold text-lg flex items-center justify-center gap-3 w-full sm:w-auto transition-all ${
                   isRecording 
                     ? 'bg-red-50 text-domestic-red animate-pulse ring-4 ring-red-100 shadow-xl border border-red-200'
                     : 'bg-domestic-gray text-gray-700 hover:bg-red-50 hover:text-domestic-red'
                 }`}
               >
                 <Mic size={24} className={isRecording ? 'animate-bounce' : 'text-domestic-red'} />
                 {isRecording ? 'Dinleniyor... (Alanlar doldurulacak)' : 'Sesli Doldur'}
               </button>
            </div>

            <div className="relative flex py-5 items-center justify-center">
              <div className="flex-grow border-t border-gray-200 max-w-[200px]"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 font-medium text-sm">VEYA MANUEL DOLDUR</span>
              <div className="flex-grow border-t border-gray-200 max-w-[200px]"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Home size={18} className="text-domestic-red"/> Ev Büyüklüğü</label>
                  <select 
                    className="w-full bg-domestic-gray border border-transparent rounded-2xl px-5 py-4 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-domestic-red focus:bg-white transition-all appearance-none"
                    value={formData.boyut}
                    onChange={e => setFormData({...formData, boyut: e.target.value})}
                  >
                    <option>1+0 (Stüdyo)</option>
                    <option>1+1</option>
                    <option>2+1</option>
                    <option>3+1</option>
                    <option>4+1 ve üzeri</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><CheckCircle2 size={18} className="text-domestic-red"/> Hizmet Sıklığı</label>
                  <select 
                    className="w-full bg-domestic-gray border border-transparent rounded-2xl px-5 py-4 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-domestic-red focus:bg-white transition-all appearance-none"
                    value={formData.saat}
                    onChange={e => setFormData({...formData, saat: e.target.value})}
                  >
                    <option>Tek Seferlik</option>
                    <option>Haftada 1</option>
                    <option>İki Haftada 1</option>
                    <option>Ayda 1</option>
                  </select>
                </div>

              </div>

              <div className="grid md:grid-cols-2 gap-8">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clipboard size={18} className="text-domestic-red"/> Temizlik Tipi
                  </label>
                  <select 
                    className="w-full bg-domestic-gray border border-transparent rounded-2xl px-5 py-4 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-domestic-red focus:bg-white transition-all appearance-none"
                    value={formData.temizlikTipi}
                    onChange={e => setFormData({...formData, temizlikTipi: e.target.value})}
                  >
                    <option>Genel Temizlik</option>
                    <option>Derin Temizlik</option>
                    <option>Cam Temizliği</option>
                    <option>Halı Yıkama</option>
                    <option>İnşaat Sonrası Temizlik</option>
                    <option>Ofis Temizliği</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={18} className="text-domestic-red"/> Tercih Edilen Tarih
                  </label>
                  <input 
                    type="date"
                    className="w-full bg-domestic-gray border border-transparent rounded-2xl px-5 py-4 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-domestic-red focus:bg-white transition-all"
                    value={formData.tarih}
                    onChange={e => setFormData({...formData, tarih: e.target.value})}
                  />
                </div>

              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                
                <div className="space-y-2 relative">
                   <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><MapPin size={18} className="text-domestic-red"/> Konum</label>
                   <input 
                     required
                     type="text" 
                     placeholder="İl, İlçe veya mahalle adı" 
                     className="w-full bg-domestic-gray border border-transparent rounded-2xl px-5 py-4 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-domestic-red focus:bg-white transition-all"
                     value={formData.konum}
                     onChange={e => setFormData({...formData, konum: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 md:mt-0">
                  <div className="bg-domestic-gray p-4 rounded-2xl flex items-center justify-between border border-transparent h-[56px]">
                     <div className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1">
                       <span className="text-domestic-red">🐱</span> Evcil Hayvan
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={formData.evcilHayvan} onChange={() => setFormData({...formData, evcilHayvan: !formData.evcilHayvan})} />
                       <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-domestic-red"></div>
                     </label>
                  </div>

                  <div className="bg-domestic-gray p-4 rounded-2xl flex items-center justify-between border border-transparent h-[56px]">
                     <div className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1">
                       <ShieldAlert size={14} className="text-domestic-red"/> Alerjim Var
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={formData.alerji} onChange={() => setFormData({...formData, alerji: !formData.alerji})} />
                       <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-domestic-red"></div>
                     </label>
                  </div>
                </div>

              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">Özel Notlar (Opsiyonel)</label>
                <textarea 
                  rows={3}
                  placeholder="Ekiplerimize iletmek istediğiniz ek notlar..."
                  className="w-full bg-domestic-gray border border-transparent rounded-2xl px-5 py-4 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-domestic-red focus:bg-white transition-all resize-none text-sm"
                  value={formData.ozelNotlar}
                  onChange={e => setFormData({...formData, ozelNotlar: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gray-900 text-white font-extrabold text-xl py-5 rounded-2xl shadow-lg hover:bg-black transition-all mt-8 hover:shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'İlanı Kaydet ve Ekipleri Gör'}
              </button>
              
            </form>

          </div>
        </div>
      </div>
    </section>
  );
}

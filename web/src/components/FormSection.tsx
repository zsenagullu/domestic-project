import { useState } from 'react';
import { Mic, CheckCircle2, MapPin, Home } from 'lucide-react';

export default function FormSection({ setFormDataSubmitted }: { setFormDataSubmitted: (val: boolean) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState({
    saat: 'Haftada 1',
    boyut: '2+1',
    evcilHayvan: false,
    konum: ''
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormDataSubmitted(true);
  };

  const handleVoiceRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setFormData({
        saat: 'Ayda 1',
        boyut: '3+1',
        evcilHayvan: true,
        konum: 'Kadıköy, İstanbul'
      });
      setFormDataSubmitted(true);
    }, 2500);
  };

  return (
    <section id="service-details" className="py-24 bg-white relative">
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

              <div className="grid md:grid-cols-2 gap-8 items-end">
                
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

                <div className="bg-domestic-gray p-4 rounded-2xl flex items-center justify-between border border-transparent h-[56px] mt-8 md:mt-0">
                   <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                     <span className="text-domestic-red">🐱</span> Kedi/Köpek Var mı?
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={formData.evcilHayvan} onChange={() => setFormData({...formData, evcilHayvan: !formData.evcilHayvan})} />
                     <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-domestic-red"></div>
                   </label>
                </div>
              </div>

              <button type="submit" className="w-full bg-gray-900 text-white font-extrabold text-xl py-5 rounded-2xl shadow-lg hover:bg-black transition-all mt-8 hover:shadow-2xl">
                İlanı Kaydet ve Ekipleri Gör
              </button>
              
            </form>

          </div>
        </div>
      </div>
    </section>
  );
}

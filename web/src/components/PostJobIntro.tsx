import { Briefcase, ArrowRight } from 'lucide-react';

export default function PostJobIntro({ onPostJob }: { onPostJob: () => void }) {
  return (
    <div 
      onClick={onPostJob}
      className="bg-white/80 backdrop-blur-md p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group cursor-pointer"
    >
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 mb-6 group-hover:scale-110 transition-transform">
        <Briefcase size={32} />
      </div>
      <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Esnek ve Ekonomik Çözüm</h3>
      <p className="text-gray-500 mb-8 px-4 flex-grow font-medium leading-relaxed">
        İhtiyacını detaylıca paylaş, temizlik uzmanları sana en uygun fiyatla teklif göndersin. Gelen teklifleri incele, bütçene uygun olan uzmanı sen seç.
      </p>
      
      <div className="flex w-full justify-center mt-auto">
        <button 
          onClick={(e) => { e.stopPropagation(); onPostJob(); }}
          className="group/btn flex justify-center items-center gap-2 bg-white text-domestic-red border-2 border-domestic-red px-8 py-4 rounded-full font-bold text-lg hover:bg-red-50 transition-all shadow-sm active:scale-95 w-full"
        >
          İlan Oluştur ve Teklif Bekle
          <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

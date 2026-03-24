import { ArrowRight, Sparkles } from 'lucide-react';

export default function FormFlowIntro() {
  const scrollToForm = () => {
    document.getElementById('service-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div 
      className="bg-white/80 backdrop-blur-md p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group cursor-pointer" 
      onClick={scrollToForm}
    >
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-domestic-red mb-6 group-hover:scale-110 transition-transform">
        <Sparkles size={32} />
      </div>
      <h3 className="text-2xl font-extrabold text-gray-900 mb-4">Hızlı ve Pratik Eşleşme</h3>
      <p className="text-gray-500 mb-8 px-4 flex-grow font-medium leading-relaxed">
        Kriterlerine en uygun ev asistanlarını hemen listele. Tercihlerini (ev büyüklüğü, evcil hayvan vs.) belirt, en iyi uzmanlarla anında eşleş.
      </p>
      
      <div className="flex w-full justify-center mt-auto">
        <button 
          className="group/btn flex justify-center items-center gap-2 bg-domestic-red text-white px-8 py-4 rounded-full font-bold text-lg shadow-red-glow hover:bg-red-600 transition-all active:scale-95 w-full"
        >
          Form Doldurarak Uzman Bul
          <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

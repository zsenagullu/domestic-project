import { Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-40 lg:pt-40 lg:pb-48 overflow-hidden bg-domestic-beige">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-red-50 rounded-full blur-[120px] opacity-70 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-domestic-red text-sm font-bold shadow-sm border border-red-50 mb-6">
            <Sparkles size={16} /> <span>Alanında Uzman Ev Asistanları</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Evini Zahmetsizce <br className="hidden md:block" />
            <span className="text-domestic-red relative inline-block mx-2">
              Parlat,
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-red-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor"/></svg>
            </span>
            <br className="hidden md:block" />
            Domestic Yanında
          </h1>

          <p className="text-lg lg:text-xl text-gray-500 mb-2 leading-relaxed">
            Güvenilir ev asistanlarına ve temizlik uzmanlarına tek tıkla ulaş. Programını yap, gerisini bize bırak. Hayatındaki o temiz sayfa şimdi açılıyor.
          </p>
        </div>
      </div>
    </section>
  );
}

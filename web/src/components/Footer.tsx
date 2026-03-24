import { Building2, Copyright } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-domestic-red w-8 h-8 rounded-xl flex items-center justify-center text-white">
            <Building2 size={20} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white leading-none mt-1">
            Domestic<span className="text-domestic-red">.</span>
          </span>
        </div>
        
        <div className="flex gap-6 mb-8 text-sm font-semibold">
           <a href="#" className="hover:text-white transition-colors">Hakkımızda</a>
           <a href="#" className="hover:text-white transition-colors">Gizlilik</a>
           <a href="#" className="hover:text-white transition-colors">Şartlar</a>
           <a href="#" className="hover:text-white transition-colors">İletişim</a>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Copyright size={14} /> 2026 Domestic. Tüm Hakları Saklıdır.
        </div>

      </div>
    </footer>
  );
}

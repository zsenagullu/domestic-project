import { Star, ShieldCheck, Bookmark } from 'lucide-react';

const mockStaff = [
  { id: 1, name: 'Ayşe Karaca', photo: '/images/staff1.jpg', rating: 4.9, reviews: 142, price: '₺800 - ₺1200', desc: 'Genel temizlikte 5 yıllık deneyim, titiz ve güvenilir asistan.' },
  { id: 2, name: 'Zeynep Yılmaz', photo: '/images/staff2.jpg', rating: 4.8, reviews: 89, price: '₺750 - ₺1000', desc: 'Tüm evcil hayvanlı evlere uygun alanında uzmanlaşmış güler yüzlü ekip.' },
  { id: 3, name: 'Büşra Kaya', photo: '/images/staff3.jpg', rating: 5.0, reviews: 34, price: '₺1000 - ₺1500', desc: 'Detaylı ve ağır temizlikte profesyonel. Tam gün hijyen hizmeti.' }
];

export default function Results() {
  return (
    <section className="py-24 bg-domestic-beige animate-in slide-in-from-bottom-12 fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
             <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Kriterinize Uygun Personeller</h2>
             <p className="text-lg text-gray-500">Formunuzdaki bilgilere göre bölgenizdeki en iyi uzmanları sıraladık.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockStaff.map(staff => (
            <div key={staff.id} className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all group">
               <div className="flex justify-between items-start mb-6">
                 <div className="flex gap-4">
                   <div className="w-16 h-16 rounded-full bg-domestic-gray overflow-hidden border-2 border-transparent group-hover:border-domestic-red transition-all">
                     <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-gray-900 leading-tight">{staff.name}</h3>
                     <div className="flex items-center gap-1 text-sm font-semibold text-yellow-500 mt-1">
                       <Star size={16} className="fill-current" /> {staff.rating} <span className="text-gray-400 font-medium">({staff.reviews})</span>
                     </div>
                   </div>
                 </div>
                 <button className="text-gray-300 hover:text-domestic-red transition-colors">
                   <Bookmark size={24} />
                 </button>
               </div>

               <div className="mb-6 flex items-center gap-2">
                 <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-green-100">
                   <ShieldCheck size={14} /> Doğrulanmış
                 </div>
               </div>

               <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                 {staff.desc}
               </p>

               <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                 <div>
                   <p className="text-xs font-bold text-gray-400 mb-1">REFERANS FİYAT</p>
                   <p className="text-lg font-extrabold text-gray-900 leading-none">{staff.price}</p>
                 </div>
                 <button className="bg-domestic-red text-white p-3 rounded-xl font-bold hover:bg-red-600 transition-colors">
                    Seç
                 </button>
               </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

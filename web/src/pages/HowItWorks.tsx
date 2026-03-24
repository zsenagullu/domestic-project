import { useNavigate } from 'react-router-dom';
import { UserCheck, Edit3, MessageCircle, Star, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function HowItWorks() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <UserCheck size={32} className="text-domestic-red" />,
      title: "1. Rolünü Seç",
      desc: "İster hizmet arayan ol, ister ev asistanı olarak uzmanlığını sergile."
    },
    {
      icon: <Edit3 size={32} className="text-blue-600" />,
      title: "2. İhtiyacını veya Hizmetini Belirt",
      desc: "Müşteriler kriterlerini girip hizmet talebini ulaştırırken, asistanlar uzmanlık profilini öne çıkartır."
    },
    {
      icon: <MessageCircle size={32} className="text-green-600" />,
      title: "3. Eşleşme ve Teklifler",
      desc: "Akıllı sistem sayesinde en uygun uzmanla hemen eşleşin veya freelance teklifleri değerlendirin."
    },
    {
      icon: <Star size={32} className="text-yellow-500" />,
      title: "4. Hizmet ve Değerlendirme",
      desc: "İşlem pürüzsüzce gerçekleşsin, karşılıklı puanlama ve yorumlarla güven inşa edin."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <section className="relative pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Domestic Nasıl Çalışır?
          </h1>
          <p className="text-lg text-gray-600">
            Dakikalar içinde sana en uygun profesyonelle eşleş, zamanını ve bütçeni koru. Herkes için sorunsuz ve güvenilir!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center flex-grow text-center hover:shadow-lg transition-all hover:-translate-y-2">
              <div className="mb-6 p-4 rounded-full bg-gray-50 inline-block shadow-inner">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center text-center">
          <button 
            onClick={() => navigate('/role-selection')}
            className="group flex align-center justify-center items-center gap-2 bg-domestic-red text-white px-8 py-4 rounded-full font-bold text-lg shadow-red-glow hover:bg-red-600 transition-all active:scale-95"
          >
            Hemen Başla
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

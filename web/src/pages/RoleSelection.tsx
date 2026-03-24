import { useNavigate } from 'react-router-dom';
import { Home, Briefcase } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Nasıl başlamak istersin?</h1>
            <p className="text-lg text-gray-500 mt-4">Sana en uygun deneyimi sunabilmemiz için rolünü seç.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div 
              onClick={() => navigate('/register?role=customer')}
              className="bg-white p-10 rounded-[2rem] shadow-sm border-2 border-transparent hover:border-domestic-red hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 bg-red-50 text-domestic-red rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Home size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Müşteri</h2>
              <p className="text-gray-500 font-medium leading-relaxed">Evini temizletecek profesyonel bir ev asistanı veya temizlik uzmanı arıyorum.</p>
            </div>

            <div 
              onClick={() => navigate('/register?role=staff')}
              className="bg-white p-10 rounded-[2rem] shadow-sm border-2 border-transparent hover:border-[#1E3A8A] hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center group"
            >
              <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ev Asistanı</h2>
              <p className="text-gray-500 font-medium leading-relaxed">Freelance çalışarak hizmet vermek, kendi saatlerimi belirlemek istiyorum.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

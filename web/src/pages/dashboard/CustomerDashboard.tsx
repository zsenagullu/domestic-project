import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import FormFlowIntro from '../../components/FormFlowIntro';
import PostJobIntro from '../../components/PostJobIntro';
import FormSection from '../../components/FormSection';
import Results from '../../components/Results';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function CustomerDashboard() {
  const [formDataSubmitted, setFormDataSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleScrollToForm = () => {
    setShowForm(true);
    setTimeout(() => {
      const element = document.getElementById("service-details");
      element?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  if (!isAuthenticated || user?.role !== 'customer') return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col min-h-screen bg-domestic-beige pt-20">
      <Navbar />
      
      <main className="flex-grow w-full">
        <div className="bg-white border-b border-gray-100 py-12 mb-12 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Müşteri Paneli
            </h1>
            <p className="text-lg text-gray-500 mt-2">
              Hoş geldin, {user.name}. Evin için en doğru uzmanı bulmaya hazır mısın?
            </p>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full mb-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <FormFlowIntro onToggleForm={handleScrollToForm} />
            <PostJobIntro />
          </div>
        </section>

        {showForm && <FormSection setFormDataSubmitted={setFormDataSubmitted} />}
        {formDataSubmitted && <Results />}
      </main>

      <Footer />
    </div>
  );
}

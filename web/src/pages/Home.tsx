import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FormFlowIntro from '../components/FormFlowIntro';
import PostJobIntro from '../components/PostJobIntro';
import FormSection from '../components/FormSection';
import Results from '../components/Results';
import Footer from '../components/Footer';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [submittedData, setSubmittedData] = useState<{ location: string; houseSize: string } | null>(null);
  const navigate = useNavigate();

  const handleScrollToForm = () => {
    const element = document.getElementById("service-details");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePostJob = () => {
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-domestic-beige pt-20">
      <Navbar />
      <HeroSection />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 w-full mb-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <FormFlowIntro onToggleForm={handleScrollToForm} />
          <PostJobIntro onPostJob={handlePostJob} />
        </div>
      </section>

      <FormSection onSuccess={(data) => setSubmittedData(data)} />

      {submittedData && (
        <Results 
          location={submittedData.location} 
          houseSize={submittedData.houseSize} 
        />
      )}
      <Footer />
    </div>
  );
}

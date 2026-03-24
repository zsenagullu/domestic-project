import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FormFlowIntro from '../components/FormFlowIntro';
import PostJobIntro from '../components/PostJobIntro';
import FormSection from '../components/FormSection';
import Results from '../components/Results';
import Footer from '../components/Footer';
import { useState } from 'react';

export default function Home() {
  const [formDataSubmitted, setFormDataSubmitted] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-domestic-beige">
      <Navbar />
      <HeroSection />

      {/* İki Ana İş Akışı (Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 w-full mb-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <FormFlowIntro />
          <PostJobIntro />
        </div>
      </section>

      <FormSection setFormDataSubmitted={setFormDataSubmitted} />
      {formDataSubmitted && <Results />}
      <Footer />
    </div>
  );
}

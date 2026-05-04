import { Navbar } from '@/components/engetec/Navbar';
import { Hero } from '@/components/engetec/Hero';
import { Services } from '@/components/engetec/Services';
import { About } from '@/components/engetec/About';
import { Testimonials } from '@/components/engetec/Testimonials';
import { Contact } from '@/components/engetec/Contact';
import { Footer } from '@/components/engetec/Footer';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-[#f5a623] selection:text-white font-['Montserrat',_sans-serif]">
      <Navbar />
      
      <main>
        <Hero />
        <Services />
        <About />
        <Testimonials />
        <Contact />
      </main>

      <Footer />

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/5541362772930"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center group"
      >
        <MessageSquare size={32} />
        <span className="absolute right-full mr-4 bg-white text-[#1a2e4a] px-4 py-2 rounded-lg text-sm font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
          Fale conosco
        </span>
      </motion.a>
    </div>
  );
};

export default Index;

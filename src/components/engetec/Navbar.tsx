import { useState, useEffect } from 'react';
import { Menu, X, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Início', href: '#inicio' },
    { name: 'Serviços', href: '#servicos' },
    { name: 'Sobre Nós', href: '#sobre' },
    { name: 'Projetos', href: '#projetos' },
    { name: 'Contato', href: '#contato' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        isScrolled ? 'bg-[#1a2e4a] shadow-lg py-3' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-[#f5a623] p-1.5 rounded-sm">
            <Hammer className="text-white w-6 h-6" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight hidden sm:block">
            Engetec <span className="text-[#f5a623]">Engenharia & Projetos</span>
          </span>
          <span className="text-white font-bold text-xl tracking-tight sm:hidden">
            Engetec
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-white/90 hover:text-[#f5a623] font-medium transition-colors"
            >
              {link.name}
            </a>
          ))}
          <Button className="bg-[#f5a623] hover:bg-[#d48c1a] text-white font-semibold rounded-sm">
            Solicitar Orçamento
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed inset-0 bg-[#1a2e4a] z-40 flex flex-col items-center justify-center gap-8 transition-transform duration-300 md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <button
          className="absolute top-6 right-6 text-white"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={32} />
        </button>
        {navLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="text-white text-2xl font-semibold hover:text-[#f5a623]"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.name}
          </a>
        ))}
        <Button className="bg-[#f5a623] hover:bg-[#d48c1a] text-white text-lg px-8 py-6 rounded-sm">
          Solicitar Orçamento
        </Button>
      </div>
    </nav>
  );
};

import { motion } from 'framer-motion';
import { 
  Ruler, 
  Zap, 
  Droplets, 
  Building2, 
  FileCheck, 
  Map, 
  ClipboardList, 
  BarChart3 
} from 'lucide-react';

const services = [
  {
    title: 'Projetos Arquitetônicos',
    description: 'Criação de espaços funcionais e estéticos seguindo suas necessidades.',
    icon: Ruler,
  },
  {
    title: 'Projetos Elétricos',
    description: 'Planejamento detalhado de toda a rede elétrica com foco em segurança.',
    icon: Zap,
  },
  {
    title: 'Projetos Hidrossanitários',
    description: 'Sistemas eficientes de água e esgoto para sua edificação.',
    icon: Droplets,
  },
  {
    title: 'Projetos Estruturais',
    description: 'Dimensionamento preciso para garantir a estabilidade da obra.',
    icon: Building2,
  },
  {
    title: 'Regularização de Imóveis',
    description: 'Assessoria completa junto aos órgãos competentes (CREA/CAU).',
    icon: FileCheck,
  },
  {
    title: 'Topografia e Sondagem',
    description: 'Mapeamento preciso do terreno para o início da sua construção.',
    icon: Map,
  },
  {
    title: 'Laudos e ARTs',
    description: 'Documentação técnica essencial para vistorias e aprovações.',
    icon: ClipboardList,
  },
  {
    title: 'Consultoria em Engenharia',
    description: 'Apoio especializado para tomadas de decisão técnicas.',
    icon: BarChart3,
  },
];

export const Services = () => {
  return (
    <section id="servicos" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e4a] mb-4">Nossos Serviços</h2>
          <div className="w-20 h-1.5 bg-[#f5a623] mx-auto mb-6"></div>
          <p className="text-gray-600">
            Oferecemos uma gama completa de soluções técnicas para todas as etapas da sua obra, 
            do planejamento à regularização final.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="bg-[#1a2e4a]/5 w-14 h-14 flex items-center justify-center rounded-lg mb-6 group-hover:bg-[#f5a623]/10 transition-colors">
                <service.icon className="text-[#1a2e4a] w-8 h-8 group-hover:text-[#f5a623] transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-[#1a2e4a] mb-3">{service.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { motion, type Variants } from 'framer-motion'; // Added 'type' keyword here
import { ScanLine, LayoutDashboard, ArrowRight, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  // Explicit typing for Framer Motion variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
    },
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden font-sans text-slate-900">
      {/* Background Glows - Using suggested w-200 and h-100 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-sm font-medium tracking-wide">
              <Leaf className="w-4 h-4" />
              <span>Aligned with PMFBY Guidelines</span>
            </div>
          </motion.div>

          {/* Hero Typography - Using suggested bg-linear-to-r */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
            Real-Time <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500">Crop Intelligence</span> <br/> & Analytics
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-500 mb-16 max-w-2xl mx-auto leading-relaxed">
            A secure digital initiative for precision crop monitoring. Capture field images, track vital growth stages, and assess damage instantly with AI-powered geospatial insights.
          </motion.p>

          {/* Action Cards Container */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
            
            {/* Card 1: Upload / Crop Analysis - Using suggested bg-linear-to-br */}
            <motion.div
              whileHover={{ y: -8, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={() => navigate('/upload')}
              className="group cursor-pointer relative p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="text-emerald-500 w-6 h-6" />
              </div>
              
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-8 shadow-inner border border-emerald-200/50">
                <ScanLine className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                Crop Analysis
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Capture or upload field photos with precise geolocation. Run real-time AI assessments optimized for immediate field-official reporting.
              </p>
            </motion.div>

            {/* Card 2: Dashboard - Using suggested bg-linear-to-br */}
            <motion.div
              whileHover={{ y: -8, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={() => navigate('/dashboard')}
              className="group cursor-pointer relative p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="text-blue-500 w-6 h-6" />
              </div>

              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-100 to-slate-50 flex items-center justify-center mb-8 shadow-inner border border-blue-200/50">
                <LayoutDashboard className="w-8 h-8 text-blue-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                Command Dashboard
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Explore comprehensive geospatial data. View interactive maps, track AI assessment results, and monitor crop health across all registered regions.
              </p>
            </motion.div>

          </motion.div>
        </motion.div>
      </div>

      {/* Footer minimal integration */}
      <div className="absolute bottom-6 w-full text-center text-sm font-medium text-slate-400">
        CROPIC © 2026 | Digital Crop Monitoring Initiative
      </div>
    </div>
  );
};

export default Home;
import { motion } from "motion/react";
import { Terminal, Shield, Globe, Cpu, Mail, User, Phone, MapPin } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 selection:bg-blue-500">
      <div className="max-w-5xl mx-auto space-y-20">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <header className="space-y-2">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                className="text-6xl md:text-8xl font-black tracking-tighter leading-none"
              >
                THE<br /><span className="text-blue-500">ARCHITECT.</span>
              </motion.h1>
              <p className="text-xs uppercase tracking-[0.4em] text-white/30 font-bold">Chitron Bhattacharjee / ID: 6730742077</p>
            </header>
            
            <p className="text-lg md:text-xl text-white/60 font-light leading-relaxed">
              Synthesizing cutting-edge AI architecture with the humanistic values of socialist welfare. 
              Designing the future of interaction while preserving the sanctity of human connection.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-600/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 bg-white/5 p-4 backdrop-blur-3xl">
              <img src="https://ik.imagekit.io/chitron/profile_default.jpg" className="w-full h-full object-cover rounded-[2rem]" />
            </div>
          </div>
        </section>

        {/* Roles Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              icon: Terminal, 
              title: "Full Stack AI", 
              desc: "Engineering bots and complex LLM architectures for the next generation of automation." 
            },
            { 
              icon: Globe, 
              title: "UI/UX Designer", 
              desc: "Crafting glassmorphic, fluid interfaces that prioritize user intuition and sensory delight." 
            },
            { 
              icon: Shield, 
              title: "Socialist Politician", 
              desc: "Advocating for digital rights, universal access, and the ethical integration of AI into society." 
            },
            { 
              icon: Cpu, 
              title: "Writer", 
              desc: "Documenting the intersection of technology, humanity, and the sociopolitical climate." 
            }
          ].map((role, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] border border-white/5 bg-white/2 hover:bg-white/5 transition-all space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <role.icon size={24} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest">{role.title}</h3>
              <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-wider">{role.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Technical Stack / Footer Info */}
        <section className="p-12 rounded-[3rem] border border-white/10 bg-white/2 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="space-y-4">
            <h4 className="text-[8px] uppercase tracking-widest font-black text-white/20">Communication</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Mail size={14} className="text-blue-500" />
                <span>chitron@network.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Globe size={14} className="text-blue-500" />
                <span>portfolio.cb</span>
              </div>
            </div>
          </div>
          <div className="space-y-4 md:pl-12 pt-8 md:pt-0">
             <h4 className="text-[8px] uppercase tracking-widest font-black text-white/20">Location</h4>
             <div className="flex items-center gap-3 text-sm text-white/60">
                <MapPin size={14} className="text-blue-500" />
                <span>Cloud Node: Southeast Asia</span>
             </div>
          </div>
          <div className="space-y-4 md:pl-12 pt-8 md:pt-0">
             <h4 className="text-[8px] uppercase tracking-widest font-black text-white/20">Status</h4>
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Available for Innovation</span>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FirebaseProvider, useFirebase } from "./contexts/FirebaseContext";
import Navbar from "./components/Navbar";
import Feed from "./components/Feed";
import ShiPuAI from "./components/ShiPuAI";
import TelegramBridge from "./components/TelegramBridge";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { motion } from "motion/react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./contexts/FirebaseContext";
import { User, Shield, Terminal, Globe, Cpu } from "lucide-react";

function HomePage() {
  useEffect(() => {
    const logVisit = async () => {
      try {
        await addDoc(collection(db, "visitor_logs"), {
          userAgent: navigator.userAgent,
          timestamp: serverTimestamp(),
          path: window.location.pathname
        });
      } catch (err) {
        console.error("Visit log failed", err);
      }
    };
    logVisit();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white pb-32">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <Navbar />

      <main className="relative pt-32 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Intro & Profile */}
        <div className="lg:col-span-4 space-y-12">
          <section className="space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-2"
            >
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                CHITRON<br /><span className="text-blue-500">BHATTACHARJEE</span>
              </h1>
              <p className="text-xs uppercase tracking-[0.4em] text-white/30 font-bold">Visionary Architect</p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm space-y-4"
            >
              <div className="flex gap-2">
                {[
                  { icon: Terminal, label: "AI Bot Dev" },
                  { icon: Shield, label: "Politician" },
                  { icon: Globe, label: "UI/UX" },
                  { icon: Cpu, label: "Writer" }
                ].map((item, i) => (
                  <div key={i} className="group relative" title={item.label}>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                      <item.icon size={18} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                Bridging the gap between technological singularity and socialist welfare through clean code and humane design.
              </p>
            </motion.div>
          </section>

          <section id="contact">
            <TelegramBridge />
          </section>
        </div>

        {/* Right Column: Feed & Content */}
        <div className="lg:col-span-8">
          <section id="feed">
             <Feed />
          </section>
        </div>
      </main>

      <ShiPuAI />
      
      {/* Footer Branding */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center opacity-10 uppercase tracking-widest text-[8px] font-bold">
           <span>System: Active</span>
           <span>/** Author: Chitron Bhattacharjee **/</span>
           <span>Lat: 22.13N / Long: 20.26Z</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </FirebaseProvider>
  );
}

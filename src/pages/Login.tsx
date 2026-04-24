import { useState } from "react";
import { motion } from "motion/react";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useFirebase } from "../contexts/FirebaseContext";

export default function Login() {
  const { signInEmail } = useFirebase();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInEmail(form.email, form.password);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-blue-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-10 rounded-[2.5rem] border border-white/10 bg-white/2 backdrop-blur-xl space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Re-Authenticate</h1>
          <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold">Accessing your profile cluster</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-2">Endpoint (Email / Username)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                required
                type="text" 
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-2">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                required
                type="password" 
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><span>Sync Link</span> <LogIn size={16} /></>}
          </button>
          
          {error && <p className="text-red-500 text-[10px] uppercase font-bold text-center">{error}</p>}
        </form>

        <div className="pt-4 text-center opacity-10 text-[8px] uppercase tracking-widest font-black">
           /** Author: Chitron Bhattacharjee **/
        </div>

        <p className="text-center text-[10px] text-white/20 uppercase tracking-widest font-bold">
          New signature? <Link to="/signup" className="text-blue-500 hover:underline">Construct Profile</Link>
        </p>
      </motion.div>
    </div>
  );
}

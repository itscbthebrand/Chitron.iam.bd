import { useState } from "react";
import { useFirebase } from "../contexts/FirebaseContext";
import { motion } from "motion/react";
import { User, Camera, Shield, Phone, Mail, Loader2, Save, Terminal } from "lucide-react";
import { cn } from "../lib/utils";

export default function Profile() {
  const { profile, updateProfileData } = useFirebase();
  const [form, setForm] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    phoneNumber: profile?.phoneNumber || "",
    photoURL: profile?.photoURL || ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfileData(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter">DATA CLUSTER</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest font-medium">Modification of individual user identity</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Avatar Section */}
          <div className="lg:col-span-4 flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white/5 bg-white/2 relative">
                <img src={form.photoURL} alt="Profile" className="w-full h-full object-cover" />
                <button className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/60 mt-2">Update Node</span>
                </button>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Shield size={18} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-black text-white uppercase tracking-widest">{profile.firstName} {profile.lastName}</h3>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">@{profile.username}</p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleUpdate} className="lg:col-span-8 p-10 rounded-[2.5rem] border border-white/10 bg-white/2 backdrop-blur-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-2">First Nominal</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    value={form.firstName}
                    onChange={e => setForm({...form, firstName: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-12 text-sm focus:ring-1 focus:ring-blue-500 transition-all font-light" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-2">Last Nominal</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    value={form.lastName}
                    onChange={e => setForm({...form, lastName: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-12 text-sm focus:ring-1 focus:ring-blue-500 transition-all font-light" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-2">Secure Link (Phone)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    value={form.phoneNumber}
                    onChange={e => setForm({...form, phoneNumber: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-12 text-sm focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-2">Media URL</label>
                <div className="relative">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    value={form.photoURL}
                    onChange={e => setForm({...form, photoURL: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 pl-12 text-sm focus:ring-1 focus:ring-blue-500 transition-all font-mono" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><span>Commit Changes</span> <Save size={16} /></>}
              </button>
              {success && <p className="text-green-500 text-[10px] uppercase font-bold text-center mt-4">Database Synced Correctly</p>}
            </div>
          </form>
        </div>
        <div className="pt-20 text-center opacity-10 text-[8px] uppercase tracking-widest font-black">
           /** Author: Chitron Bhattacharjee **/
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { User, LogIn, LayoutDashboard, Terminal, MessageSquare, Shield } from "lucide-react";
import { useFirebase } from "../contexts/FirebaseContext";
import { cn } from "../lib/utils";

export default function Navbar() {
  const { user, profile, logout } = useFirebase();
  const [hasNewMessages, setHasNewMessages] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "messages"),
      where("authorId", "==", user.uid),
      where("platform", "==", "telegram_reply"),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // Simple heuristic: if we have any reply, show a dot
        // In a real app, we'd check against a "lastRead" timestamp
        setHasNewMessages(true);
      }
    });
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-6 border-b border-white/5 bg-black/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative px-3 py-1.5 bg-black border border-white/10 rounded-lg flex items-center gap-2">
              <Terminal size={16} className="text-blue-400" />
              <span className="text-sm font-bold text-white tracking-widest uppercase">CB.OS</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-black text-white/30">
            <Link to="/" className="hover:text-white transition-colors">Feed</Link>
            <Link to="/about" className="hover:text-white transition-colors">Architect</Link>
            {user && (
              <Link to="/messages" className="relative hover:text-white transition-colors flex items-center gap-1.5 underline decoration-blue-500/30">
                Signals
                {hasNewMessages && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50" />
                )}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.email === "chitronbhattacharjee@gmail.com" && (
                  <Link 
                    to="/admin"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  >
                    <Shield size={18} />
                  </Link>
                )}
                <Link 
                  to="/profile"
                  className="group flex items-center gap-3 pr-2 pl-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">{profile?.username || "Node"}</span>
                  <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/10 shadow-lg">
                    <img src={profile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="U" className="w-full h-full object-cover" />
                  </div>
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-50 transition-all shadow-xl shadow-white/5"
              >
                <LogIn size={14} />
                <span>Initialize</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

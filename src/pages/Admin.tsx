import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Image as ImageIcon, Trash2, LogOut, Users, MessageSquare, BarChart2, Shield, Lock, Smartphone, Key, Loader2, CheckCircle, Smartphone as SmartphoneIcon, Globe, Cpu, Brain, Database, Edit3, Trash } from "lucide-react";
import { useFirebase } from "../contexts/FirebaseContext";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, limit } from "firebase/firestore";
import { db } from "../contexts/FirebaseContext";
import { cn } from "../lib/utils";

export default function Admin() {
  const { user, logout } = useFirebase();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "messages" | "logs" | "security" | "ai">("posts");
  const [logs, setLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [aiKnowledge, setAiKnowledge] = useState<any[]>([]);
  const [newKnowledge, setNewKnowledge] = useState("");
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // Site Settings
  const [siteSettings, setSiteSettings] = useState({
    profilePhoto: "",
    coverPhoto: "",
    geminiKey: "AIzaSyD18rao1MHXNCN1PssuCvrU9gOah1uzL5s"
  });
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Auth state
  const [isFullyVerified, setIsFullyVerified] = useState(false);
  const [authStep, setAuthStep] = useState<"initial" | "telegram" | "mfa">("initial");
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Security Settings
  const [mfaStatus, setMfaStatus] = useState({ enabled: false });
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; otpauth: string } | null>(null);

  // Check if admin email matches
  const isCorrectEmail = user?.email === "chitronbhattacharjee@gmail.com";

  useEffect(() => {
    // Check if previously verified in this session
    const verified = sessionStorage.getItem("admin_verified");
    if (verified === "true") setIsFullyVerified(true);

    // Get MFA status
    fetch("/api/admin/mfa-status").then(r => r.json()).then(setMfaStatus);
  }, []);

  useEffect(() => {
    if (!isFullyVerified || !isCorrectEmail) return;

    const unsubLogs = onSnapshot(query(collection(db, "visitor_logs"), orderBy("timestamp", "desc"), limit(50)), (snaps) => {
      setLogs(snaps.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMsgs = onSnapshot(query(collection(db, "messages"), orderBy("timestamp", "desc")), (snaps) => {
      setMessages(snaps.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsDataLoading(false);
    });

    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snaps) => {
      setAllPosts(snaps.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAI = onSnapshot(query(collection(db, "ai_knowledge"), orderBy("createdAt", "desc")), (snaps) => {
      setAiKnowledge(snaps.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const { getDoc } = import("firebase/firestore");
    onSnapshot(doc(db, "site_settings", "main"), (snap) => {
      if (snap.exists()) {
        setSiteSettings(snap.data() as any);
      }
    });

    return () => {
      unsubLogs();
      unsubMsgs();
      unsubPosts();
      unsubAI();
    };
  }, [isFullyVerified, isCorrectEmail]);

  const handleRequestTelegramCode = async () => {
    setIsAuthLoading(true);
    try {
      await fetch("/api/admin/request-code", { method: "POST" });
      setAuthStep("telegram");
      setAuthError("");
    } catch (e) {
      setAuthError("Failed to transmit signal to Telegram.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!authCode) return;
    setIsAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode, type: authStep === "telegram" ? "telegram" : "mfa" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsFullyVerified(true);
        sessionStorage.setItem("admin_verified", "true");
      } else {
        setAuthError(data.error);
      }
    } catch (e) {
      setAuthError("Synchronization error.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isActionLoading) return;

    setIsActionLoading(true);
    try {
      await addDoc(collection(db, "posts"), {
        content,
        mediaUrl,
        author: "Chitron Bhattacharjee",
        createdAt: serverTimestamp(),
      });
      setContent("");
      setMediaUrl("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!mediaUrl || isActionLoading) {
      alert("Media URL required for story transmission.");
      return;
    }

    setIsActionLoading(true);
    try {
      await addDoc(collection(db, "stories"), {
        mediaUrl,
        createdAt: serverTimestamp(),
      });
      setMediaUrl("");
      alert("Story broadcasted.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("Permanently delete this transmission?")) {
      setIsActionLoading(true);
      try {
        await deleteDoc(doc(db, "posts", id));
      } catch (err) {
        console.error(err);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleSetupMFA = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/mfa-setup", { method: "POST" });
      const data = await res.json();
      setMfaSetup(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEnableMFA = async (code: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/mfa-enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setMfaStatus({ enabled: true });
        setMfaSetup(null);
      } else {
        alert("Invalid code");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateKnowledge = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newKnowledge.trim() || isActionLoading) return;

    setIsActionLoading(true);
    try {
      await addDoc(collection(db, "ai_knowledge"), {
        content: newKnowledge,
        createdAt: serverTimestamp(),
      });
      setNewKnowledge("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (confirm("Sync neural deletion? This memory will be purged.")) {
      setIsActionLoading(true);
      try {
        await deleteDoc(doc(db, "ai_knowledge", id));
      } catch (err) {
        console.error(err);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleUpdateSiteSettings = async () => {
    setIsActionLoading(true);
    const { updateDoc, setDoc } = await import("firebase/firestore");
    try {
      await setDoc(doc(db, "site_settings", "main"), siteSettings, { merge: true });
      alert("Settings broadcasted successfully.");
    } catch (e) {
      alert("Error updating settings.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 1. Initial Access Gate
  if (!user || !isCorrectEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 selection:bg-blue-500">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-8">
            <Lock className="text-blue-500" size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter">SECURE PERIMETER</h1>
          <p className="text-white/40 text-sm leading-relaxed">System only accessible by owner identity via Google Auth.</p>
          <button onClick={() => window.location.href = '/'} className="block w-full text-blue-500 text-[10px] uppercase tracking-widest hover:underline pt-4 font-bold">Abort Session</button>
        </div>
      </div>
    );
  }

  // 2. 2FA Access Gate
  if (!isFullyVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-8 max-w-sm w-full p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-blue-500/10"
        >
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tighter uppercase">Identity Verification</h1>
            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold">Level 2 clearance required</p>
          </div>

          <AnimatePresence mode="wait">
            {authStep === "initial" && (
              <motion.div key="initial" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleRequestTelegramCode}
                    disabled={isAuthLoading}
                    className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
                  >
                    <SmartphoneIcon className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Telegram</span>
                  </button>
                  <button 
                    onClick={() => setAuthStep("mfa")}
                    disabled={!mfaStatus.enabled}
                    className={cn(
                      "flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/10 bg-white/5 transition-all group",
                      mfaStatus.enabled ? "hover:bg-white/10 cursor-pointer" : "opacity-30 cursor-not-allowed"
                    )}
                  >
                    <Key className={cn("transition-transform group-hover:scale-110", mfaStatus.enabled ? "text-indigo-400" : "text-white/40")} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">2FA App</span>
                  </button>
                </div>
                {isAuthLoading && <Loader2 className="animate-spin mx-auto text-blue-500" size={24} />}
              </motion.div>
            )}

            {(authStep === "telegram" || authStep === "mfa") && (
              <motion.div key="input" className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Enter Access Code</label>
                  <input
                    type="text"
                    autoFocus
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                    className="w-full bg-black border border-white/10 rounded-xl py-4 text-center text-xl font-bold tracking-[0.5em] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  {authError && <p className="text-red-500 text-[10px] uppercase font-bold">{authError}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAuthStep("initial")} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5">Cancel</button>
                  <button 
                    onClick={handleVerifyCode}
                    disabled={isAuthLoading || authCode.length < 4}
                    className="flex-1 px-4 py-3 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={logout} className="text-[10px] text-white/20 hover:text-white uppercase tracking-widest font-bold transition-colors">Abort Terminal</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex selection:bg-blue-500">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black p-8 space-y-10 flex flex-col">
        <div>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em]">Control Panel</h2>
          <p className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            V2.0.4 Hyper-Secure
          </p>
        </div>

        <nav className="space-y-1 text-white/60">
          {[
            { id: "posts", icon: Plus, label: "Content Store" },
            { id: "messages", icon: MessageSquare, label: "Transmission Logs" },
            { id: "logs", icon: BarChart2, label: "System Recon" },
            { id: "ai", icon: Brain, label: "Neural Center" },
            { id: "security", icon: Shield, label: "Vault Security" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center justify-between group px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === item.id ? "bg-white/10 text-white border border-white/5" : "hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="pt-10 mt-auto border-t border-white/5">
           <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/10">
             <LogOut size={16} />
             <span>Eject User</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 lg:p-20">
        {activeTab === "posts" && (
          <div className="max-w-4xl space-y-16">
            <header className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter">BROADCAST</h1>
              <p className="text-white/40 text-sm uppercase tracking-widest font-medium">Inject new data clusters into the feed</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              <form onSubmit={handleCreatePost} className="p-10 rounded-[2.5rem] border border-white/10 bg-white/2 backdrop-blur-md space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-1">Payload Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Input binary or text string..."
                    className="w-full bg-black/50 border border-white/10 rounded-3xl p-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[180px] transition-all resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-white/30 ml-1">Media Endpoint</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://ik.imagekit.io/..."
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={isActionLoading} className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2">
                    {isActionLoading ? <Loader2 className="animate-spin" size={16} /> : "Deploy Feed"}
                  </button>
                  <button type="button" disabled={isActionLoading} onClick={() => handleCreateStory()} className="px-8 bg-blue-600/10 border border-blue-500/20 text-blue-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center">
                    {isActionLoading ? <Loader2 className="animate-spin" size={16} /> : "Story"}
                  </button>
                </div>
              </form>

              <div className="space-y-6">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/20">Active Transmissions</h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {isDataLoading ? (
                    <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-white/20" /></div>
                  ) : allPosts.map(post => (
                    <div key={post.id} className="p-5 rounded-2xl border border-white/5 bg-white/2 flex items-center justify-between group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        {post.mediaUrl && <img src={post.mediaUrl} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                        <p className="text-xs text-white/60 truncate">{post.content}</p>
                      </div>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        disabled={isActionLoading}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-12">
            <header className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter">GATEWAY</h1>
              <p className="text-white/40 text-sm uppercase tracking-widest font-medium">External signals received via TG-Bridge</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isDataLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center gap-4 text-white/20">
                  <Loader2 className="animate-spin" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Scanning signal history</span>
                </div>
              ) : messages.map((msg) => (
                <div key={msg.id} className="p-8 rounded-[2rem] border border-white/5 bg-white/2 flex flex-col justify-between hover:bg-white/5 transition-all group">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-[10px]">{msg.visitorName?.[0]}</div>
                        <span className="text-xs font-black text-white">{msg.visitorName}</span>
                      </div>
                      <span className="text-[8px] text-white/20 font-bold uppercase">{msg.timestamp?.toDate().toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed font-light">{msg.text}</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] text-blue-500/50 font-black uppercase tracking-widest">ID: {msg.sessionId}</span>
                    <button 
                      onClick={() => {
                        if (confirm("Delete this signal?")) deleteDoc(doc(db, "messages", msg.id));
                      }} 
                      className="p-2 text-white/10 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
           <div className="space-y-12">
            <header className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter">RECON</h1>
              <p className="text-white/40 text-sm uppercase tracking-widest font-medium">Tracking metadata and interaction heatmaps</p>
            </header>

            <div className="rounded-3xl border border-white/5 bg-black/50 overflow-hidden backdrop-blur-md">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-white/5 text-white/40 uppercase tracking-[0.2em] font-black">
                  <tr>
                    <th className="px-8 py-6">UTC Timestamp</th>
                    <th className="px-8 py-6">Target Route</th>
                    <th className="px-8 py-6">Identifier Package</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-8 py-5 text-white/50 font-mono">{log.timestamp?.toDate().toLocaleString()}</td>
                      <td className="px-8 py-5 text-blue-400 font-bold uppercase tracking-widest">{log.path}</td>
                      <td className="px-8 py-5 text-white/20 truncate max-w-sm italic">{log.userAgent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="max-w-5xl space-y-16">
            <header className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-3xl bg-blue-500/10 text-blue-400">
                  <Brain size={32} />
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tighter italic">NEURAL CENTER</h1>
                  <p className="text-white/40 text-sm uppercase tracking-[0.2em] font-medium">ShiPu AI Core Memory & Knowledge Governance</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              <div className="xl:col-span-1 space-y-8">
                <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/2 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Knowledge Injection</h3>
                    <p className="text-[10px] text-white/30 leading-relaxed font-bold uppercase">Manually input deep-context data or paste documents into the AI core.</p>
                  </div>
                  
                  <textarea
                    value={newKnowledge}
                    onChange={(e) => setNewKnowledge(e.target.value)}
                    placeholder="Enter factual data or context here..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[200px] transition-all resize-none font-mono"
                  />
                  
                  <button 
                    onClick={() => handleCreateKnowledge()}
                    disabled={isActionLoading || !newKnowledge.trim()}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                  >
                    {isActionLoading ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                    Commit Memory
                  </button>
                </div>

                <div className="p-8 rounded-[2.5rem] border border-blue-500/10 bg-blue-500/2 space-y-4">
                  <div className="flex items-center gap-3 text-blue-500">
                    <Shield size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Logic Safeguard</span>
                  </div>
                  <p className="text-[9px] text-white/40 leading-relaxed font-bold uppercase">All public posts are automatically indexed. Delete or edit manual overrides if the AI exhibits cognitive dissonance or factual errors.</p>
                </div>
              </div>

              <div className="xl:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/20">Memory Shards</h3>
                  <span className="text-[10px] font-mono text-white/20">{aiKnowledge.length} Fragments Found</span>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin">
                  {aiKnowledge.length === 0 && (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-[2.5rem]">
                      <p className="text-[10px] uppercase font-black text-white/10 tracking-widest">No custom memory shards initialized</p>
                    </div>
                  )}
                  {aiKnowledge.map((item) => (
                    <div key={item.id} className="p-6 rounded-3xl border border-white/5 bg-white/2 group hover:bg-white/5 transition-all">
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-3 flex-1">
                          <p className="text-xs text-white/80 leading-relaxed font-light">{item.content}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">shard_id: {item.id.slice(0, 8)}</span>
                            <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">{item.createdAt?.toDate().toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteKnowledge(item.id)}
                          className="p-2.5 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="max-w-2xl space-y-12">
            <header className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter">VAULT</h1>
              <p className="text-white/40 text-sm uppercase tracking-widest font-medium">Military-grade identity protection</p>
            </header>

            <div className="space-y-6">
              {/* Site Identity Section */}
              <div className="p-10 rounded-[2.5rem] border border-white/10 bg-white/2 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Global Identity</h3>
                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Node Visualization Assets</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Profile Photo (IK URL)</label>
                    <input 
                      type="url"
                      value={siteSettings.profilePhoto}
                      onChange={e => setSiteSettings({...siteSettings, profilePhoto: e.target.value})}
                      placeholder="https://ik.imagekit.io/..."
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Cover Photo (IK URL)</label>
                    <input 
                      type="url"
                      value={siteSettings.coverPhoto}
                      onChange={e => setSiteSettings({...siteSettings, coverPhoto: e.target.value})}
                      placeholder="https://ik.imagekit.io/..."
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-xs font-mono"
                    />
                  </div>
                  <button onClick={handleUpdateSiteSettings} disabled={isActionLoading} className="w-full bg-white text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                    {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : "Broadcast Global UI"}
                  </button>
                </div>
              </div>

              {/* AI Token Management */}
              <div className="p-10 rounded-[2.5rem] border border-white/10 bg-white/2 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">AI Compute Core</h3>
                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Gemini API Token Rotation</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Gemini Key (Vaulted)</label>
                    <input 
                      type="password"
                      value={siteSettings.geminiKey}
                      onChange={e => setSiteSettings({...siteSettings, geminiKey: e.target.value})}
                      placeholder="AIzaSyB..."
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-xs font-mono"
                    />
                  </div>
                  <button onClick={handleUpdateSiteSettings} disabled={isActionLoading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                    {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : "Rotate Token"}
                  </button>
                </div>
              </div>

              <div className="p-10 rounded-[2.5rem] border border-white/10 bg-white/2 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-4 rounded-2xl", mfaStatus.enabled ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">Two-Factor Encryption</h3>
                      <p className="text-xs text-white/30 uppercase tracking-widest font-bold">{mfaStatus.enabled ? "Active Projection" : "Inactive / Vulnerable"}</p>
                    </div>
                  </div>
                  {!mfaStatus.enabled && !mfaSetup && (
                    <button onClick={handleSetupMFA} disabled={isActionLoading} className="px-6 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                      {isActionLoading ? <Loader2 className="animate-spin" size={14} /> : "Initialize"}
                    </button>
                  )}
                </div>

                {mfaSetup && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-6 pt-6 border-t border-white/5">
                    <div className="space-y-2">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Secret Key (Scan in Authenticator App)</p>
                      <div className="p-6 rounded-2xl bg-black border border-white/10 flex flex-col items-center gap-4">
                        <div className="text-blue-400 font-mono text-lg font-bold tracking-widest">{mfaSetup.secret}</div>
                        <p className="text-[10px] text-white/30 text-center italic">Add manually using "Chitron Portfolio" label</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Verification Sync</p>
                      <input 
                        type="text" 
                        maxLength={6}
                        placeholder="000000"
                        onInput={(e) => {
                          const val = (e.target as HTMLInputElement).value;
                          if (val.length === 6) handleEnableMFA(val);
                        }}
                        className="w-full bg-black border border-white/10 rounded-2xl py-4 text-center text-2xl font-bold tracking-[1em] focus:outline-none focus:ring-1 focus:ring-green-500/50"
                      />
                    </div>
                  </motion.div>
                )}

                {mfaStatus.enabled && (
                  <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-4">
                    <CheckCircle className="text-green-500" size={20} />
                    <p className="text-xs text-green-500/80 font-bold uppercase tracking-widest">Authenticator Application Verified</p>
                  </div>
                )}
              </div>

              <div className="p-8 rounded-3xl border border-white/5 bg-white/2 flex items-center gap-4 opacity-40">
                <Smartphone className="text-white/40" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Telegram Fail-Safe</p>
                  <p className="text-[8px] text-white/40">Default extraction route: Enabled</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

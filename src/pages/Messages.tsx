import { useState, useEffect } from "react";
import { useFirebase } from "../contexts/FirebaseContext";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, Send, Clock, User, CheckCircle, Bot, Loader2 } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../contexts/FirebaseContext";
import { cn } from "../lib/utils";

export default function Messages() {
  const { user, profile } = useFirebase();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "messages"),
      where("authorId", "==", user.uid),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snaps) => {
      setMessages(snaps.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || sending) return;

    setSending(true);
    const msg = input;
    setInput("");

    try {
      await addDoc(collection(db, "messages"), {
        authorId: user.uid,
        visitorName: profile?.firstName + " " + profile?.lastName,
        text: msg,
        timestamp: serverTimestamp(),
        platform: "web_auth"
      });

      // Notify admin via server bridge
      await fetch("/api/send-to-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: profile?.firstName + " " + profile?.lastName, 
          message: msg, 
          sessionId: user.uid 
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="text-center space-y-4">
          <MessageCircle className="mx-auto text-blue-500" size={48} />
          <h1 className="text-2xl font-black uppercase tracking-tighter">Secure Communication Hub</h1>
          <p className="text-white/40 text-sm italic">Access restricted to authenticated signatures.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb- 12 px-6">
      <div className="max-w-4xl mx-auto flex flex-col h-[75vh] border border-white/5 bg-white/2 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
               <MessageCircle size={24} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest">Signal Terminal</h2>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Encrypted Bridge to Chitron</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Uplink Active</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {loading ? (
            <div className="h-full flex items-center justify-center text-white/20">
              <Loader2 className="animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <Bot className="text-white/5" size={64} />
              <p className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em]">No transmission history found</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[75%]",
                  msg.platform !== "telegram_reply" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.platform !== "telegram_reply" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white/10 text-white/90 border border-white/10 rounded-tl-none font-light italic"
                )}>
                  {msg.text}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[8px] text-white/20 font-bold uppercase tracking-widest">
                  <span>{msg.timestamp?.toDate().toLocaleTimeString()}</span>
                  <CheckCircle size={8} className="text-blue-500/50" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <form onSubmit={handleSend} className="p-6 border-t border-white/10 bg-white/5">
          <div className="relative">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Inject signal..."
              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || sending}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-blue-400 hover:text-blue-300 disabled:opacity-30 transition-colors"
            >
              {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </form>
        <div className="p-4 text-center opacity-10 text-[8px] uppercase tracking-widest font-black">
           /** Author: Chitron Bhattacharjee **/
        </div>
      </div>
    </div>
  );
}

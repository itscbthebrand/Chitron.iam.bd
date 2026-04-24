import { useState } from "react";
import { motion } from "motion/react";
import { Send, User, MessageCircle, CheckCircle } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../contexts/FirebaseContext";

export default function TelegramBridge() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message || status === "sending") return;

    setStatus("sending");
    const sessionId = Math.random().toString(36).substring(7);

    try {
      // 1. Send to Admin Telegram via API
      await fetch("/api/send-to-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, sessionId }),
      });

      // 2. Log in Firestore
      await addDoc(collection(db, "messages"), {
        visitorName: name,
        text: message,
        sessionId,
        platform: "web",
        timestamp: serverTimestamp(),
      });

      setStatus("success");
      setName("");
      setMessage("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400">
          <MessageCircle size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Direct Bridge</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest">To Chitron's Telegram</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-white/20"
            id="bridge-name"
          />
        </div>
        <div className="relative">
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell me anything..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-white/20"
            id="bridge-message"
          />
        </div>
        
        <button
          type="submit"
          disabled={status === "sending"}
          className="group relative w-full overflow-hidden rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-blue-50 disabled:opacity-50"
          id="bridge-submit"
        >
          <div className="relative flex items-center justify-center gap-2">
            {status === "idle" && (
              <>
                <span>Transmit Signal</span>
                <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
            {status === "sending" && <span>Sending...</span>}
            {status === "success" && (
              <>
                <CheckCircle size={18} className="text-green-600" />
                <span>Message Synced</span>
              </>
            )}
            {status === "error" && <span>Transmission Failed</span>}
          </div>
        </button>
      </form>
    </div>
  );
}

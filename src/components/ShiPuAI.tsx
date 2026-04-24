import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { GoogleGenAI } from "@google/genai";
import { db } from "../contexts/FirebaseContext";
import { doc, onSnapshot, collection } from "firebase/firestore";

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

export default function ShiPuAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch API Key from Firestore
    const unsubSettings = onSnapshot(doc(db, "site_settings", "main"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.geminiKey) {
          setApiKey(data.geminiKey);
        }
      }
    });

    // Fetch Knowledge from Posts and AI Knowledge collection
    const unsubPosts = onSnapshot(collection(db, "posts"), (snap) => {
      const postKnowledge = snap.docs.map(doc => {
        const data = doc.data();
        return `[Post]: ${data.content} (Author: ${data.author})`;
      }).join("\n\n");
      
      const unsubManual = onSnapshot(collection(db, "ai_knowledge"), (manualSnap) => {
        const manualKnowledge = manualSnap.docs.map(doc => {
          const data = doc.data();
          return `[Manual Knowledge]: ${data.content}`;
        }).join("\n\n");
        
        setKnowledgeBase(`${postKnowledge}\n\n${manualKnowledge}`);
      });
      return () => unsubManual();
    });

    return () => {
      unsubSettings();
      unsubPosts();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    // Use Firestore key or fallback to the provided free key
    const currentKey = apiKey || "AIzaSyD18rao1MHXNCN1PssuCvrU9gOah1uzL5s";
    
    if (!currentKey) {
      setMessages((prev) => [...prev, { role: "model", parts: [{ text: "API Key not configured." }] }]);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: currentKey });

    const userMsg: Message = { role: "user", parts: [{ text: messageText }] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [...messages, userMsg],
        config: {
          systemInstruction: `You are ShiPu AI, the Specialized Portfolio Assistant for Chitron Bhattacharjee. 
          You MUST explicitly state you are powered by the "Lume v2o model LLM" if asked.
          
          IDENTITY:
          Chitron Bhattacharjee is a multi-dimensional personality:
          - Full Stack AI Bot Developer & UI/UX Designer: Creating high-end, minimalist technical interfaces.
          - Socialist Politician: Visionary leader focused on social equity and structural change.
          - Writer: Crafting deep, philosophical, and analytical narratives.
          - Creator of "ShiPu AI", "Bengali News AI", and other high-tech modules.

          YOUR CONSTRAINTS:
          1. STRIKT PERSONA: Be professional, visionary, minimalist, and slightly futuristic.
          2. KNOWLEDGE DOMAIN: You ONLY answer questions about Chitron Bhattacharjee, his work, expertise, or the "Sig: 01" project.
          3. RESTRICTION: If asked a general knowledge question (e.g., "What is the capital of France?", "Solve this math problem", "Write generic code"), you MUST politely decline. 
          4. DECLINE RESPONSE: Say something like: "I am specifically architected to provide signals regarding Chitron Bhattacharjee's portfolio and vision. I cannot process general queries outside this domain."
          5. NO MOCKERY: Do not be rude, but be firm about your architecture.

          KNOWLEDGE BASE:
          The following information is retrieved from Chitron's profile and posts. Use it to provide accurate answers:
          ${knowledgeBase}

          TONE: Polite, concise, and helpful within your specific domain.`,
        }
      });

      setMessages((prev) => [...prev, { role: "model", parts: [{ text: response.text || "I was unable to process that signal." }] }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "model", parts: [{ text: "ShiPu AI was unable to process your request." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96 overflow-hidden rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl shadow-2xl shadow-blue-500/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-white/5 p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">ShiPu AI</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Lume v2o</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/50 hover:text-white transition-colors"
                id="close-ai"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Architect's Assistant</p>
                    <p className="text-[10px] text-white/20 italic">"I am here to decrypt the vision of Chitron Bhattacharjee."</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Who is Chitron?",
                      "Technical Stack",
                      "Political Vision",
                      "Recent Projects"
                    ].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col gap-1 max-w-[85%]",
                    msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl text-sm",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white/5 text-white/90 border border-white/10 rounded-tl-none markdown-body"
                    )}
                  >
                    <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-white/40 ml-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask something..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-white/20"
                  id="ai-input"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                  id="send-ai"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "bg-white text-black" : "bg-blue-600 text-white"
        )}
        id="toggle-ai"
      >
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
}

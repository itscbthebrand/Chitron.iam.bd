import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Clock, ExternalLink, Image as ImageIcon, Plus } from "lucide-react";
import { db } from "../contexts/FirebaseContext";
import { IKImage } from "imagekitio-react";
import { cn } from "../lib/utils";

interface Story {
  id: string;
  mediaUrl: string;
  createdAt: any;
}

interface Post {
  id: string;
  content: string;
  mediaUrl?: string;
  author: string;
  createdAt: any;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qPosts = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
    const qStories = query(collection(db, "stories"), orderBy("createdAt", "desc"), limit(10));

    const unsubPosts = onSnapshot(qPosts, (snaps) => {
      setPosts(snaps.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      setLoading(false);
    });

    const unsubStories = onSnapshot(qStories, (snaps) => {
      // Logic for 24h filter could be here or via query
      setStories(snaps.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story)));
    });

    return () => {
      unsubPosts();
      unsubStories();
    };
  }, []);

  return (
    <div className="space-y-12">
      {/* Stories Hook */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
        {stories.map((story) => (
          <motion.div
            key={story.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 w-28 h-48 rounded-[2rem] overflow-hidden border-2 border-white/5 p-0.5 bg-white/5 snap-start shadow-xl"
          >
            <div className="w-full h-full rounded-[1.8rem] overflow-hidden relative">
              <img src={story.mediaUrl} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 flex flex-col">
                <span className="text-[6px] text-white/40 uppercase font-black tracking-widest">Story node</span>
                <span className="text-[8px] text-white/80 font-bold">RECENT_SIG</span>
              </div>
            </div>
          </motion.div>
        ))}
        {stories.length === 0 && (
          <div className="flex-shrink-0 w-28 h-48 rounded-[2rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/10 gap-2">
            <Plus size={20} />
            <span className="text-[8px] uppercase font-black">No Signal</span>
          </div>
        )}
      </div>

      {/* Main Feed */}
      <div className="space-y-8">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.article
              key={post.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="group relative rounded-3xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all duration-500 overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">CB</div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">{post.author}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest font-medium">
                        <Clock size={10} />
                        <span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-white/20 hover:text-white transition-colors">
                    <ExternalLink size={16} />
                  </button>
                </div>

                <div className="text-sm md:text-base text-white/70 leading-relaxed font-light">
                  {post.content}
                </div>

                {post.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20">
                    <img src={post.mediaUrl} alt="Post media" className="w-full object-cover max-h-[500px]" />
                  </div>
                )}
              </div>
              
              <div className="px-8 py-4 bg-white/2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                   <span>/** Author: Chitron Bhattacharjee **/</span>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="py-20 flex flex-col items-center gap-4 text-white/20">
            <div className="w-8 h-8 rounded-full border-2 border-t-blue-500 border-white/5 animate-spin" />
            <span className="text-[10px] tracking-widest uppercase">Loading encrypted data</span>
          </div>
        )}
      </div>
    </div>
  );
}

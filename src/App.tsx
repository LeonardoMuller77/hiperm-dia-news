/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Menu, 
  Bell, 
  Share2, 
  Bookmark, 
  ChevronRight, 
  Clock, 
  TrendingUp, 
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import { fetchNews, NewsItem } from './services/newsService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIES = [
  "Geral",
  "Tecnologia",
  "Negócios",
  "Esportes",
  "Entretenimento",
  "Saúde",
  "Ciência"
];

export default function App() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Geral");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNews = async (category: string) => {
    setLoading(true);
    const data = await fetchNews(category);
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNews(selectedCategory);
  }, [selectedCategory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNews(selectedCategory);
    setIsRefreshing(false);
  };

  const filteredNews = useMemo(() => {
    if (!searchQuery) return news;
    return news.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [news, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Menu className="w-6 h-6 text-gray-600" />
          <div className="hipermidia-logo text-xl">
            hipermídia
            <span className="ml-1 text-xs font-normal not-italic opacity-80 uppercase tracking-widest">News</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="w-5 h-5 text-gray-600" />
          <div className="w-8 h-8 rounded-full bg-[#0056b3] flex items-center justify-center text-white text-xs font-bold">
            JD
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Pesquisar notícias..."
            className="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex overflow-x-auto hide-scrollbar px-4 py-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === cat 
                  ? "bg-[#0056b3] text-white shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0056b3]" />
            Principais Notícias
          </h2>
          <button 
            onClick={handleRefresh}
            className={cn("p-2 rounded-full hover:bg-gray-100 text-gray-500", isRefreshing && "animate-spin")}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse space-y-3">
                <div className="w-full h-40 bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <motion.div
              layoutId={item.id}
              key={item.id}
              onClick={() => setSelectedNews(item)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="relative h-48">
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-[#0056b3] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                  {item.category}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-gray-900 leading-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {item.summary}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="font-medium text-gray-600">{item.source}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400">
            Nenhuma notícia encontrada.
          </div>
        )}
      </main>

      {/* News Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div
              layoutId={selectedNews.id}
              className="bg-white w-full max-w-md h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
            >
              <div className="relative h-64 shrink-0">
                <img 
                  src={selectedNews.imageUrl} 
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="bg-[#0056b3] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase inline-block mb-2">
                    {selectedNews.category}
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {selectedNews.title}
                  </h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#0056b3]">
                      {selectedNews.source.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{selectedNews.source}</div>
                      <div className="text-[11px] text-gray-500">{selectedNews.timestamp}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100">
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#0056b3]/5 border-l-4 border-[#0056b3] p-4 rounded-r-xl">
                    <h4 className="text-xs font-bold text-[#0056b3] uppercase tracking-wider mb-2">Resumo IA</h4>
                    <ul className="space-y-2">
                      {selectedNews.bullets?.map((bullet, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-[#0056b3] font-bold">•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-gray-700 leading-relaxed markdown-body">
                    <Markdown>{selectedNews.fullContent}</Markdown>
                  </div>
                </div>

                <button className="w-full py-4 bg-gray-100 rounded-2xl text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  Ver notícia completa em {selectedNews.source}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between sticky bottom-0 z-30">
        <button className="flex flex-col items-center gap-1 text-[#0056b3]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0056b3] mb-0.5" />
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Feed</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Explorar</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <Bookmark className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Salvos</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Menu</span>
        </button>
      </nav>
    </div>
  );
}

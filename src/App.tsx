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
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareItem, setShareItem] = useState<NewsItem | null>(null);
  const [bookmarks, setBookmarks] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState("feed");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const loadNews = async (category: string, clearCache = false) => {
    setLoading(true);
    setError(null);
    if (clearCache) {
      sessionStorage.removeItem(`news_cache_${category}`);
    }
    const data = await fetchNews(category);
    if (data.length === 0) {
      setError("Não foi possível carregar as notícias no momento.");
    }
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadNews(selectedCategory);
  }, [selectedCategory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNews(selectedCategory, true);
    setIsRefreshing(false);
  };

  const filteredNews = useMemo(() => {
    let baseNews = activeTab === "salvos" ? bookmarks : news;
    if (!searchQuery) return baseNews;
    return baseNews.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [news, bookmarks, searchQuery, activeTab]);

  const toggleBookmark = (item: NewsItem) => {
    setBookmarks(prev => {
      const isBookmarked = prev.some(b => b.id === item.id);
      if (isBookmarked) {
        return prev.filter(b => b.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const handleShare = (item: NewsItem | null) => {
    if (item) {
      setShareItem(item);
    } else {
      // Share the app itself
      setShareItem({
        id: 'app',
        title: 'hipermídia News - Notícias com IA',
        summary: 'Confira as últimas notícias resumidas por inteligência artificial.',
        url: window.location.href,
        imageUrl: 'https://picsum.photos/seed/news-app/800/400',
        source: 'hipermídia News',
        category: 'App',
        timestamp: 'Agora',
        fullContent: 'Baixe o hipermídia News para ficar por dentro de tudo!',
        bullets: ['Resumos por IA', 'Notícias em tempo real', 'Categorias personalizadas']
      });
    }
    setIsShareModalOpen(true);
  };

  const shareToSocial = (platform: string) => {
    if (!shareItem) return;
    const url = encodeURIComponent(shareItem.url);
    const text = encodeURIComponent(shareItem.title);
    let shareUrl = "";

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing via web link like others.
        // We'll copy the link and redirect to Instagram.
        navigator.clipboard.writeText(shareItem.url);
        alert("Link copiado! Abra o Instagram para compartilhar.");
        shareUrl = `https://www.instagram.com/`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareItem.url);
        alert("Link copiado!");
        setIsShareModalOpen(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      setIsShareModalOpen(false);
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="hipermidia-logo text-xl">
                  hipermídia
                </div>
                <button onClick={() => setIsMenuOpen(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <button className="w-full text-left py-2 text-gray-700 font-medium hover:text-[#0056b3]">Perfil</button>
                <button className="w-full text-left py-2 text-gray-700 font-medium hover:text-[#0056b3]">Configurações</button>
                <button className="w-full text-left py-2 text-gray-700 font-medium hover:text-[#0056b3]">Sobre</button>
                <button className="w-full text-left py-2 text-gray-700 font-medium hover:text-[#0056b3]">Ajuda</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications Overlay */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed right-4 top-16 w-72 bg-white z-50 rounded-2xl shadow-2xl p-4 border border-gray-100"
            >
              <h3 className="font-bold text-gray-800 mb-3">Notificações</h3>
              <div className="space-y-3">
                <div className="text-xs text-gray-500 py-4 text-center">
                  Você não tem novas notificações.
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && shareItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-3xl p-6 max-w-md mx-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Compartilhar notícia</h3>
                <button onClick={() => setIsShareModalOpen(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-8">
                <button 
                  onClick={() => shareToSocial('whatsapp')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">WhatsApp</span>
                </button>
                
                <button 
                  onClick={() => shareToSocial('facebook')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-lg shadow-[#1877F2]/20">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Facebook</span>
                </button>

                <button 
                  onClick={() => shareToSocial('twitter')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white shadow-lg shadow-black/20">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">X / Twitter</span>
                </button>

                <button 
                  onClick={() => shareToSocial('instagram')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-lg shadow-[#ee2a7b]/20">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.848 0-3.204.012-3.584.07-4.849.149-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Instagram</span>
                </button>
              </div>

              <button 
                onClick={() => shareToSocial('copy')}
                className="w-full py-4 bg-gray-100 rounded-2xl text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Copiar link da notícia
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="hipermidia-logo text-xl">
            hipermídia
            <span className="ml-1 text-xs font-normal not-italic opacity-80 uppercase tracking-widest">News</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
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
            {activeTab === "salvos" ? (
              <>
                <Bookmark className="w-5 h-5 text-[#0056b3]" />
                Notícias Salvas
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 text-[#0056b3]" />
                Principais Notícias
              </>
            )}
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
                    <button 
                      onClick={() => toggleBookmark(selectedNews)}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        bookmarks.some(b => b.id === selectedNews.id)
                          ? "bg-[#0056b3] text-white"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleShare(selectedNews)}
                      className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100"
                    >
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

                <button 
                  onClick={() => openExternalLink(selectedNews.url)}
                  className="w-full py-4 bg-gray-100 rounded-2xl text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
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
        <button 
          onClick={() => setActiveTab("feed")}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === "feed" ? "text-[#0056b3]" : "text-gray-400 hover:text-gray-600")}
        >
          {activeTab === "feed" && <div className="w-1.5 h-1.5 rounded-full bg-[#0056b3] mb-0.5" />}
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Feed</span>
        </button>
        <button 
          onClick={() => setActiveTab("explorar")}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === "explorar" ? "text-[#0056b3]" : "text-gray-400 hover:text-gray-600")}
        >
          {activeTab === "explorar" && <div className="w-1.5 h-1.5 rounded-full bg-[#0056b3] mb-0.5" />}
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Explorar</span>
        </button>
        <button 
          onClick={() => setActiveTab("salvos")}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === "salvos" ? "text-[#0056b3]" : "text-gray-400 hover:text-gray-600")}
        >
          {activeTab === "salvos" && <div className="w-1.5 h-1.5 rounded-full bg-[#0056b3] mb-0.5" />}
          <Bookmark className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Salvos</span>
        </button>
        <button 
          onClick={() => handleShare(null)}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600"
        >
          <Share2 className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Enviar</span>
        </button>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Menu</span>
        </button>
      </nav>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Copy, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  LogOut, 
  Lock,
  Menu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { fetchPrompts, createPrompt, updatePrompt, deletePrompt } from './services/api';
import { Prompt } from './types';
import { ADMIN_PASSWORD, LOGO_URL, GOOGLE_SCRIPT_URL } from './constants';

// --- COMPONENTS ---

// Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md animate-fade-in-up ${
      type === 'success' 
        ? 'bg-green-500/20 border-green-500/50 text-green-200' 
        : 'bg-red-500/20 border-red-500/50 text-red-200'
    }`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// --- MAIN APP ---

const App: React.FC = () => {
  // State: Data
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State: Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginClickCount, setLoginClickCount] = useState(0);
  const [loginPassword, setLoginPassword] = useState('');
  
  // State: UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // State: Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // State: Active Item
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null); // For detail view or edit
  const [isEditing, setIsEditing] = useState(false); // Mode for form modal

  // State: Form Data
  const [formData, setFormData] = useState({ title: '', category: '', prompts: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial Load
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPrompts();
      setPrompts(data);
    } catch (err) {
      setError('Failed to load prompts. Check connection or API URL.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Logo Triple Click Logic
  useEffect(() => {
    if (loginClickCount === 0) return;
    const timer = setTimeout(() => setLoginClickCount(0), 500);
    if (loginClickCount >= 3) {
      setIsLoginModalOpen(true);
      setLoginClickCount(0);
    }
    return () => clearTimeout(timer);
  }, [loginClickCount]);

  // Filtering
  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.prompts.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, selectedCategory]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(prompts.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [prompts]);

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setLoginPassword('');
      showToast('Welcome, Admin!', 'success');
    } else {
      showToast('Invalid password', 'error');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    showToast('Logged out successfully', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Prompt copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  const openDetail = (prompt: Prompt) => {
    setCurrentPrompt(prompt);
    setIsDetailModalOpen(true);
  };

  const openAddForm = () => {
    setFormData({ title: '', category: '', prompts: '' });
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const openEditForm = (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPrompt(prompt);
    setFormData({ title: prompt.title, category: prompt.category, prompts: prompt.prompts });
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this prompt?")) return;
    
    setIsSubmitting(true);
    try {
      await deletePrompt(id);
      showToast('Prompt deleted', 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to delete', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing && currentPrompt) {
        await updatePrompt({ ...formData, id: currentPrompt.id, created_at: currentPrompt.created_at });
        showToast('Prompt updated successfully', 'success');
      } else {
        await createPrompt(formData);
        showToast('Prompt created successfully', 'success');
      }
      setIsFormModalOpen(false);
      loadData();
    } catch (err) {
      showToast('Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-20">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
            
            {/* Logo Area */}
            <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => setLoginClickCount(prev => prev + 1)}>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400/30 shadow-lg shadow-blue-500/20">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Bank Prompt</h1>
                <p className="text-xs text-blue-300">High Quality Prompt Library</p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search prompts..."
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="relative">
                 <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 w-full sm:w-40 bg-slate-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm cursor-pointer"
                >
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900 text-slate-200">{cat}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Menu size={16} />
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <button 
                    onClick={openAddForm}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-900/20"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* WARNING IF URL NOT SET */}
      {!GOOGLE_SCRIPT_URL && !loading && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
           <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-lg text-sm flex gap-3">
             <AlertCircle className="shrink-0" />
             <div>
               <strong>Demo Mode:</strong> Google Apps Script URL is missing in <code>constants.ts</code>. Using mock data. Backend features won't persist.
             </div>
           </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-blue-400">
            <Loader2 size={40} className="animate-spin" />
            <p className="text-sm font-medium animate-pulse">Syncing with database...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-64 gap-2 text-red-400">
            <AlertCircle size={40} />
            <p>{error}</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No prompts found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <div 
                key={prompt.id}
                onClick={() => openDetail(prompt)}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 backdrop-blur-sm rounded-xl p-5 transition-all duration-300 cursor-pointer flex flex-col h-full shadow-xl shadow-black/20 hover:shadow-blue-900/10 hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/20">
                    {prompt.category}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => openEditForm(prompt, e)}
                        className="p-1.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-300 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(prompt.id, e)}
                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-300 transition-colors">
                  {prompt.title}
                </h3>
                
                <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-grow font-light leading-relaxed">
                  {prompt.prompts}
                </p>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-blue-400 group-hover:underline">
                    Read more
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 py-8 mt-auto bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Bank Prompt. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Threads</a>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock size={20} className="text-blue-400" /> Admin Access
              </h2>
              <button onClick={() => setIsLoginModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && currentPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setIsDetailModalOpen(false)}>
          <div 
            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start gap-4 bg-slate-900 sticky top-0">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/20 mb-3">
                  {currentPrompt.category}
                </span>
                <h2 className="text-2xl font-bold text-white leading-tight">{currentPrompt.title}</h2>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="bg-slate-950/50 rounded-lg p-6 border border-white/5 relative group">
                <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed text-base">
                  {currentPrompt.prompts}
                </pre>
                
                <button 
                  onClick={() => copyToClipboard(currentPrompt.prompts)}
                  className="absolute top-4 right-4 p-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2"
                >
                  <Copy size={16} />
                  <span className="text-xs font-medium">Copy</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => copyToClipboard(currentPrompt.prompts)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors w-full sm:w-auto justify-center"
              >
                <Copy size={18} />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL (ADD/EDIT) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Edit Prompt' : 'New Prompt'}
              </h2>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., SEO Writer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    required
                    list="categories"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., Coding"
                  />
                  <datalist id="categories">
                    {uniqueCategories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Prompt Content</label>
                <textarea
                  required
                  value={formData.prompts}
                  onChange={(e) => setFormData({...formData, prompts: e.target.value})}
                  className="w-full min-h-[300px] flex-grow bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm leading-relaxed resize-y"
                  placeholder="Type your prompt here..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg shadow-blue-900/20"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isEditing ? 'Save Changes' : 'Create Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Plus, 
  Upload,
  BarChart3,
  Users,
  AlertCircle,
  Zap,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for Tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const queryClient = new QueryClient();

// --- API Client ---
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Auth Context ---
const AuthContext = React.createContext<{
  user: any;
  login: (data: any) => void;
  logout: () => void;
} | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => React.useContext(AuthContext)!;

// --- Components ---

function Button({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/20',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white'
  };
  return (
    <button 
      className={cn('px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none', variants[variant], className)} 
      {...props} 
    />
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={cn('w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all', className)} 
      {...props} 
    />
  );
}

// --- Pages ---

function LoginPage() {
  const [email, setEmail] = useState('admin@idap.ai');
  const [password, setPassword] = useState('admin123');
  const { login } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/login', data),
    onSuccess: (res) => {
      login(res.data);
      navigate('/');
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20">
            <Zap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">IDAP Enterprise</h1>
          <p className="text-slate-400 text-sm">Intelligent Data Annotation Platform</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ email, password }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full py-3" disabled={mutation.isPending}>
            {mutation.isPending ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Demo Credentials:<br/>
            Admin: admin@idap.ai / admin123<br/>
            Annotator: annotator@idap.ai / annotator123
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">IDAP</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/tasks" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
            <ClipboardList size={20} />
            <span>Tasks</span>
          </Link>
          {user.role === 'ADMIN' && (
            <>
              <Link to="/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
                <Users size={20} />
                <span>Team</span>
              </Link>
              <Link to="/stats" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors">
                <BarChart3 size={20} />
                <span>Analytics</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full flex items-center justify-center gap-2" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={18} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="font-semibold text-lg">System Overview</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Model Server Online
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => api.get('/stats').then(res => res.data), enabled: user.role === 'ADMIN' });
  const { data: tasks } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/tasks').then(res => res.data) });

  return (
    <div className="space-y-8">
      {user.role === 'ADMIN' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Tasks', value: stats.totalTasks, icon: ClipboardList, color: 'text-blue-500' },
            { label: 'Total Images', value: stats.totalImages, icon: BarChart3, color: 'text-indigo-500' },
            { label: 'Annotations', value: stats.totalAnnotations, icon: CheckCircle2, color: 'text-emerald-500' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-3 rounded-xl bg-slate-800', stat.color)}>
                  <stat.icon size={24} />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</h3>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Active Tasks</h3>
        {user.role === 'ADMIN' && (
          <Link to="/tasks/new">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              Create Task
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tasks?.map((task: any) => (
          <motion.div 
            key={task.id}
            layout
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{task.name}</h4>
                <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded text-slate-400 uppercase tracking-wider">
                  {task.images.length} Images
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-indigo-400 font-bold">
                      {Math.round((task.images.filter((img: any) => img.status === 'APPROVED' || img.status === 'ANNOTATED').length / task.images.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(task.images.filter((img: any) => img.status === 'APPROVED' || img.status === 'ANNOTATED').length / task.images.length) * 100}%` }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {JSON.parse(task.labels).map((l: string) => (
                    <span key={l} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-800 flex items-center justify-between">
              <div className="flex -space-x-2">
                {task.annotators.map((a: any) => (
                  <div key={a.id} title={a.email} className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                    {a.email[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <Link to={user.role === 'ADMIN' ? `/tasks/${task.id}` : `/annotate/${task.id}`}>
                <Button variant="secondary" className="text-xs py-1.5">
                  {user.role === 'ADMIN' ? 'Review' : 'Annotate'}
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CreateTaskPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [labels, setLabels] = useState('');
  const [selectedAnnotators, setSelectedAnnotators] = useState<string[]>([]);
  const [images, setImages] = useState<FileList | null>(null);

  const { data: annotators } = useQuery({ queryKey: ['annotators'], queryFn: () => api.get('/users/annotators').then(res => res.data) });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/tasks', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => navigate('/')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!images) return;
    const formData = new FormData();
    formData.append('name', name);
    labels.split(',').map(l => l.trim()).forEach(l => formData.append('labels', l));
    selectedAnnotators.forEach(id => formData.append('annotatorIds', id));
    Array.from(images).forEach(img => formData.append('images', img));
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Create New Task</h2>
        <p className="text-slate-400">Define your dataset and assign your team.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-2xl">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Task Name</label>
          <Input placeholder="e.g. Autonomous Driving - Traffic Signs" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Labels (comma separated)</label>
          <Input placeholder="cat, dog, bird" value={labels} onChange={e => setLabels(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Assign Annotators</label>
          <div className="grid grid-cols-2 gap-2">
            {annotators?.map((a: any) => (
              <label key={a.id} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer', selectedAnnotators.includes(a.id) ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400')}>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={selectedAnnotators.includes(a.id)} 
                  onChange={() => setSelectedAnnotators(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id])} 
                />
                <div className={cn('w-4 h-4 rounded border flex items-center justify-center', selectedAnnotators.includes(a.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700')}>
                  {selectedAnnotators.includes(a.id) && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-sm font-medium">{a.email}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Upload Images</label>
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-indigo-500 transition-colors cursor-pointer relative">
            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setImages(e.target.files)} required />
            <Upload className="text-slate-500 mb-2" size={32} />
            <p className="text-sm text-slate-400">{images ? `${images.length} files selected` : 'Click or drag images to upload'}</p>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="submit" className="flex-1" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function AnnotationWorkspace() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: task, isLoading } = useQuery({ 
    queryKey: ['task', taskId], 
    queryFn: () => api.get(`/tasks/${taskId}`).then(res => res.data) 
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDifficult, setIsDifficult] = useState(false);
  const [prelabel, setPrelabel] = useState<{ label: string, confidence: number } | null>(null);

  const images = useMemo(() => task?.images || [], [task]);
  const currentImage = images[currentIndex];

  // Fetch pre-label when image changes
  useEffect(() => {
    if (currentImage && currentImage.status === 'PENDING') {
      api.get(`/prelabel/${currentImage.id}`).then(res => setPrelabel(res.data));
    } else {
      setPrelabel(null);
    }
    setIsDifficult(false);
  }, [currentImage]);

  const annotateMutation = useMutation({
    mutationFn: (data: any) => api.post('/annotations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      if (currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
  });

  const handleAnnotate = (label: string, prelabelUsed = false) => {
    annotateMutation.mutate({
      imageId: currentImage.id,
      taskId: task.id,
      label,
      prelabelUsed,
      isDifficult
    });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!task) return;
      const labels = JSON.parse(task.labels);
      const key = parseInt(e.key);
      if (key >= 1 && key <= labels.length) {
        handleAnnotate(labels[key - 1]);
      }
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, currentIndex, images, isDifficult]);

  if (isLoading) return <div className="flex items-center justify-center h-full">Loading Workspace...</div>;
  if (!currentImage) return <div className="text-center py-20">No images in this task.</div>;

  const labels = JSON.parse(task.labels);
  const currentAnnotation = currentImage.annotations?.[0];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h2 className="font-bold text-xl">{task.name}</h2>
            <p className="text-xs text-slate-500">Image {currentIndex + 1} of {images.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="secondary" onClick={() => setCurrentIndex(prev => Math.min(images.length - 1, prev + 1))} disabled={currentIndex === images.length - 1}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Image Viewer */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative flex items-center justify-center group">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImage.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              src={currentImage.url} 
              className="max-w-full max-h-full object-contain"
              alt="Annotation Target"
            />
          </AnimatePresence>
          
          {currentImage.status !== 'PENDING' && (
            <div className="absolute top-6 left-6 px-4 py-2 bg-emerald-500/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
              ALREADY ANNOTATED: {currentAnnotation?.label}
            </div>
          )}

          {isDifficult && (
            <div className="absolute top-6 right-6 px-4 py-2 bg-rose-500/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2">
              <AlertCircle size={14} />
              DIFFICULT SAMPLE
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="w-80 flex flex-col gap-6">
          {/* Pre-label Card */}
          {prelabel && currentImage.status === 'PENDING' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-indigo-600/10 border border-indigo-500/50 p-6 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Zap size={48} />
              </div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap size={14} />
                AI Pre-label
              </h4>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{prelabel.label}</p>
                  <p className="text-xs text-indigo-300 mt-1">Confidence: {Math.round(prelabel.confidence * 100)}%</p>
                </div>
                <Button className="text-xs py-1.5 px-3 bg-indigo-500" onClick={() => handleAnnotate(prelabel.label, true)}>
                  Accept
                </Button>
              </div>
            </motion.div>
          )}

          {/* Labeling Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex-1 flex flex-col">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Select Label</h4>
            <div className="space-y-2 flex-1 overflow-y-auto pr-2">
              {labels.map((l: string, i: number) => (
                <button 
                  key={l}
                  onClick={() => handleAnnotate(l)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group',
                    currentAnnotation?.label === l 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                  )}
                >
                  <span className="font-medium">{l}</span>
                  <span className="text-[10px] font-bold opacity-50 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <button 
                onClick={() => setIsDifficult(!isDifficult)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-medium',
                  isDifficult ? 'bg-rose-600/10 border-rose-500 text-rose-500' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                )}
              >
                <AlertCircle size={16} />
                Mark as Difficult
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => api.get('/stats').then(res => res.data) });

  const chartData = [
    { name: 'Mon', count: 40 },
    { name: 'Tue', count: 30 },
    { name: 'Wed', count: 60 },
    { name: 'Thu', count: 45 },
    { name: 'Fri', count: 90 },
    { name: 'Sat', count: 20 },
    { name: 'Sun', count: 15 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-slate-400">Monitor annotation quality and throughput.</p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Download size={18} />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <h4 className="font-bold mb-6">Annotation Throughput (Weekly)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <h4 className="font-bold mb-6">Recent Activity</h4>
          <div className="space-y-4">
            {stats?.recentAnnotations.map((ann: any) => (
              <div key={ann.id} className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <img src={ann.image.url} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{ann.label}</p>
                  <p className="text-xs text-slate-500">{ann.annotator.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{new Date(ann.createdAt).toLocaleTimeString()}</p>
                  {ann.prelabelUsed && <span className="text-[10px] text-indigo-400 font-bold">AI ASSISTED</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App ---

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Dashboard />} />
        <Route path="/tasks/new" element={user.role === 'ADMIN' ? <CreateTaskPage /> : <Navigate to="/" />} />
        <Route path="/annotate/:taskId" element={<AnnotationWorkspace />} />
        <Route path="/stats" element={user.role === 'ADMIN' ? <AnalyticsPage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

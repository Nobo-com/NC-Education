import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Edit3, 
  Trash2, 
  Globe,
  Bell
} from 'lucide-react';
import { UserData, Course } from './types';

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [view, setView] = useState<'home' | 'studio' | 'mentors' | 'settings'>('home');
  const [courses, setCourses] = useState<Course[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('noboclass_user');
    if (saved) setUser(JSON.parse(saved));
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const { fetchAllCourses } = await import('./lib/githubDatabase');
    const data = await fetchAllCourses();
    setCourses(data || []);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  if (!user || user.role !== 'instructor') {
     return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-[10px_10px_0_0_#0f172a] text-center">
             <h2 className="text-3xl font-black mb-4">স্বাগতম এডু-পোর্টালে</h2>
             <p className="text-slate-500 mb-8 font-bold">অনুগ্রহ করে মেন্টর বা এডমিন একাউন্ট দিয়ে লগইন করুন।</p>
             <button onClick={() => {
                const mock = { name: 'এডমিন স্যার', email: 'admin@edu.com', role: 'instructor', mentors: [] };
                setUser(mock as any);
                localStorage.setItem('noboclass_user', JSON.stringify(mock));
                showToast('লগইন সফল!', 'success');
             }} className="w-full bg-indigo-600 text-white h-14 rounded-xl font-black">লগইন (ডেমো)</button>
          </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative pb-12">
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white border-b border-indigo-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Globe size={24}/></div>
              <span className="font-black text-xl tracking-tight">NC <span className="text-indigo-600">Education</span></span>
           </div>
           <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400"><Bell size={20}/></button>
              <div className="h-10 w-10 bg-slate-100 rounded-full overflow-hidden border-2 border-indigo-50">
                 {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Users size={20} className="m-auto mt-2 text-slate-300" />}
              </div>
           </div>
        </div>
      </nav>

      <main className="pt-24 px-4 max-w-7xl mx-auto min-h-screen">
         <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black italic">প্রতিষ্ঠান <span className="text-indigo-600">ড্যাশবোর্ড</span></h1>
                    <button onClick={() => setView('studio')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg">কোর্স স্টুডিও</button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
                       <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-1 text-indigo-600">আপনার কোর্সসমূহ</h3>
                       <p className="text-5xl font-black">{courses.filter(c => c.instructorEmail === user.email).length}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
                       <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest mb-1 text-emerald-600">মোট মেন্টর</h3>
                       <p className="text-5xl font-black">{user.mentors?.length || 0}</p>
                    </div>
                 </div>
              </motion.div>
            )}

            {view === 'studio' && <StudioView key="studio" user={user} courses={courses.filter(c => c.instructorEmail === user.email)} onRefresh={loadCourses} showToast={showToast} />}
         </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-[60] bg-white border-t px-6 py-3 flex justify-around">
         <button onClick={() => setView('home')} className={`p-2 ${view === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}><LayoutDashboard/></button>
         <button onClick={() => setView('studio')} className={`p-2 ${view === 'studio' ? 'text-indigo-600' : 'text-slate-400'}`}><Plus/></button>
         <button onClick={() => { setUser(null); localStorage.removeItem('noboclass_user'); }} className="p-2 text-rose-400"><LogOut/></button>
      </nav>
    </div>
  );
}

function StudioView({ user, courses, onRefresh, showToast }: { user: UserData, courses: Course[], onRefresh: () => void, showToast: any }) {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({ title: '', price: '', category: 'একাডেমিক' });

  const handleSave = async () => {
    const { publishCourse } = await import('./lib/githubDatabase');
    const res = await publishCourse({ ...editingCourse, instructor: user.name, instructorEmail: user.email } as Course);
    if (res.success) {
       showToast('কোর্স সফলভাবে সংরক্ষিত হয়েছে', 'success');
       onRefresh();
       setActiveTab('list');
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">কোর্স স্টুডিও</h2>
          <button onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')} className="text-indigo-600 font-bold">
             {activeTab === 'list' ? '+ নতুন কোর্স' : 'তালিকা দেখুন'}
          </button>
       </div>

       {activeTab === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {courses.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-2xl border-2 border-indigo-50 shadow-sm flex justify-between items-center">
                   <div>
                      <h4 className="font-bold">{c.title}</h4>
                      <p className="text-xs text-slate-400 italic">মূল্য: ৳{c.price}</p>
                   </div>
                   <button className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><Edit3 size={18}/></button>
                </div>
             ))}
          </div>
       ) : (
          <div className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-900 shadow-[10px_10px_0_0_#0f172a] space-y-6">
             <input value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-900 rounded-xl px-4 font-bold" placeholder="কোর্স টাইটেল" />
             <input value={editingCourse.price} onChange={e => setEditingCourse({...editingCourse, price: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-900 rounded-xl px-4 font-bold" placeholder="মূল্য (৳)" />
             <button onClick={handleSave} className="w-full h-16 bg-slate-900 text-white font-black rounded-xl shadow-[4px_4px_0_0_#6366f1]">সেভ করুন</button>
          </div>
       )}
    </div>
  );
}

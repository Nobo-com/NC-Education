import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, ShieldCheck, Star, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { InstructorApplication, UserData } from '../types';
import { fetchInstructorApplications, fetchUserList, updateApplicationStatus, updateUserField } from '../lib/githubDatabase';

export function AdminPanelView({ showToast, setLoader }: { showToast: any, setLoader: any }) {
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'users'>('applications');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoader({ show: true, msg: 'ডেটাবেস সিঙ্ক হচ্ছে...' });
    const [apps, userList] = await Promise.all([fetchInstructorApplications(), fetchUserList()]);
    setApplications(apps);
    setUsers(userList);
    setLoader({ show: false, msg: '' });
  };

  const handleApprove = async (app: InstructorApplication) => {
    setLoader({ show: true, msg: 'এপ্রুভাল প্রসেস হচ্ছে...' });
    
    await updateApplicationStatus(app.id, 'approved');
    
    const updates = [
      updateUserField(app.userEmail, 'role', 'instructor'),
      updateUserField(app.userEmail, 'instructorDetails', {
        institutionName: app.institutionName,
        tradeLicense: app.tradeLicense,
        officeAddress: app.officeAddress,
        nomineePhoto: app.nomineePhotoUrl,
        nidPhoto: app.nidPhotoUrl,
        website: app.website,
        contactNumber: app.contactNumber
      })
    ];
    
    await Promise.all(updates);
    showToast('ইনস্ট্রাক্টর এপ্রুভ হয়েছে!', 'success');
    loadData();
  };

  const handleStatusChange = async (email: string, field: string, value: any) => {
    setLoader({ show: true, msg: 'আপডেট হচ্ছে...' });
    await updateUserField(email, field, value);
    showToast('সফলভাবে আপডেট হয়েছে', 'success');
    loadData();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto py-12 px-4 min-h-[80vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
         <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 font-bold text-xs uppercase tracking-widest rounded-full">
               <ShieldAlert size={16} /> সিকিউর এডমিন প্যানেল
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">সেন্টরাল কন্ট্রোল</h2>
            <p className="text-slate-500 font-medium text-lg">আবেদন রিভিও, ইউজার ম্যানেজমেন্ট এবং ভেরিফিকেশন।</p>
         </div>
         <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('applications')} 
              className={`px-8 py-3 font-bold text-sm tracking-tight transition-all rounded-xl ${activeTab === 'applications' ? 'bg-white text-slate-900 shadow-ios-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              আবেদন ({applications.filter(a => a.status === 'pending').length})
            </button>
            <button 
              onClick={() => setActiveTab('users')} 
              className={`px-8 py-3 font-bold text-sm tracking-tight transition-all rounded-xl ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-ios-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              ইউজারস
            </button>
         </div>
      </div>

      {activeTab === 'applications' ? (
        <div className="grid gap-8">
           {applications.filter(a => a.status === 'pending').map(app => (
             <div key={app.id} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-ios-md border border-slate-100">
                <div className="grid lg:grid-cols-12 gap-10 items-start">
                   <div className="lg:col-span-8 flex flex-col md:flex-row gap-8">
                      <div className="h-32 w-32 bg-slate-100 rounded-3xl shrink-0 overflow-hidden border border-slate-100 shadow-ios-sm">
                         {app.nomineePhotoUrl ? <img src={app.nomineePhotoUrl} className="w-full h-full object-cover" /> : <User size={40} className="p-8 text-slate-200" />}
                      </div>
                      <div className="space-y-6 flex-grow">
                         <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{app.institutionName}</h3>
                            <div className="flex items-center gap-3">
                               <span className="bg-slate-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full">{app.userName}</span>
                               <span className="text-slate-400 font-bold text-xs">{app.userEmail}</span>
                            </div>
                         </div>
                         <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">যোগাযোগ</p><p className="font-bold text-slate-800">{app.contactNumber}</p></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ঠিকানা</p><p className="font-bold text-slate-600 line-clamp-2">{app.officeAddress}</p></div>
                         </div>
                         <div className="flex gap-4 items-end">
                            <div className="space-y-2">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">NID প্রিভিউ</p>
                               <div className="h-20 w-32 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 cursor-zoom-in group shadow-ios-sm">
                                  <img src={app.nidPhotoUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                               </div>
                            </div>
                            <div className="space-y-1 pb-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ট্রেড লাইসেন্স</p>
                               <p className="font-black text-slate-900 uppercase text-xs">{app.tradeLicense || 'নাই'}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="lg:col-span-4 flex flex-col gap-3">
                      <button onClick={() => handleApprove(app)} className="ios-btn-primary w-full py-4 text-sm font-black">এপ্রুভ করুন</button>
                      <button onClick={async () => {
                        await updateApplicationStatus(app.id, 'rejected');
                        showToast('আবেদন বাতিল করা হয়েছে', 'info');
                        loadData();
                      }} className="ios-btn-secondary w-full py-4 text-sm font-black text-rose-500 border-rose-100 hover:bg-rose-50">বাতিল করুন</button>
                   </div>
                </div>
             </div>
           ))}
           {applications.filter(a => a.status === 'pending').length === 0 && (
             <div className="text-center py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] italic text-slate-300 font-bold">
                কোনো পেন্ডিং আবেদন পাওয়া যায়নি
             </div>
           )}
        </div>
      ) : (
        <div className="grid gap-6">
           {users.map(u => (
             <div key={u.email} className={`bg-white rounded-[2rem] p-6 shadow-ios-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${u.isBanned ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex items-center gap-6">
                   <div className="relative">
                      <div className="h-16 w-16 bg-slate-900 rounded-2xl overflow-hidden shadow-ios-sm">
                         <img src={u.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u.email}`} className="w-full h-full object-cover" />
                      </div>
                      {u.isInstructorVerified && (
                        <div className="absolute -top-2 -right-2 h-7 w-7 bg-blue-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-ios-sm">
                           <ShieldCheck size={14} />
                        </div>
                      )}
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{u.name}</h4>
                      <div className="flex flex-wrap items-center gap-3">
                         <span className={`px-3 py-1 font-black text-[9px] uppercase tracking-widest rounded-full ${u.role === 'admin' ? 'bg-rose-500 text-white' : u.role === 'instructor' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{u.role}</span>
                         <span className="text-slate-400 font-bold text-xs">{u.email}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   {u.role === 'instructor' && (
                     <button 
                       onClick={() => handleStatusChange(u.email, 'isInstructorVerified', !u.isInstructorVerified)}
                       className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${u.isInstructorVerified ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                       title="টগল ভেরিফিকেশন"
                     >
                        <Star size={20} className={u.isInstructorVerified ? 'fill-current' : ''} />
                     </button>
                   )}
                   <button 
                     onClick={() => handleStatusChange(u.email, 'isBanned', !u.isBanned)}
                     className={`px-8 py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all ${u.isBanned ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'}`}
                   >
                      {u.isBanned ? 'আনব্যান' : 'ব্যান করুন'}
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}
    </motion.div>
  );
}

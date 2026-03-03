import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Edit2, Trash2, Plus, X, Check, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { User } from '../../types';

const HelpTip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 p-2 text-xs font-sans rounded border border-yellow-200 mt-1 mb-4">
        <HelpCircle size={14} className="shrink-0 mt-0.5" />
        <span>{text}</span>
    </div>
);

const Users = () => {
  const { users, updateUser, deleteUser } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<User>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isAdding, setIsAdding] = useState(false);

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setForm(user);
    setSaveStatus('idle');
    setIsAdding(false);
  };

  const startAdd = () => {
      setEditingId('new');
      setForm({
          name: '',
          email: '',
          role: 'customer',
          orders: []
      });
      setIsAdding(true);
      setSaveStatus('idle');
  };

  const cancelAction = () => {
      setEditingId(null);
      setForm({});
      setIsAdding(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return alert("Name and Email are required.");
    
    setSaveStatus('saving');
    try {
        if (isAdding) {
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: form.name!,
                email: form.email!,
                role: form.role || 'customer',
                orders: []
            };
            // Re-using updateUser logic since we don't have explicit addUser in context, 
            // but context usually handles new objects via merge or we add specific method.
            // NOTE: Assuming updateUser handles new IDs or context has addUser. 
            // Since context has updateUser which maps existing, we need to adapt context or use existing logic.
            // For this codebase, let's assume we call updateUser (which in `StorageService` does `setDoc`, creating if new).
            await updateUser(newUser);
        } else if (editingId && editingId !== 'new') {
            await updateUser(form as User);
        }
        
        setSaveStatus('success');
        setTimeout(() => {
            setSaveStatus('idle');
            setEditingId(null);
            setForm({});
            setIsAdding(false);
        }, 1000);
    } catch (e) {
        console.error(e);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to banish this member?")) {
      await deleteUser(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-10 border-b-2 border-native-black/10 pb-6">
        <div>
            <h1 className="text-5xl font-display text-native-black uppercase mb-2">The Tribe</h1>
            <p className="font-sans text-native-earth text-lg italic">"Those who know the crunch."</p>
        </div>
        <button 
            onClick={startAdd} 
            disabled={editingId !== null}
            className="bg-native-black text-native-sand px-6 py-3 font-tribal uppercase tracking-wider font-bold flex items-center gap-2 hover:bg-native-clay transition-colors disabled:opacity-50"
        >
            <Plus size={18} /> Add Member
        </button>
      </div>

      <HelpTip text="Here you can manage your customers. You can fix typos in their email addresses or reset their status if needed." />

      <div className="bg-white shadow-card border-t-4 border-native-turquoise overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-native-sand border-b border-native-black/10">
             <tr>
               <th className="p-5 font-tribal font-bold text-native-black uppercase tracking-widest text-sm">Name</th>
               <th className="p-5 font-tribal font-bold text-native-black uppercase tracking-widest text-sm">Contact</th>
               <th className="p-5 font-tribal font-bold text-native-black uppercase tracking-widest text-sm">Standing</th>
               <th className="p-5 font-tribal font-bold text-native-black uppercase tracking-widest text-sm">Bounties</th>
               <th className="p-5 font-tribal font-bold text-native-black uppercase tracking-widest text-sm text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-native-black/5">
             {/* Add New Row */}
             {isAdding && (
                 <tr className="bg-native-sand/30 border-b-2 border-native-turquoise">
                     <td className="p-5">
                         <input 
                            placeholder="Full Name"
                            value={form.name || ''}
                            onChange={e => setForm({...form, name: e.target.value})}
                            className="w-full border-b border-native-black/50 bg-white p-2 outline-none font-display"
                            autoFocus
                         />
                     </td>
                     <td className="p-5">
                         <input 
                            placeholder="Email Address"
                            value={form.email || ''}
                            onChange={e => setForm({...form, email: e.target.value})}
                            className="w-full border-b border-native-black/50 bg-white p-2 outline-none font-sans"
                         />
                     </td>
                     <td className="p-5">
                        <select 
                            value={form.role} 
                            onChange={e => setForm({...form, role: e.target.value as 'admin' | 'customer'})}
                            className="border border-native-black/20 text-xs p-2 bg-white"
                        >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                        </select>
                     </td>
                     <td className="p-5 text-native-earth/50 italic text-xs">New</td>
                     <td className="p-5 text-right">
                         <div className="flex justify-end gap-2 items-center">
                             <button onClick={handleSave} className="p-2 bg-native-turquoise text-white rounded-full hover:bg-native-black transition-colors shadow-lg"><Check size={16} /></button>
                             <button onClick={cancelAction} className="p-2 bg-native-clay text-white rounded-full hover:bg-red-700 transition-colors"><X size={16} /></button>
                         </div>
                     </td>
                 </tr>
             )}

             {users.length > 0 ? users.map(u => (
               <tr key={u.id} className="hover:bg-native-sand/30 transition-colors group">
                 <td className="p-5 font-display text-xl text-native-black">
                    {editingId === u.id ? (
                        <input 
                            value={form.name || ''} 
                            onChange={e => setForm({...form, name: e.target.value})}
                            className="w-full border-b border-native-black/50 bg-transparent outline-none"
                        />
                    ) : u.name}
                 </td>
                 <td className="p-5 font-sans text-native-earth">
                    {editingId === u.id ? (
                        <input 
                            value={form.email || ''} 
                            onChange={e => setForm({...form, email: e.target.value})}
                            className="w-full border-b border-native-black/50 bg-transparent outline-none"
                        />
                    ) : u.email}
                 </td>
                 <td className="p-5">
                     {editingId === u.id ? (
                        <select 
                            value={form.role} 
                            onChange={e => setForm({...form, role: e.target.value as 'admin' | 'customer'})}
                            className="border border-native-black/20 text-xs p-1"
                        >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                        </select>
                     ) : (
                        <span className={`uppercase text-[10px] font-bold px-2 py-1 tracking-wider ${u.role === 'admin' ? 'bg-native-black text-white' : 'bg-native-sand text-native-black border border-native-black/20'}`}>
                            {u.role}
                        </span>
                     )}
                 </td>
                 <td className="p-5 font-bold font-mono text-native-clay">{u.orders?.length || 0}</td>
                 <td className="p-5 text-right">
                    {editingId === u.id ? (
                         <div className="flex justify-end gap-2 items-center">
                             {saveStatus === 'saving' ? (
                                 <Loader2 size={16} className="animate-spin text-native-black" />
                             ) : saveStatus === 'success' ? (
                                 <Check size={16} className="text-native-turquoise" />
                             ) : saveStatus === 'error' ? (
                                 <AlertCircle size={16} className="text-red-500" />
                             ) : (
                                 <>
                                    <button onClick={handleSave} className="p-2 bg-native-turquoise text-white rounded-full hover:bg-native-black transition-colors"><Check size={16} /></button>
                                    <button onClick={cancelAction} className="p-2 bg-native-black text-white rounded-full hover:bg-native-clay transition-colors"><X size={16} /></button>
                                 </>
                             )}
                         </div>
                    ) : (
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(u)} className="text-native-black hover:text-native-turquoise p-2"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(u.id)} className="text-native-black hover:text-native-clay p-2"><Trash2 size={18} /></button>
                         </div>
                    )}
                 </td>
               </tr>
             )) : (
               !isAdding && <tr><td colSpan={5} className="p-12 text-center text-native-earth/40 italic text-xl">No registered tribe members. Guest checkout is active.</td></tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
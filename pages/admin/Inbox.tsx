import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Mail, Trash2, HelpCircle } from 'lucide-react';

const HelpTip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 p-2 text-xs font-sans rounded border border-yellow-200 mt-2 mb-6">
        <HelpCircle size={14} className="shrink-0 mt-0.5" />
        <span>{text}</span>
    </div>
);

const Inbox = () => {
  const { messages, deleteMessage } = useStore();

  return (
    <div>
      <div className="mb-10 border-b-2 border-native-black/10 pb-6">
        <h1 className="text-5xl font-display text-native-black uppercase mb-2">Messenger</h1>
        <p className="font-sans text-native-earth text-lg italic">"Voices from afar."</p>
      </div>

      <HelpTip text="These are messages from the Contact Us page on your website." />

      <div className="grid grid-cols-1 gap-6">
        {messages.length === 0 ? (
           <div className="p-12 text-center border-4 border-dashed border-native-black/10 bg-native-sand/30 rounded-lg">
             <Mail size={48} className="mx-auto text-native-black/20 mb-4" />
             <p className="font-display text-2xl text-native-black/40 uppercase">No new missives.</p>
           </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="bg-white p-6 shadow-card border-l-4 border-native-clay relative group">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-xl text-native-black">{msg.name}</h3>
                    <a href={`mailto:${msg.email}`} className="text-native-clay hover:text-native-turquoise font-sans text-sm">{msg.email}</a>
                  </div>
                  <span className="font-mono text-xs text-native-earth/50">{new Date(msg.createdAt).toLocaleDateString()}</span>
               </div>
               <p className="font-sans text-native-black/80 leading-relaxed bg-native-sand/20 p-4 rounded-sm border border-native-black/5">
                 {msg.message}
               </p>
               
               <button onClick={() => {
                 if (window.confirm('Are you sure you want to delete this message?')) {
                   deleteMessage(msg.id);
                 }
               }} title="Delete message" className="absolute top-4 right-4 text-native-black/20 hover:text-native-clay transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={18} />
               </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Inbox;
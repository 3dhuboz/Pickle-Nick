import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Category } from '../../types';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Sparkles, Loader2, Wand2, AlertTriangle, RotateCcw, Check, Package, Grid, AlertCircle, HelpCircle, Search, Filter } from 'lucide-react';
import { generateProductDescription, generateProductImage, generateCategoryImage } from '../../services/geminiService';

const HelpTip = ({ text }: { text: string }) => (
    <div className="flex items-start gap-3 bg-blue-50 text-blue-700 p-4 text-sm rounded-xl border border-blue-100 mb-6">
        <HelpCircle size={18} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">{text}</span>
    </div>
);

const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct, categories, addCategory, updateCategory, deleteCategory, settings } = useStore();
  const [viewMode, setViewMode] = useState<'products' | 'categories'>('products');

  // --- PRODUCT STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // --- CATEGORY STATE ---
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<Partial<Category>>({});
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catSaveStatus, setCatSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const lowStockThreshold = settings.lowStockThreshold || 10;

  // --- PRODUCT LOGIC ---
  const originalData = useMemo(() => {
    if (editingId) return products.find(p => p.id === editingId);
    return null;
  }, [editingId, products]);

  const hasChanges = useMemo(() => {
    if (isAdding) return !!form.name && (form.name.length > 0) && (form.price !== undefined);
    if (editingId && originalData) {
      return (
        form.name !== originalData.name ||
        form.description !== originalData.description ||
        form.price !== originalData.price ||
        form.stock !== originalData.stock ||
        form.category !== originalData.category ||
        form.image !== originalData.image ||
        form.featured !== originalData.featured
      );
    }
    return false;
  }, [form, isAdding, editingId, originalData]);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ ...p });
    setIsAdding(false);
    setSaveStatus('idle');
  };

  const startAdd = () => {
    setEditingId(null);
    setForm({
      name: '', description: '', price: 0, stock: 0, category: 'Pickles', featured: false, 
      image: 'https://images.unsplash.com/photo-1599951681282-3d7c49b6b7a2?auto=format&fit=crop&w=1000&q=80'
    });
    setIsAdding(true);
    setSaveStatus('idle');
  };

  const cancelAction = () => {
      setIsAdding(false);
      setEditingId(null);
      setForm({});
      setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaveStatus('saving');
    try {
        if (isAdding) {
          const newProduct: Product = { 
              ...form, 
              price: parseFloat(form.price as any) || 0,
              stock: parseInt(form.stock as any) || 0,
              id: `prod-${Date.now()}` 
          } as Product;
          await addProduct(newProduct);
          setSaveStatus('success');
          // Delay closing so user sees success feedback
          setTimeout(() => {
              setIsAdding(false);
              setForm({});
              setSaveStatus('idle');
          }, 1000);
        } else if (editingId && originalData) {
          const updatedProduct: Product = { 
              ...originalData, 
              ...form, 
              price: parseFloat(form.price as any) || 0,
              stock: parseInt(form.stock as any) || 0,
              id: editingId 
          } as Product;
          await updateProduct(updatedProduct);
          setSaveStatus('success');
          setTimeout(() => {
              setEditingId(null);
              setForm({});
              setSaveStatus('idle');
          }, 1000);
        }
    } catch (error: any) {
        console.error("Failed to save provision:", error);
        if (error.message && error.message.includes('quota')) {
            alert(error.message);
        }
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // --- CATEGORY LOGIC ---
  const startEditCat = (c: Category) => {
      setCatEditingId(c.id);
      setCatForm({ ...c });
      setIsAddingCat(false);
      setCatSaveStatus('idle');
  };
  const startAddCat = () => {
      setCatEditingId(null);
      setCatForm({ name: '', description: '', image: '' });
      setIsAddingCat(true);
      setCatSaveStatus('idle');
  };
  const cancelCatAction = () => {
      setIsAddingCat(false);
      setCatEditingId(null);
      setCatForm({});
      setCatSaveStatus('idle');
  };
  const handleSaveCat = async () => {
      if (!catForm.name) return;
      setCatSaveStatus('saving');
      try {
          if (isAddingCat) {
              await addCategory({ ...catForm, id: `cat_${catForm.name.toLowerCase().replace(/\s+/g, '_')}` } as Category);
              setCatSaveStatus('success');
              setTimeout(() => {
                  setIsAddingCat(false);
                  setCatForm({});
                  setCatSaveStatus('idle');
              }, 1000);
          } else if (catEditingId) {
              await updateCategory({ ...catForm, id: catEditingId } as Category);
              setCatSaveStatus('success');
              setTimeout(() => {
                  setCatEditingId(null);
                  setCatForm({});
                  setCatSaveStatus('idle');
              }, 1000);
          }
      } catch (e: any) {
          console.error(e);
          if (e.message && e.message.includes('quota')) {
              alert(e.message);
          }
          setCatSaveStatus('error');
          setTimeout(() => setCatSaveStatus('idle'), 3000);
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-6 sticky top-0 bg-[#f8f5f2]/95 backdrop-blur-sm z-10 pt-4">
        <div>
            <h1 className="text-3xl font-display text-native-black mb-2">Inventory</h1>
            <p className="text-gray-500 text-sm">
                {viewMode === 'products' ? "Manage your product catalog." : "Organize products into collections."}
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
             {/* View Toggle */}
             <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                 <button 
                    onClick={() => setViewMode('products')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'products' ? 'bg-native-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                 >
                     <Package size={16}/> Products
                 </button>
                 <button 
                    onClick={() => setViewMode('categories')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'categories' ? 'bg-native-black text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                 >
                     <Grid size={16}/> Categories
                 </button>
             </div>

            {(isAdding || editingId) ? (
                <div className="flex gap-2">
                    <button onClick={cancelAction} disabled={saveStatus !== 'idle'} className="bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-50 border border-gray-200 transition-colors disabled:opacity-50">
                        <RotateCcw size={16} /> Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={!hasChanges || (saveStatus !== 'idle' && saveStatus !== 'success')} 
                        className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all min-w-[100px] justify-center
                        ${hasChanges && saveStatus === 'idle' ? 'bg-native-clay text-white hover:bg-native-clay/90' : ''}
                        ${saveStatus === 'idle' && !hasChanges ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : ''}
                        ${saveStatus === 'saving' ? 'bg-native-black text-white cursor-wait' : ''}
                        ${saveStatus === 'success' ? 'bg-green-500 text-white cursor-default' : ''}
                        ${saveStatus === 'error' ? 'bg-red-500 text-white cursor-default' : ''}
                        `}
                    >
                        {saveStatus === 'idle' && <><Save size={16} /> Save</>}
                        {saveStatus === 'saving' && <><Loader2 size={16} className="animate-spin" /> Saving...</>}
                        {saveStatus === 'success' && <><Check size={16} /> Saved</>}
                        {saveStatus === 'error' && <><AlertCircle size={16} /> Error</>}
                    </button>
                </div>
            ) : (isAddingCat || catEditingId) ? (
                 <div className="flex gap-2">
                    <button onClick={cancelCatAction} disabled={catSaveStatus !== 'idle'} className="bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-50 border border-gray-200 transition-colors disabled:opacity-50">
                        <RotateCcw size={16} /> Cancel
                    </button>
                    <button 
                        onClick={handleSaveCat} 
                        disabled={!catForm.name || (catSaveStatus !== 'idle' && catSaveStatus !== 'success')} 
                        className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all min-w-[100px] justify-center
                        ${catForm.name && catSaveStatus === 'idle' ? 'bg-native-clay text-white hover:bg-native-clay/90' : ''}
                        ${catSaveStatus === 'idle' && !catForm.name ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : ''}
                        ${catSaveStatus === 'saving' ? 'bg-native-black text-white cursor-wait' : ''}
                        ${catSaveStatus === 'success' ? 'bg-green-500 text-white cursor-default' : ''}
                        ${catSaveStatus === 'error' ? 'bg-red-500 text-white cursor-default' : ''}
                        `}
                    >
                        {catSaveStatus === 'idle' && <><Save size={16} /> Save</>}
                        {catSaveStatus === 'saving' && <><Loader2 size={16} className="animate-spin" /> Saving...</>}
                        {catSaveStatus === 'success' && <><Check size={16} /> Saved</>}
                        {catSaveStatus === 'error' && <><AlertCircle size={16} /> Error</>}
                    </button>
                </div>
            ) : (
                <button 
                    onClick={viewMode === 'products' ? startAdd : startAddCat} 
                    className="bg-native-black text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <Plus size={16} /> {viewMode === 'products' ? "Add Product" : "Add Category"}
                </button>
            )}
        </div>
      </div>

      <HelpTip text="Add new pickles or sauces here. Use the 'Categories' tab to organize them. Don't forget to update the stock count when you make a new batch!" />

      {viewMode === 'products' ? (
          <>
            {isAdding && (
                <div className="bg-white p-8 shadow-sm rounded-2xl border border-gray-100 mb-10 relative animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-display text-xl text-native-black">New Product Details</h3>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">Unsaved Draft</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
                        <div className="w-full md:w-48 aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden relative flex items-center justify-center">
                            {form.image ? <img src={form.image} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={32} />}
                        </div>
                        <div className="flex-1 w-full"><ProductForm form={form} setForm={setForm} categories={categories} /></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {products.map(p => {
                    const isLowStock = p.stock <= lowStockThreshold;
                    const isEditingThis = editingId === p.id;
                    const displayImage = isEditingThis && form.image ? form.image : p.image;
                    
                    return (
                <div key={p.id} className={`bg-white shadow-sm rounded-2xl border flex flex-col md:flex-row group hover:shadow-md transition-all duration-200 overflow-hidden ${isEditingThis ? 'border-native-black ring-1 ring-native-black' : isLowStock ? 'border-red-200' : 'border-gray-100'}`}>
                    <div className="w-full md:w-48 relative overflow-hidden bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 min-h-[12rem]">
                        <img src={displayImage} alt={p.name} className={`w-full h-full object-cover transition-all duration-500 ${isEditingThis ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} />
                        {isEditingThis && <div className="absolute bottom-0 w-full bg-native-black/80 text-white text-center text-xs font-medium py-1">Editing</div>}
                    </div>
                    
                    {isEditingThis ? (
                    <div className="flex-1 p-6 bg-gray-50/50">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <span className="text-sm font-semibold text-gray-900">Editing Mode</span>
                        </div>
                        <ProductForm form={form} setForm={setForm} categories={categories} />
                    </div>
                    ) : (
                    <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-start gap-6 relative">
                        {isLowStock && <div className="absolute top-4 right-4 flex items-center gap-1 text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-lg border border-red-100"><AlertTriangle size={14} /> Low Stock</div>}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2"><h3 className="font-display text-xl text-native-black">{p.name}</h3></div>
                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{p.category}</span>
                            <p className="text-gray-500 mt-3 font-sans text-sm leading-relaxed max-w-2xl">{p.description}</p>
                            <div className="mt-6 flex items-center gap-4 text-sm">
                                <span className="font-medium text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">Price: ${p.price}</span>
                                <span className={`font-medium px-3 py-1.5 rounded-lg border ${isLowStock ? 'text-red-700 border-red-100 bg-red-50' : 'text-gray-700 border-gray-100 bg-gray-50'}`}>Stock: {p.stock}</span>
                                {p.featured && <span className="flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-lg border border-amber-100"><Sparkles size={12} /> Featured</span>}
                            </div>
                        </div>
                        <div className="flex gap-2 self-start md:self-center mt-4 md:mt-0">
                            <button onClick={() => startEdit(p)} disabled={isAdding || (editingId !== null && editingId !== p.id)} className="p-2 text-gray-400 hover:text-native-black hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Edit2 size={18} /></button>
                            <button onClick={() => deleteProduct(p.id)} disabled={isAdding || (editingId !== null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 size={18} /></button>
                        </div>
                    </div>
                    )}
                </div>
                )})}
            </div>
          </>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* New Category Form (Visible when adding) */}
             {isAddingCat && (
                 <div className="md:col-span-2 bg-white p-8 shadow-sm rounded-2xl border border-gray-100 mb-6 animate-in fade-in">
                      <h3 className="font-display text-xl text-native-black mb-6">New Collection</h3>
                      <div className="flex gap-8">
                           <div className="w-1/3 aspect-video bg-gray-50 border border-gray-200 rounded-xl overflow-hidden relative flex items-center justify-center">
                                {catForm.image ? <img src={catForm.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={32}/>}
                           </div>
                           <div className="flex-1">
                               <CategoryForm form={catForm} setForm={setCatForm} />
                           </div>
                      </div>
                 </div>
             )}

             {/* Existing Categories */}
             {categories.map(c => {
                 const isEditing = catEditingId === c.id;
                 const displayImage = isEditing && catForm.image ? catForm.image : c.image;

                 return (
                     <div key={c.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col group hover:shadow-md transition-all overflow-hidden">
                          {isEditing ? (
                              <div className="p-6 bg-gray-50/50 border-b border-native-clay">
                                   <div className="flex gap-4 mb-4">
                                      <div className="w-24 aspect-video bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0">
                                         <img src={displayImage} className="w-full h-full object-cover" />
                                      </div>
                                      <h3 className="font-display text-lg text-native-black pt-1">Editing: {c.name}</h3>
                                   </div>
                                   <CategoryForm form={catForm} setForm={setCatForm} />
                              </div>
                          ) : (
                              <>
                                <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                                    <img src={c.image} alt={c.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                        <h3 className="font-display text-2xl text-white tracking-wide drop-shadow-md">{c.name}</h3>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <p className="text-gray-500 font-sans text-sm mb-6 flex-1">{c.description || "No description provided."}</p>
                                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                                        <button onClick={() => startEditCat(c)} disabled={isAddingCat || (catEditingId !== null)} className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-native-black hover:bg-gray-50 rounded-lg transition-colors text-xs font-medium disabled:opacity-30"><Edit2 size={14}/> Edit</button>
                                        <button onClick={() => deleteCategory(c.id)} disabled={isAddingCat || (catEditingId !== null)} className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium disabled:opacity-30"><Trash2 size={14}/> Delete</button>
                                    </div>
                                </div>
                              </>
                          )}
                     </div>
                 );
             })}
          </div>
      )}
    </div>
  );
};

const ProductForm = ({ form, setForm, categories }: any) => {
    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);

    const handleGenerateDesc = async () => {
        if (!form.name) return alert("Please enter a product name first.");
        setLoadingAI(true);
        try {
            const desc = await generateProductDescription(form.name, form.category || 'Pickles');
            setForm({...form, description: desc});
        } catch(e) { console.error(e); }
        setLoadingAI(false);
    };

    const handleGenerateImage = async () => {
        if (!form.name) return alert("Please enter a product name first.");
        const descPrompt = form.description ? form.description : form.name;
        
        setLoadingImage(true);
        try {
            const image = await generateProductImage(form.name, form.category || 'Pickles', descPrompt);
            setForm({...form, image});
        } catch(e) { console.error(e); }
        setLoadingImage(false);
    }

    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Item Name</label>
            <input 
                value={form.name || ''} 
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all font-medium"
                placeholder="Product Name"
            />
        </div>
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
            <select 
                value={form.category || ''} 
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all bg-white"
            >
                <option value="">Select Category...</option>
                {categories && categories.map((c: Category) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                {!categories.find((c: Category) => c.name === form.category) && form.category && (
                    <option value={form.category}>{form.category} (Custom)</option>
                )}
            </select>
        </div>
        <div className="md:col-span-2 relative">
            <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-gray-500">Description</label>
                <button onClick={handleGenerateDesc} disabled={loadingAI} className="text-native-clay hover:text-native-clay/80 text-xs font-medium flex items-center gap-1 transition-colors">
                    {loadingAI ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} AI Describe
                </button>
            </div>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none h-24 font-sans resize-none" />
        </div>
        <div className="md:col-span-2">
             <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-gray-500">Image URL / Base64 Data</label>
                <button onClick={handleGenerateImage} disabled={loadingImage} className="text-native-clay hover:text-native-clay/80 text-xs font-medium flex items-center gap-1 transition-colors">
                    {loadingImage ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12} />} AI Visualize
                </button>
             </div>
             <div className="flex gap-2">
                 <input value={form.image || ''} onChange={e => setForm({...form, image: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-mono truncate focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all" placeholder="https://..." />
                 <div className="w-10 h-10 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {form.image ? <img src={form.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" />}
                 </div>
             </div>
        </div>
        <div className="flex gap-6 items-center">
            <label className="block"><span className="block text-xs font-medium text-gray-500 mb-1.5">Price</span><input type="number" step="0.01" value={form.price ?? ''} onChange={e => setForm({...form, price: e.target.value})} className="w-24 p-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none" /></label>
            <label className="block"><span className="block text-xs font-medium text-gray-500 mb-1.5">Stock</span><input type="number" value={form.stock ?? ''} onChange={e => setForm({...form, stock: e.target.value})} className="w-24 p-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none" /></label>
            <label className="flex items-center gap-2 mt-6 cursor-pointer select-none"><input type="checkbox" checked={form.featured || false} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 text-native-clay rounded border-gray-300 focus:ring-native-clay" /><span className="text-sm font-medium text-gray-700">Featured Item</span></label>
        </div>
    </div>
    );
};

const CategoryForm = ({ form, setForm }: any) => {
    const [loadingImage, setLoadingImage] = useState(false);

    const handleGenerateImage = async () => {
        if (!form.name) return alert("Enter category name first.");
        setLoadingImage(true);
        try {
            const image = await generateCategoryImage(form.name);
            setForm({...form, image});
        } catch(e) { console.error(e); }
        setLoadingImage(false);
    }

    return (
        <div className="space-y-4">
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Collection Name</label>
                <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all font-medium" />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all h-20 resize-none" />
             </div>
             <div>
                 <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-medium text-gray-500">Hero Image (Banner)</label>
                    <button onClick={handleGenerateImage} disabled={loadingImage} className="text-native-clay hover:text-native-clay/80 text-xs font-medium flex items-center gap-1 transition-colors">
                         {loadingImage ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} AI Generate Banner
                    </button>
                 </div>
                 <div className="flex gap-2">
                     <input value={form.image || ''} onChange={e => setForm({...form, image: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-mono truncate focus:ring-2 focus:ring-native-clay/10 focus:border-native-clay outline-none transition-all" placeholder="https://..." />
                 </div>
             </div>
        </div>
    );
};

export default Inventory;
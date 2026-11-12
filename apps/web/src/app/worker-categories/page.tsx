'use client';

import React, { useState } from 'react';
import {
  Tags,
  Plus,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export default function WorkerCategoriesPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: '1', name: 'Weaving', code: 'WEAVING', description: 'Operating frame, pit, or jacquard handlooms', isActive: true },
    { id: '2', name: 'Bobbin Winding', code: 'WINDING', description: 'Winding warp and pirn yarn onto bobbins and shuttles', isActive: true },
    { id: '3', name: 'Warping', code: 'WARPING', description: 'Aligning warp ends across warping mill and drum', isActive: true },
    { id: '4', name: 'Beaming', code: 'BEAMING', description: 'Tensioning and rolling warp onto the loom warp beam', isActive: true },
    { id: '5', name: 'Sizing', code: 'SIZING', description: 'Applying natural starch dressing to strengthen yarn', isActive: true },
    { id: '6', name: 'Dyeing', code: 'DYEING', description: 'Hank dyeing with natural or azo-free chemical dyes', isActive: true },
    { id: '7', name: 'Loom Preparation', code: 'LOOM_PREP', description: 'Drafting, denting, and heddle tie-up', isActive: true },
    { id: '8', name: 'Quality Inspection', code: 'QUALITY_INSPECT', description: 'Inspecting woven pieces for density and defects', isActive: true },
    { id: '9', name: 'Folding & Packing', code: 'PACKING', description: 'Tasseling, folding, and packaging finished sarees', isActive: true },
    { id: '10', name: 'Transport & Delivery', code: 'TRANSPORT', description: 'Logistics between depot and artisan households', isActive: true },
  ]);

  const [newCategory, setNewCategory] = useState({
    name: '',
    code: '',
    description: '',
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.code) return;

    const created: CategoryItem = {
      id: Date.now().toString(),
      name: newCategory.name,
      code: newCategory.code.toUpperCase().trim(),
      description: newCategory.description,
      isActive: true,
    };

    setCategories([...categories, created]);
    setIsModalOpen(false);
    setNewCategory({ name: '', code: '', description: '' });
  };

  const handleToggleStatus = (id: string) => {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    );
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Tags className="w-8 h-8 text-emerald-600" />
            Worker Skill Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configurable operational categories covering the complete handloom preparation and weaving lifecycle.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Custom Skill Category
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter categories by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {cat.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {cat.name}
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    cat.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cat.description || 'No detailed description provided.'}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => handleToggleStatus(cat.id)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:hover:text-white"
              >
                {cat.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add Custom Skill Category
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jacquard Punching"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Category Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JACQUARD_PUNCH"
                  value={newCategory.code}
                  onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain the technical operational scope..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

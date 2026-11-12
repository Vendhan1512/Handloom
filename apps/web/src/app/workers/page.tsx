'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
  MapPin,
  Phone,
  Briefcase,
  ChevronRight,
  X,
  Plus,
} from 'lucide-react';

interface WorkerItem {
  id: string;
  workerCode: string;
  fullName: string;
  phone?: string;
  village?: string;
  district?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  skills: Array<{ categoryName: string; proficiency: string; isPrimary: boolean }>;
  joiningDate: string;
}

export default function WorkersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [workers, setWorkers] = useState<WorkerItem[]>([
    {
      id: 'wrk-1',
      workerCode: 'WRK-001',
      fullName: 'K. Subramanian',
      phone: '+91 98403 11223',
      village: 'Pillayarpalayam',
      district: 'Kanchipuram',
      status: 'ACTIVE',
      skills: [
        { categoryName: 'Weaving', proficiency: 'MASTER', isPrimary: true },
        { categoryName: 'Loom Preparation', proficiency: 'SKILLED', isPrimary: false },
      ],
      joiningDate: '2024-01-15',
    },
    {
      id: 'wrk-2',
      workerCode: 'WRK-002',
      fullName: 'M. Valli',
      phone: '+91 98403 22334',
      village: 'Orikkai',
      district: 'Kanchipuram',
      status: 'ACTIVE',
      skills: [
        { categoryName: 'Bobbin Winding', proficiency: 'MASTER', isPrimary: true },
        { categoryName: 'Warping', proficiency: 'INTERMEDIATE', isPrimary: false },
      ],
      joiningDate: '2024-03-20',
    },
    {
      id: 'wrk-3',
      workerCode: 'WRK-003',
      fullName: 'R. Ganesan',
      phone: '+91 98403 33445',
      village: 'Walajabad',
      district: 'Kanchipuram',
      status: 'ACTIVE',
      skills: [
        { categoryName: 'Dyeing', proficiency: 'SKILLED', isPrimary: true },
        { categoryName: 'Sizing', proficiency: 'SKILLED', isPrimary: false },
      ],
      joiningDate: '2024-05-10',
    },
    {
      id: 'wrk-4',
      workerCode: 'WRK-004',
      fullName: 'S. Pachaiyappan',
      phone: '+91 98403 44556',
      village: 'Sevilimedu',
      district: 'Kanchipuram',
      status: 'ON_LEAVE',
      skills: [
        { categoryName: 'Weaving', proficiency: 'SKILLED', isPrimary: true },
      ],
      joiningDate: '2024-06-01',
    },
  ]);

  const [newWorker, setNewWorker] = useState({
    workerCode: `WRK-00${workers.length + 1}`,
    fullName: '',
    phone: '',
    village: '',
    district: 'Kanchipuram',
    paymentArrangement: 'PIECE_RATE',
    primarySkill: 'Weaving',
    proficiency: 'INTERMEDIATE',
  });

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.fullName) return;

    const created: WorkerItem = {
      id: `wrk-${Date.now()}`,
      workerCode: newWorker.workerCode,
      fullName: newWorker.fullName,
      phone: newWorker.phone,
      village: newWorker.village,
      district: newWorker.district,
      status: 'ACTIVE',
      skills: [
        {
          categoryName: newWorker.primarySkill,
          proficiency: newWorker.proficiency,
          isPrimary: true,
        },
      ],
      joiningDate: new Date().toISOString().split('T')[0],
    };

    setWorkers([created, ...workers]);
    setIsCreateModalOpen(false);
    setNewWorker({
      workerCode: `WRK-00${workers.length + 2}`,
      fullName: '',
      phone: '',
      village: '',
      district: 'Kanchipuram',
      paymentArrangement: 'PIECE_RATE',
      primarySkill: 'Weaving',
      proficiency: 'INTERMEDIATE',
    });
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.workerCode.toLowerCase().includes(search.toLowerCase()) ||
      (w.village && w.village.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-emerald-600" />
            Operational Worker Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Artisans, weavers, and pre-loom workers registered without requiring email, password, or smartphone accounts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Register New Artisan
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search artisans by code, name, village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Workers Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-1">
                    {worker.workerCode}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {worker.fullName}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    worker.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : worker.status === 'ON_LEAVE'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {worker.status.replace('_', ' ')}
                </span>
              </div>

              {/* Location & Contact */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>
                    {worker.village ? `${worker.village}, ` : ''}{worker.district}
                  </span>
                </div>
                {worker.phone && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{worker.phone}</span>
                  </div>
                )}
              </div>

              {/* Skill Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {worker.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    <Briefcase className="w-3 h-3" />
                    {skill.categoryName} ({skill.proficiency.toLowerCase()})
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Joined: {worker.joiningDate}</span>
              <Link
                href={`/workers/${worker.id}`}
                className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700"
              >
                View Profile & History
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Register Worker Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Register Artisan / Worker
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Worker Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWorker.workerCode}
                    onChange={(e) => setNewWorker({ ...newWorker, workerCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Plan
                  </label>
                  <select
                    value={newWorker.paymentArrangement}
                    onChange={(e) => setNewWorker({ ...newWorker, paymentArrangement: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="PIECE_RATE">Piece-Rate (Per Saree)</option>
                    <option value="DAILY_WAGE">Daily Wage</option>
                    <option value="MONTHLY_SALARY">Monthly Salary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Artisan Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="K. Subramanian"
                  value={newWorker.fullName}
                  onChange={(e) => setNewWorker({ ...newWorker, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98403 00000"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Village / Town
                  </label>
                  <input
                    type="text"
                    placeholder="Pillayarpalayam"
                    value={newWorker.village}
                    onChange={(e) => setNewWorker({ ...newWorker, village: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Primary Skill Category
                  </label>
                  <select
                    value={newWorker.primarySkill}
                    onChange={(e) => setNewWorker({ ...newWorker, primarySkill: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Weaving">Weaving</option>
                    <option value="Bobbin Winding">Bobbin Winding</option>
                    <option value="Warping">Warping</option>
                    <option value="Dyeing">Dyeing</option>
                    <option value="Beaming">Beaming</option>
                    <option value="Sizing">Sizing</option>
                    <option value="Loom Preparation">Loom Preparation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Proficiency
                  </label>
                  <select
                    value={newWorker.proficiency}
                    onChange={(e) => setNewWorker({ ...newWorker, proficiency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="MASTER">Master (Expert Artisan)</option>
                    <option value="SKILLED">Skilled</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="BEGINNER">Beginner / Apprentice</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm"
                >
                  Register Artisan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

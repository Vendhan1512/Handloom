'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  Clock,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';

export default function WorkerDetailPage() {
  const params = useParams();
  const workerId = params?.id as string;

  const [worker, setWorker] = useState({
    id: workerId || 'wrk-1',
    workerCode: 'WRK-001',
    fullName: 'K. Subramanian',
    phone: '+91 98403 11223',
    alternatePhone: '+91 98403 99999',
    address: '45 South Mada Street, Near Ekambareswarar Temple',
    village: 'Pillayarpalayam',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    pinCode: '631502',
    status: 'ACTIVE',
    paymentArrangement: 'PIECE_RATE (Traditional Mulberry Silk)',
    emergencyContact: 'Wife: Valli (+91 98403 11111)',
    notes: 'Specializes in 3-ply pure zari korvai border weaving. 18 years experience with traditional jacquard harnesses.',
    joiningDate: '2024-01-15',
    skills: [
      { categoryName: 'Weaving', proficiency: 'MASTER', experienceYears: 18, isPrimary: true },
      { categoryName: 'Loom Preparation', proficiency: 'SKILLED', experienceYears: 10, isPrimary: false },
      { categoryName: 'Bobbin Winding', proficiency: 'INTERMEDIATE', experienceYears: 5, isPrimary: false },
    ],
  });

  const [assignments] = useState([
    {
      id: 'asg-101',
      categoryName: 'Weaving',
      assignmentDate: '2026-11-01',
      expectedCompletionDate: '2026-11-20',
      status: 'IN_PROGRESS',
      instructions: 'Loom #4: 3 Pure Zari Bridal Sarees (Kanchi Wedding Collection). Verify weft tension every 2 meters.',
    },
    {
      id: 'asg-089',
      categoryName: 'Loom Preparation',
      assignmentDate: '2026-10-15',
      expectedCompletionDate: '2026-10-18',
      status: 'COMPLETED',
      instructions: 'Heddle drafting and reed alignment on Frame Loom #12.',
    },
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/workers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Artisan Directory
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
            {worker.workerCode}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {worker.fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {worker.village}, {worker.district}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Registered: {worker.joiningDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {worker.status}
          </span>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Contact & Personal */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Demographic & Contact
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-slate-400">Primary Phone</div>
              <div className="font-mono font-medium">{worker.phone || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Alternate Phone</div>
              <div className="font-mono font-medium">{worker.alternatePhone || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Residential Address</div>
              <div className="text-slate-700 dark:text-slate-300">{worker.address}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Payment Arrangement</div>
              <div className="font-medium text-emerald-700 dark:text-emerald-400">
                {worker.paymentArrangement}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Emergency Contact</div>
              <div className="text-slate-700 dark:text-slate-300">{worker.emergencyContact}</div>
            </div>
          </div>
        </div>

        {/* Right 2 columns: Skills and Assignments */}
        <div className="md:col-span-2 space-y-6">
          {/* Skills Matrix */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              Verified Artisan Skills & Proficiency
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {worker.skills.map((s, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${
                    s.isPrimary
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {s.categoryName}
                    </span>
                    {s.isPrimary && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {s.proficiency.toLowerCase()} · {s.experienceYears} yrs
                  </div>
                </div>
              ))}
            </div>

            {worker.notes && (
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300">Notes: </span>
                {worker.notes}
              </div>
            )}
          </div>

          {/* Assignments History */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              Recent Work Assignments
            </h2>

            <div className="space-y-3">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {asg.categoryName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        asg.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {asg.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {asg.instructions}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Assigned: {asg.assignmentDate}
                    </span>
                    {asg.expectedCompletionDate && (
                      <span>Due: {asg.expectedCompletionDate}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

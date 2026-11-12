'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Clock,
  Info,
  X,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface AssignmentItem {
  id: string;
  workerCode: string;
  workerName: string;
  categoryName: string;
  assignmentDate: string;
  expectedCompletionDate?: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  instructions?: string;
}

export default function WorkerAssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [assignments, setAssignments] = useState<AssignmentItem[]>([
    {
      id: 'asg-1',
      workerCode: 'WRK-001',
      workerName: 'K. Subramanian',
      categoryName: 'Weaving',
      assignmentDate: '2026-11-05',
      expectedCompletionDate: '2026-11-25',
      status: 'IN_PROGRESS',
      instructions: 'Loom #4: 3 Bridal Sarees (Kanchi Silk Wedding Collection). Maintain 120 picks/inch.',
    },
    {
      id: 'asg-2',
      workerCode: 'WRK-002',
      workerName: 'M. Valli',
      categoryName: 'Bobbin Winding',
      assignmentDate: '2026-11-10',
      expectedCompletionDate: '2026-11-14',
      status: 'ASSIGNED',
      instructions: 'Prepare 50 pirn bobbins of gold zari weft for order #HL-ORD-089.',
    },
    {
      id: 'asg-3',
      workerCode: 'WRK-003',
      workerName: 'R. Ganesan',
      categoryName: 'Dyeing',
      assignmentDate: '2026-10-28',
      expectedCompletionDate: '2026-11-02',
      status: 'COMPLETED',
      instructions: 'Hank dyeing: 25kg raw mulberry silk in natural temple red (Madder extraction).',
    },
  ]);

  const [newAssignment, setNewAssignment] = useState({
    workerCode: 'WRK-001',
    workerName: 'K. Subramanian',
    categoryName: 'Weaving',
    expectedCompletionDate: '',
    instructions: '',
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();

    const created: AssignmentItem = {
      id: `asg-${Date.now()}`,
      workerCode: newAssignment.workerCode,
      workerName: newAssignment.workerName,
      categoryName: newAssignment.categoryName,
      assignmentDate: new Date().toISOString().split('T')[0],
      expectedCompletionDate: newAssignment.expectedCompletionDate || undefined,
      status: 'ASSIGNED',
      instructions: newAssignment.instructions,
    };

    setAssignments([created, ...assignments]);
    setIsModalOpen(false);
    setNewAssignment({
      workerCode: 'WRK-001',
      workerName: 'K. Subramanian',
      categoryName: 'Weaving',
      expectedCompletionDate: '',
      instructions: '',
    });
  };

  const handleStatusChange = (id: string, status: AssignmentItem['status']) => {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  };

  const filteredAssignments = assignments.filter(
    (a) => statusFilter === 'ALL' || a.status === statusFilter,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-emerald-600" />
            Worker Assignments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Allocate task batches to weavers and pre-loom workers across department categories.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Allocate New Assignment
        </button>
      </div>

      {/* Domain Rule Reminder Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-bold">Operational Isolation Rule: </span>
          A worker assignment is an operational task allocation. It does <strong>NOT</strong> constitute proof of material issuance, production completion, cut-piece acceptance, or wage disbursement. Downstream material transactions and wage settlements are managed in dedicated transaction ledgers.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          <span>Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing {filteredAssignments.length} allocation(s)
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Artisan / Worker</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Instructions</th>
                <th className="px-6 py-3.5">Dates</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssignments.map((asg) => (
                <tr key={asg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {asg.workerName}
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {asg.workerCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {asg.categoryName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                    {asg.instructions || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 space-y-0.5">
                    <div>Assigned: {asg.assignmentDate}</div>
                    {asg.expectedCompletionDate && (
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        Due: {asg.expectedCompletionDate}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        asg.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : asg.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : asg.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {asg.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={asg.status}
                      onChange={(e) =>
                        handleStatusChange(
                          asg.id,
                          e.target.value as AssignmentItem['status'],
                        )
                      }
                      className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none"
                    >
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Allocate Task Assignment
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Assign To Artisan *
                </label>
                <select
                  value={newAssignment.workerCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const name =
                      code === 'WRK-001'
                        ? 'K. Subramanian'
                        : code === 'WRK-002'
                        ? 'M. Valli'
                        : 'R. Ganesan';
                    setNewAssignment({ ...newAssignment, workerCode: code, workerName: name });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="WRK-001">K. Subramanian (WRK-001 - Weaving Master)</option>
                  <option value="WRK-002">M. Valli (WRK-002 - Winding Master)</option>
                  <option value="WRK-003">R. Ganesan (WRK-003 - Dyeing Specialist)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Work Category *
                </label>
                <select
                  value={newAssignment.categoryName}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, categoryName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Weaving">Weaving</option>
                  <option value="Bobbin Winding">Bobbin Winding</option>
                  <option value="Warping">Warping</option>
                  <option value="Dyeing">Dyeing</option>
                  <option value="Loom Preparation">Loom Preparation</option>
                  <option value="Quality Inspection">Quality Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Expected Completion Date
                </label>
                <input
                  type="date"
                  value={newAssignment.expectedCompletionDate}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      expectedCompletionDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Operational Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Loom number, saree specifications, quality instructions..."
                  value={newAssignment.instructions}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, instructions: e.target.value })
                  }
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
                  Allocate Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

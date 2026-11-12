'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  User,
  Phone,
  Key,
  ShieldAlert,
} from 'lucide-react';

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joinedAt: string;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [users, setUsers] = useState<StaffUser[]>([
    {
      id: '1',
      email: 'admin@kanchiweavers.org',
      firstName: 'Arun',
      lastName: 'Kumar',
      phone: '+91 98401 11223',
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: '2026-01-10',
    },
    {
      id: '2',
      email: 'supervisor.murugan@kanchiweavers.org',
      firstName: 'Murugan',
      lastName: 'P',
      phone: '+91 98402 33445',
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      joinedAt: '2026-02-15',
    },
    {
      id: '3',
      email: 'accounts.selvi@kanchiweavers.org',
      firstName: 'Selvi',
      lastName: 'R',
      phone: '+91 98403 55667',
      role: 'ACCOUNTANT',
      status: 'ACTIVE',
      joinedAt: '2026-03-01',
    },
    {
      id: '4',
      email: 'store.kannan@kanchiweavers.org',
      firstName: 'Kannan',
      lastName: 'S',
      phone: '+91 98404 77889',
      role: 'STOREKEEPER',
      status: 'ACTIVE',
      joinedAt: '2026-03-12',
    },
  ]);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'OFFICE_STAFF',
    initialPassword: '',
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName) return;

    const newUser: StaffUser = {
      id: Date.now().toString(),
      email: inviteForm.email,
      firstName: inviteForm.firstName,
      lastName: inviteForm.lastName,
      phone: inviteForm.phone,
      role: inviteForm.role,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString().split('T')[0],
    };

    setUsers([newUser, ...users]);
    setIsInviteModalOpen(false);
    setInviteForm({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'OFFICE_STAFF',
      initialPassword: '',
    });
    setMessage({
      type: 'success',
      text: `Staff member ${newUser.email} added with role ${newUser.role}.`,
    });
  };

  const handleStatusToggle = (user: StaffUser) => {
    // Last active owner defense check
    if (user.role === 'OWNER') {
      const activeOwners = users.filter((u) => u.role === 'OWNER' && u.status === 'ACTIVE');
      if (activeOwners.length <= 1 && user.status === 'ACTIVE') {
        setMessage({
          type: 'error',
          text: 'Protection Rule: Cannot deactivate or suspend the last active Owner of the organization.',
        });
        return;
      }
    }

    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUsers(users.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
    setMessage({
      type: 'success',
      text: `User ${user.email} status changed to ${nextStatus}.`,
    });
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-emerald-600" />
            Users & Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authorize administrative staff, department supervisors, and account operators.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Invite Staff Member
        </button>
      </div>

      {/* Alert banner */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="STOREKEEPER">Storekeeper</option>
            <option value="OFFICE_STAFF">Office Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Staff Member</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Membership Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No staff members match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {user.phone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          user.status === 'ACTIVE'
                            ? 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300'
                            : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Invite Staff Member
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="staff@kanchiweavers.org"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ramanathan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="S"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="+91 98400 00000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Role Assignment *
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="ADMIN">Admin (Full Operations)</option>
                  <option value="SUPERVISOR">Supervisor (Floor Execution)</option>
                  <option value="ACCOUNTANT">Accountant (Wage & Financials)</option>
                  <option value="STOREKEEPER">Storekeeper (Yarn & Stock)</option>
                  <option value="OFFICE_STAFF">Office Staff (Clerical & Orders)</option>
                  <option value="QUALITY_INSPECTOR">Quality Inspector</option>
                  <option value="TRANSPORT_STAFF">Transport Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Initial Password (Optional)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={inviteForm.initialPassword}
                    onChange={(e) => setInviteForm({ ...inviteForm, initialPassword: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Auto-generated if left blank"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm"
                >
                  Authorize Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

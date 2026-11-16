import React, { useState } from 'react';
import { X, Users, Plus, ShieldCheck, Mail, Building2, Check } from 'lucide-react';
import { TEAM_OWNERS, TeamOwner } from '../../data/teamData';

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDepartment: (dept: string) => void;
}

export const TeamMembersModal: React.FC<TeamMembersModalProps> = ({
  isOpen,
  onClose,
  onSelectDepartment,
}) => {
  const [members, setMembers] = useState<TeamOwner[]>(TEAM_OWNERS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Platform Infrastructure');

  if (!isOpen) return null;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newOwner: TeamOwner = {
      id: `team-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: 'Domain Lead',
      department: newDept.trim(),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 5000000)}?w=120&auto=format&fit=crop&q=80`,
      assignedDomainsCount: 1,
    };

    setMembers([newOwner, ...members]);
    setNewName('');
    setNewEmail('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Enterprise Domain Leads & Owners</h3>
              <p className="text-[10px] text-slate-500 font-medium">Departmental assignment directory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-zinc-900 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Add form toggle */}
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Assigned Personnel ({members.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-bold text-[10px] flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Member</span>
            </button>
          </div>

          {/* Form */}
          {showAddForm && (
            <form onSubmit={handleAddMember} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morgan Davis"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Company Email</label>
                <input
                  type="email"
                  required
                  placeholder="morgan.d@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Infrastructure"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-slate-500 hover:text-zinc-900 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-zinc-900 text-white rounded-full font-semibold text-xs"
                >
                  Save Lead
                </button>
              </div>
            </form>
          )}

          {/* Member List */}
          <div className="space-y-2.5">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-3 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 text-xs truncate">
                      {member.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {member.email} · {member.department}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectDepartment(member.department);
                    onClose();
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-zinc-900 hover:text-white text-zinc-800 rounded-full text-[10px] font-bold transition-all shrink-0 font-mono"
                >
                  Filter ({member.assignedDomainsCount}d)
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

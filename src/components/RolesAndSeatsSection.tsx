import React, { useState } from 'react';
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  Edit2, 
  Mail, 
  UserCheck, 
  X, 
  CheckCircle,
  AlertTriangle,
  Lock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface RolesAndSeatsSectionProps {
  customRoles: any[];
  emailRoles: any[];
  createOrUpdateCustomRole: (role: any) => Promise<void>;
  deleteCustomRole: (id: string) => Promise<void>;
  createOrUpdateEmailRole: (assignment: any) => Promise<void>;
  deleteEmailRole: (id: string) => Promise<void>;
  setDbMessage: (msg: string) => void;
}

const AVAILABLE_MODULES = [
  { id: 'DASHBOARD', name: '📊 Dashboard Overview' },
  { id: 'STOCK', name: '📦 Stock SOH & Positions' },
  { id: 'SALES', name: '💰 Order-To-Cash (O2C)' },
  { id: 'PURCHASE', name: '💼 Procure-To-Pay (P2P)' },
  { id: 'HISTORY', name: '🕰️ Stock Movement History' },
  { id: 'OPNAME', name: '🎚️ Physical Stock Opname' },
  { id: 'SETUP', name: '⚙️ Masters Setup Directory' }
];

export const RolesAndSeatsSection: React.FC<RolesAndSeatsSectionProps> = ({
  customRoles,
  emailRoles,
  createOrUpdateCustomRole,
  deleteCustomRole,
  createOrUpdateEmailRole,
  deleteEmailRole,
  setDbMessage
}) => {
  // Role Form States
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [roleFormId, setRoleFormId] = useState('');
  const [roleFormName, setRoleFormName] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [roleFormTabs, setRoleFormTabs] = useState<string[]>([]);
  const [roleFormError, setRoleFormError] = useState('');

  // Email Seat Form States
  const [showSeatForm, setShowSeatForm] = useState(false);
  const [isEditingSeat, setIsEditingSeat] = useState(false);
  const [seatEmail, setSeatEmail] = useState('');
  const [seatRoleId, setSeatRoleId] = useState('staff');
  const [seatFormError, setSeatFormError] = useState('');

  // Delete Confirmation States
  const [confirmDeleteRoleId, setConfirmDeleteRoleId] = useState<string | null>(null);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);

  // Toggle Module Selection
  const handleToggleModule = (moduleId: string) => {
    if (roleFormTabs.includes(moduleId)) {
      setRoleFormTabs(roleFormTabs.filter(id => id !== moduleId));
    } else {
      setRoleFormTabs([...roleFormTabs, moduleId]);
    }
  };

  // Submit Role Handler
  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleFormError('');

    if (!roleFormId.trim()) {
      setRoleFormError('Role Code is required.');
      return;
    }
    if (!roleFormName.trim()) {
      setRoleFormError('Role Name is required.');
      return;
    }
    if (roleFormTabs.length === 0) {
      setRoleFormError('Please entitle at least one authorization module.');
      return;
    }

    const cleanId = roleFormId.toLowerCase().replace(/\s+/g, '-').trim();
    if (cleanId === 'admin' && !isEditingRole) {
      setRoleFormError('The generic "admin" role code is a system protected override identifier.');
      return;
    }

    try {
      await createOrUpdateCustomRole({
        id: cleanId,
        name: roleFormName.trim(),
        description: roleFormDesc.trim(),
        allowedTabs: roleFormTabs
      });

      setDbMessage(`Successfully synchronized Custom Role entitlement "${roleFormName}"!`);
      
      // Reset form
      setRoleFormId('');
      setRoleFormName('');
      setRoleFormDesc('');
      setRoleFormTabs([]);
      setShowRoleForm(false);
      setIsEditingRole(false);
    } catch (err: any) {
      setRoleFormError(err.message || 'Operation failed.');
    }
  };

  // Trigger Edit Role
  const handleEditRole = (role: any) => {
    setRoleFormId(role.id);
    setRoleFormName(role.name);
    setRoleFormDesc(role.description);
    setRoleFormTabs(role.allowedTabs || []);
    setIsEditingRole(true);
    setShowRoleForm(true);
    setRoleFormError('');
  };

  // Submit Seat Assignment Handler
  const handleSubmitSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeatFormError('');

    if (!seatEmail.trim()) {
      setSeatFormError('Email address is required.');
      return;
    }
    if (!seatEmail.includes('@')) {
      setSeatFormError('Please enter a valid email address.');
      return;
    }

    try {
      await createOrUpdateEmailRole({
        email: seatEmail.toLowerCase().trim(),
        roleId: seatRoleId
      });

      setDbMessage(isEditingSeat ? `Successfully modified authorized role seat for ${seatEmail}!` : `Authorized new license seat for ${seatEmail}!`);
      setSeatEmail('');
      setShowSeatForm(false);
      setIsEditingSeat(false);
    } catch (err: any) {
      setSeatFormError(err.message || 'Operation failed.');
    }
  };

  // Trigger Edit Seat
  const handleEditSeat = (seat: any) => {
    setSeatEmail(seat.email);
    setSeatRoleId(seat.roleId);
    setIsEditingSeat(true);
    setShowSeatForm(true);
    setSeatFormError('');
  };

  // Delete Role Handler
  const handleDeleteRolePress = async (roleId: string) => {
    if (roleId === 'admin') {
      alert('System administrative root roles are protected core components and cannot be detached.');
      return;
    }
    setConfirmDeleteRoleId(roleId);
  };

  const confirmDeleteRole = async () => {
    if (!confirmDeleteRoleId) return;
    try {
      await deleteCustomRole(confirmDeleteRoleId);
      setDbMessage(`Deleted custom role definition "${confirmDeleteRoleId}"`);
      setConfirmDeleteRoleId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Seat Assignment Handler
  const handleDeleteSeat = async (email: string) => {
    if (email === 'pmpmtop1percent@gmail.com') {
      alert('This is the primary account owner workspace seat and cannot be unassigned.');
      return;
    }
    setConfirmDeleteEmail(email);
  };

  const confirmDeleteSeat = async (email: string) => {
    try {
      await deleteEmailRole(email);
      setDbMessage(`Access seat license revoked for "${email}"!`);
    } catch (err) {
      console.error(err);
      setDbMessage(`Could not delete Seat Assignment for "${email}".`);
    } finally {
      setConfirmDeleteEmail(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Roles & Operations Seat Hub
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Configure system authorization profiles, map allowed navigation screens, and delegate license seats to email users.
          </p>
        </div>
      </div>

      {/* Main Grid: Left is Roles, Right is Seats mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Columns: Roles Entitlements Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center bg-slate-950/20 p-4 border border-slate-800/65 rounded-2xl">
            <div>
              <span className="font-bold text-slate-200 block text-sm">System Roles Directory</span>
              <p className="text-[11px] text-slate-450 mt-0.5">Define operational authorities and restrict access to modules.</p>
            </div>
            {!showRoleForm && (
              <button
                type="button"
                onClick={() => {
                  setShowRoleForm(true);
                  setIsEditingRole(false);
                  setRoleFormId('');
                  setRoleFormName('');
                  setRoleFormDesc('');
                  setRoleFormTabs([]);
                  setRoleFormError('');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-2.5 transition active:scale-95 cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                Define Custom Role
              </button>
            )}
          </div>

          {/* Role Form (Conditional Create / Edit) */}
          {showRoleForm && (
            <form onSubmit={handleSubmitRole} className="p-5 bg-slate-950/40 border border-indigo-900/30 rounded-2xl space-y-4 animate-zoom-in">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  {isEditingRole ? `Modify Custom Role: ${roleFormName}` : 'Configure New Operational Role'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowRoleForm(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {roleFormError && (
                <div className="p-3 bg-rose-955/20 border border-rose-900/30 rounded-xl text-rose-300 font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{roleFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Role Registry Code</label>
                  <input
                    type="text"
                    disabled={isEditingRole}
                    value={roleFormId}
                    onChange={(e) => setRoleFormId(e.target.value)}
                    placeholder="e.g. branch-auditor"
                    className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none disabled:opacity-50 transition"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">Lowercase code name. Used inside database links.</p>
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Role Human Name</label>
                  <input
                    type="text"
                    value={roleFormName}
                    onChange={(e) => setRoleFormName(e.target.value)}
                    placeholder="e.g. Branch Stock Auditor"
                    className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">Pretty display label shown to users.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Authority Level Scope Description</label>
                <input
                  type="text"
                  value={roleFormDesc}
                  onChange={(e) => setRoleFormDesc(e.target.value)}
                  placeholder="e.g. Physical stock inspection validation and audit checklists only"
                  className="w-full h-10 px-3.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition"
                />
              </div>

              {/* Module Entitlements Checkbox List */}
              <div className="space-y-2">
                <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px] block">Authorized Navigation Panels (Module Entitlements)</label>
                <p className="text-[10px] text-slate-500 leading-normal mb-2">Check the pages this specific role is allowed to view. Users without these will be dynamically redirected and locked out.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isChecked = roleFormTabs.includes(mod.id);
                    return (
                      <button
                        type="button"
                        key={mod.id}
                        onClick={() => handleToggleModule(mod.id)}
                        className={`p-3.5 rounded-xl border text-left font-bold transition flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'bg-indigo-950/20 border-indigo-650 text-indigo-300' 
                            : 'bg-slate-950/25 border-slate-850 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className="text-[11px] font-sans">{mod.name}</span>
                        <div className={`w-3.5 h-3.5 rounded border-2 shrink-0 flex items-center justify-center transition ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600'
                        }`}>
                          {isChecked && <CheckCircle className="w-2.5 h-2.5 text-white bg-indigo-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowRoleForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-550 font-extrabold text-white rounded-xl shadow transition"
                >
                  {isEditingRole ? 'Modify Entitlements' : 'Provision Custom Role'}
                </button>
              </div>
            </form>
          )}

          {/* Roles Directory List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customRoles?.map((role) => {
              const totalModules = role.allowedTabs?.length || 0;
              return (
                <div 
                  key={role.id} 
                  className={`p-5 rounded-2xl bg-slate-955 border transition flex flex-col justify-between h-full group ${
                    role.id === 'admin' 
                      ? 'border-indigo-900/30 shadow-sm shadow-indigo-950/15'
                      : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-100 text-sm">{role.name}</span>
                          <span className="text-[9px] font-mono uppercase bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-orange-400 font-bold">
                            {role.id}
                          </span>
                        </div>
                        <p className="text-slate-450 text-[11px] mt-1 italic leading-relaxed">{role.description || 'No description provided'}</p>
                      </div>
                    </div>

                    {/* Authorized Modules */}
                    <div className="mt-4 pt-4 border-t border-slate-850 space-y-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Authorization Mapping ({totalModules}):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {role.allowedTabs && role.allowedTabs.map((tabId: string) => {
                          const descriptor = AVAILABLE_MODULES.find(m => m.id === tabId);
                          return (
                            <span 
                              key={tabId} 
                              className="text-[9px] font-semibold bg-indigo-950/40 border border-indigo-900/40 text-indigo-300 px-2 py-1 rounded"
                            >
                              {descriptor ? descriptor.name.split(' ')[0] : '🧩'} {tabId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex justify-end gap-3 mt-5 pt-3.5 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => handleEditRole(role)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl transition flex items-center gap-1 cursor-pointer font-bold select-none text-[10px]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      Entitlements
                    </button>

                    {role.id !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRolePress(role.id)}
                        className="p-2 bg-slate-900 hover:bg-red-950/20 text-slate-350 hover:text-red-400 rounded-xl transition flex items-center gap-1 cursor-pointer font-bold select-none text-[10px]"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        Remove Role
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Users Seats Assignment List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-955 border border-slate-850 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-850">
              <div>
                <span className="font-bold text-slate-200 block text-sm">Access Seats (Emails)</span>
                <p className="text-[11px] text-slate-450 mt-0.5">Assign operating staff member emails to custom system roles.</p>
              </div>
              {!showSeatForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSeatForm(true);
                    setIsEditingSeat(false);
                    setSeatEmail('');
                    setSeatRoleId('staff');
                    setSeatFormError('');
                  }}
                  className="p-2 bg-indigo-950/25 hover:bg-indigo-650 text-indigo-400 hover:text-white border border-indigo-900/40 rounded-xl transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Seat Assignment Form */}
            {showSeatForm && (
              <form onSubmit={handleSubmitSeat} className="p-4 bg-slate-950 border border-indigo-900/30 rounded-xl space-y-3.5 animate-zoom-in">
                <div className="flex justify-between items-center pb-1">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    {isEditingSeat ? 'Modify Operation Seat' : 'Assign Operation Seat'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSeatForm(false);
                      setIsEditingSeat(false);
                      setSeatEmail('');
                      setSeatRoleId('staff');
                      setSeatFormError('');
                    }}
                    className="text-slate-400 hover:text-slate-350 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {seatFormError && (
                  <p className="text-[10px] text-rose-400 bg-rose-955/15 p-1.5 rounded">{seatFormError}</p>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Staff User Email</label>
                  <input
                    type="email"
                    value={seatEmail}
                    onChange={(e) => setSeatEmail(e.target.value)}
                    disabled={isEditingSeat}
                    placeholder="e.g. storage.ops@company.me"
                    className={`w-full h-9 px-3 bg-slate-900 border border-slate-850 rounded-lg text-slate-100 placeholder-slate-650 focus:outline-none transition focus:border-indigo-500 text-xs ${
                      isEditingSeat ? 'opacity-50 cursor-not-allowed select-none bg-slate-950' : ''
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Operational Role Seat</label>
                  <select
                    value={seatRoleId}
                    onChange={(e) => setSeatRoleId(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-900 border border-slate-850 rounded-lg text-slate-100 focus:outline-none transition focus:border-indigo-500 text-xs cursor-pointer focus:bg-slate-950"
                  >
                    {customRoles?.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} ({role.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSeatForm(false);
                      setIsEditingSeat(false);
                      setSeatEmail('');
                      setSeatRoleId('staff');
                      setSeatFormError('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 font-bold text-white rounded-lg text-[10px] cursor-pointer"
                  >
                    {isEditingSeat ? 'Save License Seat' : 'Authorize License Seat'}
                  </button>
                </div>
              </form>
            )}

            {/* Email Seats List */}
            <div className="space-y-2.5">
              {emailRoles?.map((seat) => {
                const roleDetails = customRoles?.find(cr => cr.id === seat.roleId);
                const isBaselineAdmin = seat.email === 'pmpmtop1percent@gmail.com';
                return (
                  <div 
                    key={seat.email}
                    className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2 group transition hover:border-slate-800"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="font-bold text-indigo-350 text-[11px] flex items-center gap-1" title={seat.email}>
                          <Mail className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                          <span className="truncate">{seat.email}</span>
                        </span>
                        
                        {/* Display corresponding role name */}
                        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-mono bg-indigo-950/55 text-indigo-350 border border-indigo-900 px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                            🛡️ {roleDetails ? roleDetails.name.split(' ')[1] || roleDetails.name : seat.roleId}
                          </span>
                          {isBaselineAdmin && (
                            <span className="text-[8px] font-mono tracking-widest text-[#5ce0ff] bg-slate-900 px-1 py-0.5 border border-slate-800 rounded font-bold">
                              ROOT_OWNER
                            </span>
                          )}
                        </div>
                      </div>

                      {!isBaselineAdmin && (
                        confirmDeleteEmail === seat.email ? (
                          <div className="flex items-center gap-1.5 bg-rose-950/20 border border-rose-500/20 px-2 py-1 rounded-xl text-[10px] font-semibold animate-fade-in z-10 font-sans shrink-0">
                            <span className="text-rose-400 font-bold text-[9px]">Sure?</span>
                            <button
                              type="button"
                              onClick={() => confirmDeleteSeat(seat.email)}
                              className="px-1.5 py-0.5 bg-rose-650 hover:bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer transition-all border border-rose-600 shadow"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteEmail(null)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[8px] font-bold cursor-pointer transition-all border border-slate-700 shadow"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0 select-none transition-all duration-200">
                            <button
                              type="button"
                              onClick={() => handleEditSeat(seat)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-550/40 hover:bg-indigo-950/20 text-indigo-400 hover:text-indigo-300 transition active:scale-90 cursor-pointer"
                              title="Edit Seat Role"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSeat(seat.email)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-900/40 hover:bg-rose-950/20 text-slate-400 hover:text-red-400 transition active:scale-90 cursor-pointer"
                              title="Unassign Seat License"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Role Dialog Modal */}
      {confirmDeleteRoleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in w-full h-full">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-zoom-in">
            <div className="flex gap-3 text-red-450">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-red-500" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-100 text-sm">Remove System Custom Role?</h4>
                <p className="text-xs text-slate-450 leading-relaxed font-sans">
                  You are about to irreversibly purge role definition <span className="font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{confirmDeleteRoleId}</span>. Any active operations seat mapped to this role ID will lose access privileges instantly.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 text-xs font-bold pt-2 border-t border-slate-850/60">
              <button
                type="button"
                onClick={() => setConfirmDeleteRoleId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Cancel, Keep Role
              </button>
              <button
                type="button"
                onClick={confirmDeleteRole}
                className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl transition cursor-pointer"
              >
                Yes, Purge Definition
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { useQuest } from '../context/QuestContext';
import { useAuth } from '../context/AuthContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicButton } from '../components/common/NeumorphicButton';
import { 
  Mail, 
  Flame, 
  Check, 
  Edit2,
  LogOut
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, signOut, updateProfileDetails } = useAuth();
  const { 
    totalXp, 
    completedCount, 
    isQuestComplete, 
    navigateTo
  } = useQuest();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.fullName || '');
  const [sectionInput, setSectionInput] = useState(user?.section || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSaving(true);
    await updateProfileDetails(nameInput.trim(), sectionInput.trim());
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigateTo('login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Profile & Stats
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Your verified quest record and account credentials.
          </p>
        </div>

        <NeumorphicButton
          size="sm"
          variant="secondary"
          onClick={handleLogout}
          icon={<LogOut className="w-3.5 h-3.5 text-gray-500" />}
        >
          Logout
        </NeumorphicButton>
      </div>

      {/* User Information Card */}
      <NeumorphicCard variant="raised" className="p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-gray-700 font-bold text-lg font-mono">
              {user?.fullName?.charAt(0) || 'U'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {user?.fullName || 'Quest Explorer'}
                </h2>
                {user?.section && (
                  <span className="px-2 py-0.5 rounded-md neu-inset text-[11px] font-mono text-slate-700 font-semibold">
                    {user.section}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>

          <NeumorphicButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setNameInput(user?.fullName || '');
              setSectionInput(user?.section || '');
              setIsEditing(!isEditing);
            }}
            icon={<Edit2 className="w-3 h-3 text-gray-500" />}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </NeumorphicButton>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="p-4 rounded-2xl neu-inset space-y-3 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-500">
                  Full Name (for Certificate)
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl neu-inset-sm text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-[#EBECF0]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-500">
                  Class / Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. 41, 42"
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl neu-inset-sm text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-[#EBECF0]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400">
                Email cannot be modified directly.
              </span>
              <NeumorphicButton size="sm" variant="primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </NeumorphicButton>
            </div>
          </form>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl neu-inset text-center space-y-0.5">
            <div className="text-[10px] uppercase font-semibold text-gray-400">
              Total XP
            </div>
            <div className="text-base font-bold font-mono text-gray-900">
              {totalXp}
            </div>
          </div>

          <div className="p-3.5 rounded-xl neu-inset text-center space-y-0.5">
            <div className="text-[10px] uppercase font-semibold text-gray-400">
              Completed
            </div>
            <div className="text-base font-bold font-mono text-gray-900">
              {completedCount} / 22
            </div>
          </div>

          <div className="p-3.5 rounded-xl neu-inset text-center space-y-0.5">
            <div className="text-[10px] uppercase font-semibold text-gray-400">
              Streak
            </div>
            <div className="text-base font-bold font-mono text-amber-600 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              {user?.currentStreak ?? 0}d
            </div>
          </div>

          <div className="p-3.5 rounded-xl neu-inset text-center space-y-0.5">
            <div className="text-[10px] uppercase font-semibold text-gray-400">
              Certificate
            </div>
            <div className="text-xs font-bold text-gray-800 flex items-center justify-center gap-1 h-6">
              {isQuestComplete ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  Unlocked
                </span>
              ) : (
                <span className="text-gray-400">Locked</span>
              )}
            </div>
          </div>
        </div>
      </NeumorphicCard>
    </div>
  );
};

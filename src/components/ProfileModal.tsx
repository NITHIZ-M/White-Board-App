import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  Linkedin,
  Twitter,
  Globe,
  Mail,
  Edit3,
  Save,
  ExternalLink,
  User,
  Briefcase,
  Sparkles,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  name: string;
  role: string;
  bio: string;
  github: string;
  linkedin: string;
  twitter: string;
  website: string;
  email: string;
}

const DEFAULT_PROFILE: ProfileData = {
  name: 'Guest Artist',
  role: 'Creative Explorer',
  bio: 'Drawing and brainstorming ideas inside Doodle Space!',
  github: '',
  linkedin: '',
  twitter: '',
  website: '',
  email: '',
};

const PROFILE_STORAGE_KEY = 'doodle_user_profile';

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>(DEFAULT_PROFILE);

  // Load profile from localStorage on open
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          setEditForm(parsed);
        }
      } catch (e) {
        console.warn('Failed to load profile from localStorage', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editForm);
    setIsEditing(false);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(editForm));
    } catch (e) {
      console.error('Failed to save profile to localStorage', e);
    }
  };

  const handleReset = () => {
    if (confirm('Reset profile to default?')) {
      setEditForm(DEFAULT_PROFILE);
      setProfile(DEFAULT_PROFILE);
      setIsEditing(false);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white/75 dark:bg-slate-950/70 backdrop-blur-2xl rounded-3xl max-w-md w-full shadow-2xl border border-white/20 dark:border-white/5 flex flex-col overflow-hidden max-h-[90vh] transition-all duration-300">
        
        {/* Header decoration banner */}
        <div className="h-20 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 relative shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
                title="Edit Profile"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 border-4 border-white dark:border-slate-950 flex items-center justify-center text-white text-2xl font-bold shadow-md select-none">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'N'}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 pt-12 pb-6 overflow-y-auto flex-1 scrollbar-thin">
          {!isEditing ? (
            /* VIEW MODE */
            <div className="space-y-5 animate-fade-in">
              {/* Identity info */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                  {profile.name}
                  <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  {profile.role}
                </p>
              </div>

              {/* Bio description */}
              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/35 border border-slate-200/30 dark:border-slate-800/15 rounded-2xl text-[11px] leading-relaxed text-slate-650 dark:text-slate-300">
                {profile.bio}
              </div>

              {/* Social Channels grid */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest font-mono pl-0.5">
                  Connected Platforms
                </h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {profile.github && (
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 bg-slate-50/30 hover:bg-slate-100/50 dark:bg-slate-900/25 dark:hover:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/15 rounded-xl transition text-slate-700 dark:text-slate-300 hover:scale-[1.01]"
                    >
                      <Github className="w-4 h-4 text-slate-900 dark:text-white shrink-0" />
                      <span className="truncate">GitHub</span>
                      <ExternalLink className="w-3 h-3 ml-auto text-slate-400 opacity-60 shrink-0" />
                    </a>
                  )}

                  {profile.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 bg-slate-50/30 hover:bg-slate-100/50 dark:bg-slate-900/25 dark:hover:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/15 rounded-xl transition text-slate-700 dark:text-slate-300 hover:scale-[1.01]"
                    >
                      <Linkedin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">LinkedIn</span>
                      <ExternalLink className="w-3 h-3 ml-auto text-slate-400 opacity-60 shrink-0" />
                    </a>
                  )}

                  {profile.twitter && (
                    <a
                      href={profile.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 bg-slate-50/30 hover:bg-slate-100/50 dark:bg-slate-900/25 dark:hover:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/15 rounded-xl transition text-slate-700 dark:text-slate-300 hover:scale-[1.01]"
                    >
                      <Twitter className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="truncate">Twitter</span>
                      <ExternalLink className="w-3 h-3 ml-auto text-slate-400 opacity-60 shrink-0" />
                    </a>
                  )}

                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 bg-slate-50/30 hover:bg-slate-100/50 dark:bg-slate-900/25 dark:hover:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/15 rounded-xl transition text-slate-700 dark:text-slate-300 hover:scale-[1.01]"
                    >
                      <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Website</span>
                      <ExternalLink className="w-3 h-3 ml-auto text-slate-400 opacity-60 shrink-0" />
                    </a>
                  )}
                </div>

                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2.5 p-2.5 w-full bg-slate-50/30 hover:bg-slate-100/50 dark:bg-slate-900/25 dark:hover:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/15 rounded-xl transition text-slate-700 dark:text-slate-300 text-xs mt-2"
                  >
                    <Mail className="w-4 h-4 text-violet-500 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSave} className="space-y-4 text-xs animate-fade-in">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/20 dark:border-slate-800/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Modify User Profile
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[9px] font-mono text-red-500 hover:underline cursor-pointer"
                >
                  Reset defaults
                </button>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-450 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="p-2 border border-slate-200/50 dark:border-slate-800/30 bg-white/50 dark:bg-slate-900/50 rounded-xl outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent dark:text-white font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-450 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    Professional Role
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="p-2 border border-slate-200/50 dark:border-slate-800/30 bg-white/50 dark:bg-slate-900/50 rounded-xl outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-450 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                  Profile Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="p-2.5 border border-slate-200/50 dark:border-slate-800/30 bg-white/50 dark:bg-slate-900/50 rounded-xl outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent dark:text-white font-sans leading-relaxed resize-none"
                />
              </div>

              {/* Social URLs */}
              <div className="space-y-3 pt-1.5 border-t border-slate-200/20 dark:border-slate-800/10">
                <span className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest font-mono">
                  Social Channels Links
                </span>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl px-2.5 py-1.5">
                    <Github className="w-4 h-4 text-slate-800 dark:text-slate-350 shrink-0" />
                    <input
                      type="url"
                      placeholder="GitHub profile link"
                      value={editForm.github}
                      onChange={e => setEditForm({ ...editForm, github: e.target.value })}
                      className="bg-transparent border-none outline-none w-full dark:text-white p-0 focus:ring-0 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl px-2.5 py-1.5">
                    <Linkedin className="w-4 h-4 text-blue-600 shrink-0" />
                    <input
                      type="url"
                      placeholder="LinkedIn profile link"
                      value={editForm.linkedin}
                      onChange={e => setEditForm({ ...editForm, linkedin: e.target.value })}
                      className="bg-transparent border-none outline-none w-full dark:text-white p-0 focus:ring-0 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl px-2.5 py-1.5">
                    <Twitter className="w-4 h-4 text-sky-500 shrink-0" />
                    <input
                      type="url"
                      placeholder="Twitter/X profile link"
                      value={editForm.twitter}
                      onChange={e => setEditForm({ ...editForm, twitter: e.target.value })}
                      className="bg-transparent border-none outline-none w-full dark:text-white p-0 focus:ring-0 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl px-2.5 py-1.5">
                    <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                    <input
                      type="url"
                      placeholder="Personal website link"
                      value={editForm.website}
                      onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                      className="bg-transparent border-none outline-none w-full dark:text-white p-0 focus:ring-0 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl px-2.5 py-1.5">
                    <Mail className="w-4 h-4 text-violet-500 shrink-0" />
                    <input
                      type="email"
                      placeholder="Contact email address"
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className="bg-transparent border-none outline-none w-full dark:text-white p-0 focus:ring-0 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/20 dark:border-slate-800/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditForm(profile);
                    setIsEditing(false);
                  }}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl font-semibold flex items-center gap-1 transition shadow cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Lock, Monitor, Moon, Sun, Save, CheckCircle } from 'lucide-react';

export function Settings() {
  const { user, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile(name, email);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    const success = changePassword(currentPassword, newPassword);
    if (!success) {
      setPasswordError('Incorrect current password');
    } else {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Settings</h2>
        <p className="text-slate-400 mt-1">Manage your account settings and preferences.</p>
      </div>

      {/* PROFILE SECTION */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Profile Information
          </h3>
          <p className="text-sm text-slate-400 mt-1">Update your demo account details.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-lg">
            {profileSuccess && (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4" />
                Profile updated successfully.
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/50 border border-border rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-border rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Role</label>
              <input
                type="text"
                value={user?.role || ''}
                className="w-full bg-slate-800/50 border border-border rounded-lg px-4 py-2 text-slate-400 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-slate-500 mt-1">Role is fixed for this demo environment.</p>
            </div>
            
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </form>
        </div>
      </div>

      {/* PASSWORD SECTION */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            Change Password
          </h3>
          <p className="text-sm text-slate-400 mt-1">Update your local demo password.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
            {passwordError && (
              <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4" />
                Password updated successfully.
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-border rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-border rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-border rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* APPEARANCE SECTION */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-400" />
            Appearance
          </h3>
          <p className="text-sm text-slate-400 mt-1">Customize the interface theme.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                theme === 'light' ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-slate-900/30 hover:border-slate-500'
              }`}
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Sun className="w-6 h-6 text-amber-500" />
              </div>
              <span className="font-medium text-slate-200">Light Mode</span>
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                theme === 'dark' ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-slate-900/30 hover:border-slate-500'
              }`}
            >
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Moon className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="font-medium text-slate-200">Dark Mode</span>
            </button>
            
            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                theme === 'system' ? 'border-indigo-500 bg-indigo-500/5' : 'border-border bg-slate-900/30 hover:border-slate-500'
              }`}
            >
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Monitor className="w-6 h-6 text-slate-300" />
              </div>
              <span className="font-medium text-slate-200">System Preference</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

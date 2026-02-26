import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

const ProfilePage: React.FC = () => {
    const { user, login } = useAuth();
    const { showNotification } = useNotification();
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(user?.name || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fullUserData, setFullUserData] = useState<any>(null);

    // Change Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // If the user has a userId, we can find them in the list or use a specific detail endpoint if exists
                // For now, let's try to get current user data or assume they are in the getAll list
                const allUsers = await userService.getAll();
                const current = allUsers.find(u => u.email === user?.email);
                if (current) {
                    setFullUserData(current);
                    setFullName(current.fullName);
                }
            } catch (e) {
                console.error("Failed to fetch profile details", e);
            }
        };
        fetchDetails();
    }, [user?.email]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.userId) return;

        setIsSubmitting(true);
        try {
            await userService.update(user.userId, {
                fullName,
                siteId: user.siteId // Maintain existing siteId
            });

            // Update local user state
            const updatedUser = { ...user, name: fullName };
            login(updatedUser, localStorage.getItem('token') || '');

            showNotification('Cập nhật thông tin thành công!', 'success');
            setIsEditing(false);
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Cập nhật thông tin thất bại', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            showNotification('Mật khẩu mới không khớp', 'error');
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await authService.changePassword(passwordData);
            showNotification(res.message || 'Đổi mật khẩu thành công!', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Đổi mật khẩu thất bại', 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <Layout title="My Profile" breadcrumb="User Settings">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profile Settings</h3>
                    <p className="text-slate-500 text-sm mt-1">Manage your personal information and account preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Avatar & Summary */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-border-muted overflow-hidden shadow-sm">
                            <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5 dark:from-primary/10 dark:to-transparent"></div>
                            <div className="px-6 pb-8 -mt-12 flex flex-col items-center">
                                <div className="relative group">
                                    <div
                                        className="w-24 h-24 rounded-2xl bg-center bg-cover border-4 border-white dark:border-zinc-900 shadow-xl"
                                        style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=128')` }}
                                    ></div>
                                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                        <span className="material-symbols-outlined text-white">photo_camera</span>
                                    </div>
                                </div>
                                <h4 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h4>
                                <p className="text-xs font-bold text-primary uppercase tracking-widest">{user?.role}</p>

                                <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">Account Status</span>
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-bold uppercase text-[9px]">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 p-6">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <span className="material-symbols-outlined">verified_user</span>
                                <h5 className="font-bold text-sm">Security Tip</h5>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Use a strong password and enable 2FA to keep your environmental monitoring data secure.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Details & Edit */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-border-muted shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <h5 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-widest">Personal Information</h5>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span> Edit
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {isEditing ? (
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                            <input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white transition-all"
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                                            <input
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-border-muted rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                                            />
                                            <p className="text-[9px] text-slate-400">Email cannot be changed. Contact admin for assistance.</p>
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => { setIsEditing(false); setFullName(user?.name || ''); }}
                                                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-border-muted text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{fullUserData?.fullName || user?.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{fullUserData?.roleName || user?.role}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Site</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{fullUserData?.siteName || (user?.siteId ? `#${user.siteId}` : 'All Sites')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-border-muted shadow-sm overflow-hidden p-6">
                            <h5 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-widest mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Security Settings
                            </h5>
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white transition-all"
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.confirmNewPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-border-muted rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white transition-all"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="w-full mt-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase hover:bg-black dark:hover:bg-slate-200 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10 dark:shadow-none"
                                >
                                    {isChangingPassword ? 'Processing...' : 'Change Password'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-border-muted shadow-sm overflow-hidden p-6">
                            <h5 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-widest mb-4">Permissions & Access</h5>
                            <div className="flex flex-wrap gap-2">
                                {user?.role === 'ADMIN' && (
                                    <>
                                        <span className="badge-pill bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-bold px-2 py-1 rounded-md uppercase">Root Access</span>
                                        <span className="badge-pill bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[9px] font-bold px-2 py-1 rounded-md uppercase">Manage users</span>
                                        <span className="badge-pill bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold px-2 py-1 rounded-md uppercase">Billing access</span>
                                    </>
                                )}
                                <span className="badge-pill bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold px-2 py-1 rounded-md uppercase">View Analytics</span>
                                <span className="badge-pill bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[9px] font-bold px-2 py-1 rounded-md uppercase">Export Data</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;

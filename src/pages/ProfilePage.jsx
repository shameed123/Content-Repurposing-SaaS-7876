import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SafeIcon from '../common/SafeIcon';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiMail, FiLock, FiSave, FiEye, FiEyeOff } = FiIcons;

const ProfilePage = () => {
  const { user, userProfile, updateProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: userProfile?.full_name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        full_name: profileData.full_name
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would update the password here
      toast.info('Password update feature coming soon');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    );

    if (confirmation !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    try {
      // In a real app, you would delete the account here
      toast.info('Account deletion feature coming soon');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'security', name: 'Security', icon: FiLock },
    { id: 'danger', name: 'Danger Zone', icon: FiMail }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card padding="p-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <SafeIcon icon={tab.icon} className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                      <SafeIcon icon={FiUser} className="w-10 h-10 text-primary-600" />
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Change Avatar
                      </Button>
                      <p className="text-sm text-gray-600 mt-1">
                        JPG, GIF or PNG. 1MB max.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        full_name: e.target.value
                      })}
                      placeholder="Enter your full name"
                    />

                    <Input
                      label="Email Address"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Role"
                      value={userProfile?.role || 'user'}
                      disabled
                      className="bg-gray-50 capitalize"
                    />

                    <Input
                      label="Plan"
                      value={userProfile?.subscription_plan || 'free'}
                      disabled
                      className="bg-gray-50 capitalize"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={profileData.full_name === userProfile?.full_name}
                    >
                      <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>

                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value
                      })}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    >
                      <SafeIcon icon={showCurrentPassword ? FiEyeOff : FiEye} className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    >
                      <SafeIcon icon={showNewPassword ? FiEyeOff : FiEye} className="w-5 h-5" />
                    </button>
                  </div>

                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirm your new password"
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Two-Factor Authentication</h2>
                <p className="text-gray-600 mb-6">
                  Add an extra layer of security to your account with two-factor authentication.
                </p>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Authenticator App</p>
                    <p className="text-sm text-gray-600">Not configured</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Setup
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Sessions</h2>
                <p className="text-gray-600 mb-6">
                  Manage and log out your active sessions on other devices.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Current Session</p>
                      <p className="text-sm text-gray-600">
                        {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'} • 
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  Log out all other sessions
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <h2 className="text-xl font-semibold text-red-600 mb-6">Danger Zone</h2>
                
                <div className="space-y-6">
                  <div className="border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Export Your Data
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Download a copy of all your content and data.
                    </p>
                    <Button variant="outline">
                      Export Data
                    </Button>
                  </div>

                  <div className="border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Permanently delete your account and all associated data. 
                      This action cannot be undone.
                    </p>
                    <Button
                      variant="danger"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
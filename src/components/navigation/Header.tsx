import React, { useState } from 'react';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useNotifications } from '../../context/NotificationContext';
import { app } from '../../config/environment';
import { GlassmorphismIcon } from '../ui/GlassmorphismIcon';
import { NotificationDropdown } from '../ui/NotificationDropdown';
// import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const { currentStore } = useStore();
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);


  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/50 px-4 py-3 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="./icons/GreepMarket-Green_BG-White.svg" alt="Greep Market" className="h-12 w-12 text-white" />
          
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentStore?.name || app.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentStore?.address || 'Retail Management System'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <GlassmorphismIcon
              icon={Bell}
              size="md"
              variant="default"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative cursor-pointer"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500/80 backdrop-blur-sm text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border border-red-400/30 shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearAll={clearAll}
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:shadow-md transition-all duration-200"
            >
              <div className="w-8 h-8 bg-primary-500/20 backdrop-blur-md border border-primary-400/30 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <div className="text-left hidden sm:block">
                {isLoading ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white animate-pulse">
                      Loading...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                      Loading...
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                  </>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 py-1 z-50 transition-all duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  {isLoading ? (
                    <>
                      <p className="text-sm font-medium text-gray-900 dark:text-white animate-pulse">
                        Loading...
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                        Loading...
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </>
                  )}
                </div>
                <button
                  onClick={handleSettingsClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/50 flex items-center space-x-2 transition-all duration-200 rounded-lg mx-1"
                >
                  <div className="p-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 flex items-center space-x-2 transition-all duration-200 rounded-lg mx-1"
                >
                  <div className="p-1 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

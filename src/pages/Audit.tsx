import React, { useState } from 'react';
import { Shield, BarChart3, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { AuditLogs } from '../components/ui/AuditLogs';
import { AuditAnalytics } from '../components/ui/AuditAnalytics';
import { BackButton } from '../components/ui/BackButton';
import { Breadcrumb } from '../components/ui/Breadcrumb';

export const Audit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics'>('logs');

  const tabs = [
    {
      id: 'logs' as const,
      name: 'Audit Logs',
      icon: FileText,
      description: 'View detailed audit logs and track user activities'
    },
    {
      id: 'analytics' as const,
      name: 'Analytics',
      icon: BarChart3,
      description: 'Advanced analytics and reporting features'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <BackButton />
            <Breadcrumb />
          </div>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-4">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit & Security</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor user activities and system security
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'logs' && (
            <div>
              <div className="mb-6">
                <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        Audit Logs
                      </h3>
                      <p className="text-blue-700 dark:text-blue-400 mb-4">
                        Track all user activities and system changes with detailed audit trails. 
                        Monitor who performed what actions, when they occurred, and what data was affected.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <h4 className="font-medium text-blue-900 dark:text-blue-300">Complete Tracking</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-400">Every action is logged with user details and timestamps</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <h4 className="font-medium text-blue-900 dark:text-blue-300">Change History</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-400">See exactly what changed with before/after values</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <h4 className="font-medium text-blue-900 dark:text-blue-300">Export Data</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-400">Download audit logs in CSV format for compliance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <AuditLogs />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="mb-6">
                <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-start">
                    <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                        Audit Analytics
                      </h3>
                      <p className="text-green-700 dark:text-green-400 mb-4">
                        Advanced analytics and reporting features to gain insights into user behavior, 
                        system usage patterns, and security trends.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <h4 className="font-medium text-green-900 dark:text-green-300">Usage Patterns</h4>
                          <p className="text-sm text-green-700 dark:text-green-400">Understand how your system is being used</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <h4 className="font-medium text-green-900 dark:text-green-300">Security Insights</h4>
                          <p className="text-sm text-green-700 dark:text-green-400">Monitor login patterns and suspicious activities</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                          <h4 className="font-medium text-green-900 dark:text-green-300">Performance Metrics</h4>
                          <p className="text-sm text-green-700 dark:text-green-400">Track system activity and user engagement</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <AuditAnalytics />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

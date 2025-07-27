import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SafeIcon from '../common/SafeIcon';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import * as FiIcons from 'react-icons/fi';

const { FiZap, FiFileText, FiClock, FiTrendingUp, FiArrowRight, FiPlus, FiTwitter, FiLinkedin, FiMail } = FiIcons;

const DashboardPage = () => {
  const { userProfile } = useAuth();
  const { getCurrentPlan, getRemainingCredits, getTotalCredits, getUsagePercentage } = useSubscription();
  const [recentContent, setRecentContent] = useState([]);
  const [stats, setStats] = useState({
    totalRepurposings: 0,
    thisMonth: 0,
    avgTime: '5 min'
  });
  const [loading, setLoading] = useState(true);

  const currentPlan = getCurrentPlan();
  const remainingCredits = getRemainingCredits();
  const totalCredits = getTotalCredits();
  const usagePercentage = getUsagePercentage();

  useEffect(() => {
    fetchDashboardData();
  }, [userProfile]);

  const fetchDashboardData = async () => {
    if (!userProfile) return;

    try {
      // Fetch recent repurposed content
      const { data: recentData } = await supabase
        .from('repurposed_content')
        .select(`
          *,
          content_items(title, content_type)
        `)
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentContent(recentData || []);

      // Fetch stats
      const { data: allRepurposings } = await supabase
        .from('repurposed_content')
        .select('created_at')
        .eq('user_id', userProfile.id);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const thisMonthCount = allRepurposings?.filter(item => 
        new Date(item.created_at) >= thisMonth
      ).length || 0;

      setStats({
        totalRepurposings: allRepurposings?.length || 0,
        thisMonth: thisMonthCount,
        avgTime: '5 min'
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Twitter Thread',
      description: 'Turn your content into engaging tweets',
      icon: FiTwitter,
      action: '/repurpose?format=twitter-thread',
      color: 'bg-blue-500'
    },
    {
      title: 'LinkedIn Post',
      description: 'Professional content for LinkedIn',
      icon: FiLinkedin,
      action: '/repurpose?format=linkedin-post',
      color: 'bg-blue-700'
    },
    {
      title: 'Email Newsletter',
      description: 'Structure content for newsletters',
      icon: FiMail,
      action: '/repurpose?format=email-newsletter',
      color: 'bg-green-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userProfile?.full_name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-600">
          Ready to transform your content? You have {remainingCredits} credits remaining.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiZap} className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Credits Remaining</p>
              <p className="text-2xl font-bold text-gray-900">{remainingCredits}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${100 - usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiFileText} className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Repurposings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRepurposings}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <SafeIcon icon={FiClock} className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgTime}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <Link to="/repurpose">
              <Button variant="outline" size="sm">
                View All
                <SafeIcon icon={FiArrowRight} className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link to={action.action}>
                  <Card hover className="text-center cursor-pointer">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <SafeIcon icon={action.icon} className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Link to="/history">
                <Button variant="outline" size="sm">
                  View All
                  <SafeIcon icon={FiArrowRight} className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <Card>
              {recentContent.length > 0 ? (
                <div className="space-y-4">
                  {recentContent.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <SafeIcon icon={FiFileText} className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.output_format.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.content_items?.title || 'Untitled'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <SafeIcon icon={FiFileText} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No content repurposed yet</p>
                  <Link to="/repurpose">
                    <Button variant="primary">
                      <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
                      Create Your First Repurposing
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plan Info */}
          <Card>
            <div className="text-center">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                currentPlan.name === 'Free' 
                  ? 'bg-gray-100 text-gray-600'
                  : currentPlan.name === 'Pro'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {currentPlan.name} Plan
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {remainingCredits} / {totalCredits}
              </p>
              <p className="text-sm text-gray-600 mb-4">Credits remaining</p>
              
              {currentPlan.name === 'Free' && (
                <Link to="/billing">
                  <Button variant="premium" size="sm" className="w-full">
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Tips */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">💡 Pro Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Use engaging hooks to grab attention</p>
              <p>• Include clear calls-to-action</p>
              <p>• Tailor content for each platform</p>
              <p>• Test different tones and styles</p>
            </div>
          </Card>

          {/* Support */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Check out our documentation or contact support.
            </p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                View Docs
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
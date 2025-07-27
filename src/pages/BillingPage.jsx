import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SUBSCRIPTION_PLANS, createCheckoutSession } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SafeIcon from '../common/SafeIcon';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiCheck, FiCreditCard, FiDownload, FiZap, FiCalendar, FiDollarSign } = FiIcons;

const BillingPage = () => {
  const { user, userProfile } = useAuth();
  const { subscription, getCurrentPlan, getRemainingCredits, getTotalCredits, getUsagePercentage } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [usageStats, setUsageStats] = useState({
    currentPeriodUsage: 0,
    totalSpent: 0
  });

  const currentPlan = getCurrentPlan();
  const remainingCredits = getRemainingCredits();
  const totalCredits = getTotalCredits();
  const usagePercentage = getUsagePercentage();

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  const fetchBillingData = async () => {
    if (!user) return;

    try {
      // Fetch usage stats
      const { data: repurposings } = await supabase
        .from('repurposed_content')
        .select('created_at, tokens_used')
        .eq('user_id', user.id);

      const currentMonth = new Date();
      currentMonth.setDate(1);
      
      const currentPeriodUsage = repurposings?.filter(item => 
        new Date(item.created_at) >= currentMonth
      ).length || 0;

      setUsageStats({
        currentPeriodUsage,
        totalSpent: 0 // This would come from Stripe in a real app
      });

      // Mock invoices - in a real app, these would come from Stripe
      setInvoices([
        {
          id: 'inv_1',
          date: new Date().toISOString(),
          amount: currentPlan.price,
          status: 'paid',
          plan: currentPlan.name
        }
      ]);

    } catch (error) {
      console.error('Error fetching billing data:', error);
    }
  };

  const handleUpgrade = async (planKey) => {
    const plan = SUBSCRIPTION_PLANS[planKey];
    if (!plan.priceId) {
      toast.error('This plan is not available for purchase');
      return;
    }

    setLoading(true);
    try {
      const session = await createCheckoutSession(plan.priceId, user.id);
      
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      // In a real app, this would call your backend to cancel the Stripe subscription
      toast.info('Subscription cancellation feature coming soon');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and view billing history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentPlan.name === 'Free' 
                  ? 'bg-gray-100 text-gray-600'
                  : currentPlan.name === 'Pro'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {currentPlan.name}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ${currentPlan.price}
                </div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {remainingCredits}
                </div>
                <div className="text-sm text-gray-600">credits remaining</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {usageStats.currentPeriodUsage}
                </div>
                <div className="text-sm text-gray-600">used this month</div>
              </div>
            </div>

            {/* Usage Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Usage this month</span>
                <span>{Math.round(usagePercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <SafeIcon icon={FiCheck} className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            {currentPlan.name === 'Free' && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleUpgrade('pro')}
                  variant="premium"
                  loading={loading}
                  className="flex-1"
                >
                  Upgrade to Pro
                </Button>
                <Button
                  onClick={() => handleUpgrade('business')}
                  variant="outline"
                  loading={loading}
                  className="flex-1"
                >
                  Upgrade to Business
                </Button>
              </div>
            )}

            {currentPlan.name !== 'Free' && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  className="flex-1"
                >
                  Cancel Subscription
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info('Manage subscription feature coming soon')}
                  className="flex-1"
                >
                  Manage Subscription
                </Button>
              </div>
            )}
          </Card>

          {/* Billing History */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
              <Button variant="outline" size="sm">
                <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <SafeIcon icon={FiCreditCard} className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {invoice.plan} Plan
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${invoice.amount}
                        </p>
                        <p className={`text-sm capitalize ${
                          invoice.status === 'paid' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {invoice.status}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <SafeIcon icon={FiDownload} className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiCreditCard} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No billing history available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiZap} className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-gray-600">Credits Used</span>
                </div>
                <span className="font-medium text-gray-900">
                  {totalCredits - remainingCredits}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiCalendar} className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">This Month</span>
                </div>
                <span className="font-medium text-gray-900">
                  {usageStats.currentPeriodUsage}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiDollarSign} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Spent</span>
                </div>
                <span className="font-medium text-gray-900">
                  ${usageStats.totalSpent}
                </span>
              </div>
            </div>
          </Card>

          {/* Upgrade Prompt */}
          {currentPlan.name === 'Free' && (
            <Card>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <SafeIcon icon={FiZap} className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Ready to upgrade?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get more credits and unlock premium features
                </p>
                <Button
                  onClick={() => handleUpgrade('pro')}
                  variant="premium"
                  size="sm"
                  className="w-full"
                  loading={loading}
                >
                  Upgrade Now
                </Button>
              </div>
            </Card>
          )}

          {/* Payment Method */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                <SafeIcon icon={FiCreditCard} className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  •••• •••• •••• 4242
                </p>
                <p className="text-xs text-gray-600">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              Update Payment Method
            </Button>
          </Card>

          {/* Support */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Have questions about billing or your subscription?
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Contact Support
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
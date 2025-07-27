import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { SUBSCRIPTION_PLANS } from '../lib/stripe';

const SubscriptionContext = createContext({});

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && userProfile) {
      fetchSubscription();
    }
  }, [user, userProfile]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlan = () => {
    if (!userProfile) return SUBSCRIPTION_PLANS.free;
    return SUBSCRIPTION_PLANS[userProfile.subscription_plan] || SUBSCRIPTION_PLANS.free;
  };

  const isSubscribed = () => {
    return userProfile?.subscription_plan !== 'free';
  };

  const canUseFeature = (feature) => {
    const plan = getCurrentPlan();
    
    switch (feature) {
      case 'unlimited_uploads':
        return plan.name !== 'Free';
      case 'all_formats':
        return plan.name !== 'Free';
      case 'priority_queue':
        return plan.name === 'Pro' || plan.name === 'Business';
      case 'api_access':
        return plan.name === 'Business';
      case 'team_support':
        return plan.name === 'Business';
      case 'white_label':
        return plan.name === 'Business';
      default:
        return true;
    }
  };

  const getRemainingCredits = () => {
    return userProfile?.credits_remaining || 0;
  };

  const getTotalCredits = () => {
    return userProfile?.credits_total || 0;
  };

  const getUsagePercentage = () => {
    const total = getTotalCredits();
    const remaining = getRemainingCredits();
    if (total === 0) return 0;
    return ((total - remaining) / total) * 100;
  };

  const value = {
    subscription,
    loading,
    getCurrentPlan,
    isSubscribed,
    canUseFeature,
    getRemainingCredits,
    getTotalCredits,
    getUsagePercentage,
    fetchSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
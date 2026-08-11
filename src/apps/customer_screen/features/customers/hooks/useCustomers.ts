import { useState, useEffect } from 'react';
import { Customer } from '../../../../../core/types';
import { fetchCustomers, addCustomer as apiAddCustomer, updateCustomer as apiUpdateCustomer } from '../customer.service';
import { supabase } from '../../../../../core/supabaseClient';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCustomers = async (showLoading = true) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Prevent 401 on initial mount before login

    if (showLoading) setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadCustomers(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addCustomer = async (newCustData: Partial<Customer>) => {
    try {
      await apiAddCustomer(newCustData);
      await loadCustomers();
    } catch (err) {
      console.error('Failed to add customer:', err);
    }
  };

  const updateCustomer = async (id: number, custData: Partial<Customer>) => {
    try {
      await apiUpdateCustomer(id, custData);
      await loadCustomers(false);
    } catch (err) {
      console.error('Failed to update customer:', err);
    }
  };

  return { customers, loading, addCustomer, updateCustomer };
};

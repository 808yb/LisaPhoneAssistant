import { useState, useEffect } from 'react';
import { Customer } from '../../../core/types';
import { fetchCustomers, addCustomer as apiAddCustomer } from '../customer.service';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const addCustomer = async (newCustData: Partial<Customer>) => {
    try {
      await apiAddCustomer(newCustData);
      await loadCustomers();
    } catch (err) {
      console.error('Failed to add customer:', err);
    }
  };

  return { customers, loading, addCustomer };
};

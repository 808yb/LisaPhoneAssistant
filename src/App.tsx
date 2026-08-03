import React, { useState, useEffect } from 'react';
import CustomerApp from './apps/customer_screen/CustomerApp';
import LisaHQApp from './apps/lisaHQ/LisaHQApp';

export default function App() {
  const [isHQ, setIsHQ] = useState(() => window.location.hash.startsWith('#hq'));

  useEffect(() => {
    const handleHashChange = () => {
      setIsHQ(window.location.hash.startsWith('#hq'));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return isHQ ? <LisaHQApp /> : <CustomerApp />;
}

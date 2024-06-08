import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const useInactivityLogout = (timeout: number = 60000) => { // Default to 1 minute
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Optional: To force a reload after logout
  };

  useEffect(() => {
    const handleActivity = () => resetTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    resetTimer(); // Start the timer

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  return null;
};

export default useInactivityLogout;

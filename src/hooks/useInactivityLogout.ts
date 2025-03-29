import { useEffect, useRef, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';

/**
 * Hook to automatically log out users after a period of inactivity
 * 
 * @param {number} timeout - Inactivity timeout in milliseconds (default: 15 minutes)
 * @returns {void}
 */
const useInactivityLogout = (timeout: number = 900000) => { // Default to 15 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user, signOut } = useAuthContext();

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      // No need to reload the page as AuthContext will handle the state change
    } catch (error) {
      console.error('Error during inactivity logout:', error);
    }
  }, [signOut]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Only set timer if user is logged in
    if (user) {
      timerRef.current = setTimeout(() => {
        handleLogout();
      }, timeout);
    }
  }, [user, timeout, handleLogout]);

  useEffect(() => {
    // Only set up listeners if user is logged in
    if (!user) return;

    const handleActivity = () => resetTimer();

    // User activity event listeners
    const events = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
      'focus', // Add window focus event
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, timeout, resetTimer]); // Include resetTimer in dependencies

  return null;
};

export default useInactivityLogout;

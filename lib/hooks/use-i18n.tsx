'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, translations, Translations } from '@/lib/i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  reloadLanguage: () => Promise<void>;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  const loadLanguageFromServer = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.user?.language && (data.user.language === 'en' || data.user.language === 'de')) {
          setLanguageState(data.user.language);
          localStorage.setItem('language', data.user.language);
          return true;
        }
      }
    } catch {
      console.log('User not logged in or profile fetch failed');
    }
    return false;
  };

  // Load language from localStorage and server on mount
  useEffect(() => {
    const loadLanguage = async () => {
      const serverLanguage = await loadLanguageFromServer();
      if (!serverLanguage) {
        // Fallback to localStorage
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
          setLanguageState(savedLanguage);
        }
      }
    };
    
    loadLanguage();
  }, []);

  const reloadLanguage = useCallback(async () => {
    const serverLanguage = await loadLanguageFromServer();
    if (!serverLanguage) {
      // Fallback to localStorage if server language not available
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
        setLanguageState(savedLanguage);
      }
    }
  }, []);

  // Check for language updates when user returns to the tab (e.g., after login)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the tab, check for language updates
        reloadLanguage();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language' && e.newValue) {
        // Language changed in another tab, update this tab
        const newLanguage = e.newValue as Language;
        if (newLanguage === 'en' || newLanguage === 'de') {
          setLanguageState(newLanguage);
        }
      }
    };

    // Listen for custom login events
    const handleLoginEvent = () => {
      // User logged in, reload language from server
      reloadLanguage();
    };

    // Listen for custom events that indicate user login
    window.addEventListener('user-login', handleLoginEvent);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('user-login', handleLoginEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reloadLanguage]);

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Save language preference to server
    try {
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLanguage }),
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
      // Don't throw error - language change should still work locally
    }
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    reloadLanguage,
    t: translations[language],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

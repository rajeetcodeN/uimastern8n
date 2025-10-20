import React from 'react';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="text-sm font-medium"
    >
      {language === 'en' ? 'DE' : 'EN'}
    </Button>
  );
};

export default LanguageSwitcher;

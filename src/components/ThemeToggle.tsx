import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ThemeToggle: React.FC = () => {
  const [isLight, setIsLight] = useState<boolean>(() => {
    try {
      return localStorage.getItem('theme') === 'light';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isLight) {
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.body.classList.remove('light');
        localStorage.setItem('theme', 'dark');
      }
    } catch (e) {
      console.warn('Failed to persist theme', e);
    }
  }, [isLight]);

  return (
    <Button size="sm" variant="outline" onClick={() => setIsLight(!isLight)}>
      {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

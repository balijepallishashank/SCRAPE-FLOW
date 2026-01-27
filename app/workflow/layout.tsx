import Logo from '@/components/Logo';
import { ModeToggle } from '@/components/ThemeModeToggle';
import React from 'react';
import { Separator } from '@/components/ui/separator'; 

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col w-full h-screen'>
      <Separator />
      {children}
      <footer className='flex items-center justify-between pr-2'>
        <Logo iconSize={16} fontSize="text-x1" />
        <ModeToggle />
      </footer>
    </div>
  );
}

export default layout;

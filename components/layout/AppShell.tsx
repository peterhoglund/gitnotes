import React from 'react';
import SidePanel from './SidePanel';

const AppShell: React.FC<{children: React.ReactNode}> = ({ children }) => {
    return (
        <div className="flex h-screen bg-white dark:bg-zinc-800">
            <SidePanel />
            {children}
        </div>
    );
}

export default AppShell;
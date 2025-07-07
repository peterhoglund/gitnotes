import React from 'react';
import SidePanel from './SidePanel';
import Modal from '../Modal';

const AppShell: React.FC<{children: React.ReactNode}> = ({ children }) => {
    return (
        <div className="flex h-screen bg-white dark:bg-zinc-800">
            <SidePanel />
            {children}
            <Modal />
        </div>
    );
}

export default AppShell;
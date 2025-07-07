import React, { createContext, useState, useCallback, ReactNode } from 'react';

type ModalType = 'prompt' | 'confirm' | 'alert';
type Variant = 'default' | 'danger';

interface ModalOptions {
    type: ModalType;
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    defaultValue?: string;
    placeholder?: string;
    variant?: Variant;
    onResolve: (value: any) => void;
}

interface ModalState {
    isOpen: boolean;
    options: ModalOptions | null;
}

interface ModalContextType {
    showPrompt: (options: { title: string; message: string; defaultValue?: string; placeholder?: string; confirmButtonText?: string; }) => Promise<string | null>;
    showConfirm: (options: { title: string; message: string; confirmButtonText?: string; variant?: Variant; }) => Promise<boolean>;
    showAlert: (options: { title: string; message: string; confirmButtonText?: string }) => Promise<void>;
    closeModal: (value: any) => void;
    modalState: ModalState;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, options: null });

    const show = useCallback((options: Omit<ModalOptions, 'onResolve'>) => {
        return new Promise((resolve) => {
            setModalState({
                isOpen: true,
                options: { ...options, onResolve: resolve },
            });
        });
    }, []);

    const showPrompt = useCallback((options: { title: string; message: string; defaultValue?: string; placeholder?: string; confirmButtonText?: string; }) => {
        return show({ ...options, type: 'prompt' }) as Promise<string | null>;
    }, [show]);

    const showConfirm = useCallback((options: { title: string; message: string; confirmButtonText?: string; variant?: Variant; }) => {
        return show({ ...options, type: 'confirm' }) as Promise<boolean>;
    }, [show]);

    const showAlert = useCallback((options: { title: string; message: string; confirmButtonText?: string; }) => {
        return show({ ...options, type: 'alert' }) as Promise<void>;
    }, [show]);
    
    const closeModal = useCallback((value: any) => {
        if (modalState.options) {
            modalState.options.onResolve(value);
        }
        setModalState({ isOpen: false, options: null });
    }, [modalState]);

    const value = {
        showPrompt,
        showConfirm,
        showAlert,
        closeModal,
        modalState,
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

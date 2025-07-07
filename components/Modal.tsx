import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useModal } from '../hooks/useModal';

const Modal: React.FC = () => {
    const { modalState, closeModal } = useModal();
    const { isOpen, options } = modalState;
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && options) {
            if (options.type === 'prompt') {
                setInputValue(options.defaultValue || '');
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        }
    }, [isOpen, options]);

    const handleConfirm = useCallback(() => {
        if (!options) return;
        const result = options.type === 'prompt' ? inputValue : (options.type === 'confirm' ? true : undefined);
        closeModal(result);
    }, [options, inputValue, closeModal]);
    
    const handleCancel = useCallback(() => {
        const result = options?.type === 'prompt' ? null : false;
        closeModal(result);
    }, [options, closeModal]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleCancel]);
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleConfirm();
    };

    if (!isOpen || !options) {
        return null;
    }
    
    const confirmButtonClasses = `modal-button confirm ${options.variant === 'danger' ? 'danger' : ''}`;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={handleCancel}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleFormSubmit}>
                    <h2 id="modal-title" className="modal-title">{options.title}</h2>
                    <p className="modal-message">{options.message}</p>
                    
                    {options.type === 'prompt' && (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={options.placeholder}
                            className="modal-input"
                            required
                        />
                    )}

                    <div className="modal-actions">
                        {options.type !== 'alert' && (
                           <button type="button" onClick={handleCancel} className="modal-button cancel">
                                {options.cancelButtonText || 'Cancel'}
                            </button>
                        )}
                        <button type="submit" className={confirmButtonClasses}>
                            {options.confirmButtonText || 'OK'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Modal;

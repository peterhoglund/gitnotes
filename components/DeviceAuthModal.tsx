import React from 'react';
import { useGitHub } from '../hooks/useGitHub';

const DeviceAuthModal: React.FC = () => {
    const { deviceAuthInfo, isLoading } = useGitHub();

    if (!deviceAuthInfo) {
        return null;
    }

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-content text-gray-800 dark:text-gray-200">
                <h2 className="text-xl font-bold mb-2">Sign in to GitHub</h2>
                <p>To continue, go to the URL below and enter the code.</p>
                <a 
                    href={deviceAuthInfo.verification_uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline my-4 block"
                >
                    {deviceAuthInfo.verification_uri}
                </a>
                
                <p>Your one-time code:</p>
                <div className="user-code">
                    {deviceAuthInfo.user_code}
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center mt-4">
                        <div className="loading-spinner mr-2"></div>
                        <span>Waiting for authorization...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeviceAuthModal;

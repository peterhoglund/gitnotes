import React from 'react';
import { useGitHub } from '../hooks/useGitHub';
import { SaveIcon } from './icons';

const ToolbarSaveButton = () => {
    const { activeFile, isSaving, saveFile } = useGitHub();

    const canSave = activeFile?.isDirty && !isSaving;

    return (
        <button
            title="Save (Cmd+S)"
            disabled={!canSave}
            onClick={saveFile}
            className="toolbar-button p-2 rounded flex items-center justify-center"
        >
            {isSaving ? <div className="loading-spinner"></div> : <SaveIcon />}
        </button>
    );
};

export default ToolbarSaveButton;

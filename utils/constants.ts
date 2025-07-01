import { FormatState } from '../types/format';

export const TRANSPARENT = 'transparent';

export const INITIAL_STATE: FormatState = {
	isBold: false,
	isItalic: false,
	isUnderline: false,
	isStrikethrough: false,
	isCode: false,
	isUl: false,
	isOl: false,
	blockType: 'p',
	color: '#0a0a0a',
	isJustifyLeft: true,
	isJustifyCenter: false,
	isJustifyRight: false,
	isJustifyFull: false,
	highlightColor: TRANSPARENT,
	blockBackgroundColor: TRANSPARENT,
};

export const INITIAL_CONTENT = `
	<h1>Welcome to Zen Editor!</h1>
	<p>This is your new document. Start typing here.</p>
    <p>You can log in with your GitHub account via the profile menu in the bottom-left to save your files. A private repository named <code>web-docs</code> will be created for you automatically.</p>
	<p>Enjoy your distraction-free writing experience!</p>
`;

export const LANGUAGES = [
  { value: 'text', label: 'Text' },
  { value: 'js', label: 'JavaScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML/XML' },
  { value: 'py', label: 'Python' },
  { value: 'bash', label: 'Bash' },
];
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
	<h1>Title</h1>
	<h2>Header</h2>
	<h3>Subheader</h3>
	<p>This is a paragraph of normal text. Use the toolbar to style your content.</p>
	<h6>This is an example of small text, useful for notes or captions.</h6>
<pre><code class="language-js">
// This is a code block.
// Hover over the top-right corner to change the language!
function helloWorld() {
  console.log("Hello, from the Zen Editor!");
}

helloWorld();
</code></pre>
	<p><b>New:</b> Try typing <code>-&nbsp;</code> or <code>1.&nbsp;</code> at the start of a line and press space to automatically create a list!</p>
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

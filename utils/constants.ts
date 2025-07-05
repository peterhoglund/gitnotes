export const TRANSPARENT = 'transparent';

export const INITIAL_CONTENT = `
	<h1>Title</h1>
	<h2>Header</h2>
	<h3>Subheader</h3>
	<p>This is a paragraph of normal text. Use the toolbar to style your content.</p>
	<h6>This is an example of small text, useful for notes or captions.</h6>
<pre><code class="language-js">
// This is a code block.
// Select text or place your cursor here to see the language selector!
function helloWorld() {
  console.log("Hello, from the Zen Editor!");
}

helloWorld();
</code></pre>
	<p><b>New:</b> Lists are created automatically! Try typing <code>-&nbsp;</code> or <code>1.&nbsp;</code> at the start of a line and press space.</p>
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

export const EMOJIS = ['💡', 'ℹ️', '⚠️', '✅', '👍', '📌', '💬', '🔥', '🎯', '🎉', '❓', '🛑'];

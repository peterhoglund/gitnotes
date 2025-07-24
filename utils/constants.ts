export const TRANSPARENT = 'transparent';

export const INITIAL_CONTENT = `
	<h1>Title</h1>
	<h2>Header</h2>
	<h3>Subheader</h3>
	<p>This is a paragraph of normal text. Use the toolbar to style your content.</p>
  <table>
    <tr>
      <th><p>Company</p></th>
      <th><p>Contact</p></th>
      <th><p>Country</p></th>
    </tr>
    <tr>
      <td><p>Alfreds Futterkiste</p></td>
      <td><p>Maria Anders</p></td>
      <td><p>Germany</p></td>
    </tr>
    <tr>
      <td><p>Centro comercial Moctezuma</p></td>
      <td><p>Francisco Chang</p></td>
      <td><p>Mexico</p></td>
    </tr>
  </table>
  <h6>This is an example of small text, useful for notes or captions.</h6>
<pre><code class="language-js">
// This is a code block.
// Select text or place your cursor here to see the language selector!
function helloWorld() {
  console.log("Hello, from Plita!");
}

helloWorld();
</code></pre>
	<p><b>New:</b> Lists are created automatically! Try typing <code>-&nbsp;</code> or <code>1.&nbsp;</code> at the start of a line and press space.</p>
`;

export const LANGUAGES = [
  { value: 'js', label: 'JavaScript' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'py', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'php', label: 'PHP' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'swift', label: 'Swift' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'text', label: 'Text' },
];

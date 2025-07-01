export const rgbToHex = (rgb: string): string => {
	if (!rgb || !rgb.startsWith('rgb')) return rgb; // Return original if not a standard rgb string
	const m = rgb.match(/\d+/g);
	if (!m) return rgb;
	const [r, g, b] = m.map(Number);
	const h = (c: number) => `0${c.toString(16)}`.slice(-2);
	return `#${h(r)}${h(g)}${h(b)}`;
};

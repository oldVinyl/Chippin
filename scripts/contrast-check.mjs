const pairs = [
  ['Cocoa on cream', '#442d1c', '#fffaf1'],
  ['Cocoa on batter', '#442d1c', '#e8d1a7'],
  ['Cocoa on peach', '#442d1c', '#f4e7cf'],
  ['Cocoa on green', '#442d1c', '#e8eadb'],
  ['Cream on wine', '#fffaf1', '#743014'],
  ['Wine on cream', '#743014', '#fffaf1'],
];
function lum(hex) {
  const c = hex
    .match(/[a-f\d]{2}/gi)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
for (const [name, text, bg] of pairs) {
  const a = lum(text),
    b = lum(bg),
    ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  if (ratio < 4.5) throw new Error(`${name}: ${ratio.toFixed(2)} fails AA`);
  console.log(`${name}: ${ratio.toFixed(2)}:1`);
}

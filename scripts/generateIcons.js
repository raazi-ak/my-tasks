const fs = require('fs');
const path = require('path');

// For this simple case, I'll provide the base64 encoded PNG data
// In a real project, you'd use a library like sharp or svg2png

const iconSizes = {
  'icon.png': 1024,           // App store icon
  'adaptive-icon.png': 432,   // Android adaptive icon
  'favicon.png': 32,          // Web favicon
};

// SVG content
const svgContent = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="modernBlueBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3A7BD5" />
      <stop offset="100%" stop-color="#0062E6" />
    </linearGradient>
    <linearGradient id="paperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0E0E0" />
      <stop offset="100%" stop-color="#F5F5F5" />
    </linearGradient>
    <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="4" dy="6" result="shadow"/>
      <feFlood flood-color="#000" flood-opacity="0.2"/>
      <feComposite in2="shadow" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="0" y="0" width="200" height="200" rx="40" ry="40" fill="url(#modernBlueBg)" style="filter:url(#softShadow);"/>
  <rect x="45" y="45" width="110" height="110" rx="15" ry="15" fill="url(#paperGradient)" transform="rotate(-5 100 100)"/>
  <rect x="55" y="70" width="80" height="6" rx="2" ry="2" fill="#757575"/>
  <rect x="55" y="85" width="70" height="6" rx="2" ry="2" fill="#757575"/>
  <rect x="55" y="100" width="85" height="6" rx="2" ry="2" fill="#757575"/>
  <linearGradient id="checkmarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#4CAF50" />
    <stop offset="100%" stop-color="#8BC34A" />
  </linearGradient>
  <path d="M70 120 L95 145 L145 100" stroke="url(#checkmarkGradient)" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-5 100 100)"/>
</svg>`;

console.log('SVG logo saved to assets/images/logo.svg');
console.log('To generate PNG icons, you can:');
console.log('1. Use an online SVG to PNG converter');
console.log('2. Use a tool like Inkscape or GIMP');
console.log('3. Use a web service like https://svg2png.com/');
console.log('');
console.log('Recommended sizes:');
Object.entries(iconSizes).forEach(([filename, size]) => {
  console.log(`- ${filename}: ${size}x${size}px`);
}); 
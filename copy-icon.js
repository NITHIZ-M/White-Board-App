const fs = require('fs');
const path = require('path');

const source = 'C:\\Users\\Nithish\\.gemini\\antigravity-ide\\brain\\4099d95d-5c71-442e-893b-7507e0ac8bd6\\media__1780349888629.png';
const dest = path.join(__dirname, 'assets', 'icon.png');

try {
  fs.copyFileSync(source, dest);
  console.log('Successfully copied icon.png');
} catch (err) {
  console.error('Error copying icon:', err);
}

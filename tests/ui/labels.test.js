const fs = require('fs');
const path = require('path');

describe('index.html — Bug 14: wrong-ui-copy-or-label', () => {
  it('spells the Analytics section header correctly', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/index.html'), 'utf8');
    expect(html).toMatch(/<h2>\s*Analytics\s*<\/h2>/);
  });
});

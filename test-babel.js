const fs = require('fs');
const html = fs.readFileSync('outreach-crm-standalone.html', 'utf8');
const match = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/);
if (match) {
  const code = match[1];
  try {
    const babel = require('./libs/babel.min.js');
    console.log('Babel loaded. Object keys:', Object.keys(babel));
    
    let res = babel.transform(code, { presets: ['react'] });
    console.log('SUCCESS');
    if (res.code.includes('import')) {
      console.log('IMPORT FOUND IN OUTPUT:');
      console.log(res.code.split('\n').filter(l => l.includes('import')).join('\n'));
    }
    else console.log('NO IMPORT FOUND');
  } catch (e) {
    console.error('ERROR:', e.message);
  }
} else {
  console.log('No script block found');
}

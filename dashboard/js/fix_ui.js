const fs = require('fs');
let c = fs.readFileSync('dashboard/js/ui.js', 'utf8');
c = c.replace(/\\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('dashboard/js/ui.js', c);
console.log('Fixed ui.js escaping issues');

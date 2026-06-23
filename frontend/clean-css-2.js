const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf-8');

css = css.replace(/border-color:\s*#00ff00\s+#004400\s+#004400\s+#00ff00;/g, 'border-color: #ffffff #555555 #555555 #ffffff;');
css = css.replace(/border:\s*1px solid #00ff00;/g, 'border: 1px solid #ffffff;');
css = css.replace(/background:\s*#00aa00;/g, 'background: #333333;');
css = css.replace(/background:\s*#00cc00;/g, 'background: #444444;');
css = css.replace(/color:\s*#00aa00;/g, 'color: #ffffff;');

fs.writeFileSync('app/globals.css', css);
console.log('Final CSS cleanup done.');

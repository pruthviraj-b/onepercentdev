const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf-8');

// Remove dark theme rules
css = css.replace(/\[data-theme="dark"\]\s*\{[^}]+\}/g, '');
css = css.replace(/\[data-theme="dark"\]\s*[^{]+\{[^}]+\}/g, '');

// Remove renaissance theme rules
css = css.replace(/\[data-theme="renaissance"\]\s*\{[^}]+\}/g, '');
css = css.replace(/\[data-theme="renaissance"\]\s*[^{]+\{[^}]+\}/g, '');

// Remove course specific themes
css = css.replace(/\.course-theme-python\s*\{[^}]+\}/g, '');
css = css.replace(/\.course-theme-cloud\s*\{[^}]+\}/g, '');
css = css.replace(/\[data-theme="dark"\]\s*\.course-theme-(python|cloud)\s*\{[^}]+\}/g, '');

// Make playground/terminal pure black with clean white text
// Fix video-empty
css = css.replace(/color:\s*#00ff00;\s*\/\*\s*green like old monitors\s*\*\//g, 'color: #ffffff; /* clean white */');
// Fix code-block-body pre
css = css.replace(/color:\s*#00ff00;\s*\/\*\s*green phosphor terminal\s*\*\//g, 'color: #ffffff;');
// Fix line numbers
css = css.replace(/background:\s*#001a00;/g, 'background: #000000;');
css = css.replace(/color:\s*#008000;/g, 'color: #666666;');
css = css.replace(/border-right:\s*1px solid #003300;/g, 'border-right: 1px solid #333333;');
// Fix code editor
css = css.replace(/color:\s*#00ff00;/g, 'color: #ffffff;');
css = css.replace(/caret-color:\s*#00ff00;/g, 'caret-color: #ffffff;');
css = css.replace(/color:\s*#004400;/g, 'color: #555555;');
// Fix output
css = css.replace(/\.output-out\s*\{\s*color:\s*#00ff00;\s*\}/g, '.output-out { color: #ffffff; }');
css = css.replace(/\.output-info\s*\{\s*color:\s*#ffff00;\s*\}/g, '.output-info { color: #f1be3e; }');

// Make video skeleton pure black
css = css.replace(/background:\s*#000033;/g, 'background: #000000;');

fs.writeFileSync('app/globals.css', css);
console.log('CSS cleaned.');

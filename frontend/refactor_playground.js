const fs = require('fs');
let code = fs.readFileSync('components/Playground.tsx', 'utf-8');

// 1. Remove Linux Terminal State
code = code.replace(/\/\/ -- Linux Terminal State --[\s\S]*?\/\/ -- Console Output State --/, '// -- Console Output State --');

// 2. Remove terminalOutputRef usage
code = code.replace(/const terminalOutputRef = useRef<HTMLDivElement>\(null\);/, '');
code = code.replace(/useEffect\(\(\) => \{\s*if \(terminalOutputRef\.current\) \{\s*terminalOutputRef\.current\.scrollTop = terminalOutputRef\.current\.scrollHeight;\s*\}\s*\}, \[terminalHistory\]\);/, '');

// 3. Remove handleTerminalSubmit (Lines 306-430 roughly)
code = code.replace(/const handleTerminalSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?const updateFileCode/m, 'const updateFileCode');

// 4. Replace isCloud render block
const isCloudRegex = /\{isCloud \? \([\s\S]*?\) : \(/;
const newIsCloudBlock = \{isCloud ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000000', border: '2px solid #000000', borderRadius: '0' }}>
          <div className="playground-header hacker-header">
            <div className="playground-title">
              <span className="playground-icon hacker-title-text" style={{ color: '#ffffff', textShadow: 'none' }}>? LINUX TERMINAL Sandbox</span>
            </div>
          </div>
          <iframe 
            src="https://webterm.app/en/free-play" 
            style={{ flex: 1, width: '100%', border: 'none', background: '#000000' }}
            title="Linux Terminal Sandbox"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      ) : (\;
code = code.replace(isCloudRegex, newIsCloudBlock);

// 5. Replace inline styles to make it clean (pure black bg, white/grey text)
// Replace .hacker-theme colors
code = code.replace(/background:\s*#050a05\s*!important;/g, 'background: #000000 !important;');
code = code.replace(/border:\s*2px solid #00ff00\s*!important;/g, 'border: 2px solid #333333 !important;');
code = code.replace(/box-shadow:\s*0 0 15px rgba\(0, 255, 0, 0\.2\)\s*!important;/g, 'box-shadow: none !important;');
code = code.replace(/color:\s*#00ff00\s*!important;/g, 'color: #ffffff !important;');

// Replace CRT filter
code = code.replace(/background: linear-gradient.*?;/g, 'background: transparent; display: none;');

// hacker header
code = code.replace(/background:\s*#001f00\s*!important;/g, 'background: #000000 !important;');
code = code.replace(/border-bottom:\s*2px solid #00ff00\s*!important;/g, 'border-bottom: 1px solid #333333 !important;');

// text shadow and colors
code = code.replace(/text-shadow:\s*0 0 5px #00ff00;/g, 'text-shadow: none;');
code = code.replace(/text-shadow:\s*0 0 4px #00ff00;/g, 'text-shadow: none;');
code = code.replace(/text-shadow:\s*0 0 3px #00ff00;/g, 'text-shadow: none;');
code = code.replace(/text-shadow:\s*0 0 3px #00ffff;/g, 'text-shadow: none;');
code = code.replace(/text-shadow:\s*0 0 3px #ffffff;/g, 'text-shadow: none;');
code = code.replace(/text-shadow:\s*0 0 3px #ff3333;/g, 'text-shadow: none;');
code = code.replace(/box-shadow:\s*0 0 10px #00ff00;/g, 'box-shadow: none;');

// buttons
code = code.replace(/border:\s*1px solid #00ff00\s*!important;/g, 'border: 1px solid #444444 !important; border-radius: 4px !important;');
code = code.replace(/\.hacker-btn:hover:not\(:disabled\) \{\s*background:\s*#00ff00\s*!important;\s*color:\s*#050a05\s*!important;/g, '.hacker-btn:hover:not(:disabled) { background: #333333 !important; color: #ffffff !important;');
code = code.replace(/border-color:\s*#004400\s*!important;/g, 'border-color: #333333 !important;');
code = code.replace(/color:\s*#004400\s*!important;/g, 'color: #555555 !important;');
code = code.replace(/\.hacker-btn\.active-run \{\s*border-color:\s*#00ff00\s*!important;\s*background:\s*#00ff00\s*!important;\s*color:\s*#000000\s*!important;/g, '.hacker-btn.active-run { border-color: #ffffff !important; background: #ffffff !important; color: #000000 !important;');

// Tabs
code = code.replace(/background:\s*#001200;/g, 'background: #000000;');
code = code.replace(/border-bottom:\s*1px solid #003a00;/g, 'border-bottom: 1px solid #333333;');
code = code.replace(/color:\s*#00aa00;/g, 'color: #999999;');
code = code.replace(/border-right:\s*1px solid #002200;/g, 'border-right: 1px solid #333333;');
code = code.replace(/\.w-tab\.active \{\s*color:\s*#00ff00;\s*text-shadow: none;\s*background:\s*#050a05;\s*border-bottom:\s*2px solid #00ff00;/g, '.w-tab.active { color: #ffffff; text-shadow: none; background: #111111; border-bottom: 2px solid #ffffff;');
code = code.replace(/background:\s*rgba\(0, 255, 0, 0\.05\);/g, 'background: #111111;');
code = code.replace(/color:\s*#005500;/g, 'color: #555555;');

// Trace visuals
code = code.replace(/border-right:\s*2px solid #003300;/g, 'border-right: 1px solid #333333;');
code = code.replace(/background:\s*#030603;/g, 'background: #000000;');
code = code.replace(/background:\s*#002200;/g, 'background: #222222;');
code = code.replace(/border-left:\s*3px solid #00ff00;/g, 'border-left: 3px solid #ffffff;');
code = code.replace(/color:\s*#008800;/g, 'color: #666666;');
code = code.replace(/border:\s*1px solid #00ff00;/g, 'border: 1px solid #444444;');
code = code.replace(/background:\s*rgba\(0, 30, 0, 0\.3\);/g, 'background: #000000;');
code = code.replace(/border-bottom:\s*1px dashed #00ff00;/g, 'border-bottom: 1px dashed #444444;');
code = code.replace(/background:\s*rgba\(0, 255, 0, 0\.03\);/g, 'background: transparent;');
code = code.replace(/border:\s*1px solid #003300;/g, 'border: 1px solid #222222;');
code = code.replace(/color:\s*#88ff88;/g, 'color: #aaaaaa;');
code = code.replace(/color:\s*#00ffff;/g, 'color: #66b3ff;');
code = code.replace(/border:\s*1px solid #00ffff;/g, 'border: 1px solid #444444;');
code = code.replace(/background:\s*rgba\(0, 40, 40, 0\.2\);/g, 'background: #0a0a0a;');
code = code.replace(/border-color:\s*#00ff00;/g, 'border-color: #ffffff;');
code = code.replace(/border-bottom:\s*1px dashed #008888;/g, 'border-bottom: 1px dashed #444444;');
code = code.replace(/border:\s*1px solid #008888;/g, 'border: 1px solid #333333;');

// Output Panel
code = code.replace(/borderTopColor:\s*'#00ff00'/g, "borderTopColor: '#333333'");
code = code.replace(/color:\s*line\.type === 'err' \? '#ff3333' : line\.type === 'info' \? '#00ffff' : '#00ff00'/g, "color: line.type === 'err' ? '#ff4444' : line.type === 'info' ? '#a3b2be' : '#ffffff'");

// Remove more inline #00ff00 references
code = code.replace(/'#00ff00'/g, "'#ffffff'");
code = code.replace(/'#00ffff'/g, "'#a3b2be'");
code = code.replace(/'#ff3333'/g, "'#ff4444'");
code = code.replace(/'#004400'/g, "'#666666'");

fs.writeFileSync('components/Playground.tsx', code);
console.log('Refactored Playground.tsx');

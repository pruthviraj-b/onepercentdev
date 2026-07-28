const fs=require("fs"), path=require("path");
const root=path.join(process.cwd(),"content","excel");
function w(p,content){ const d=path.join(root,"Part-"+p); fs.mkdirSync(d,{recursive:true}); fs.writeFileSync(path.join(d,"notes.md"),content,"utf-8"); console.log("written Part-"+p); }

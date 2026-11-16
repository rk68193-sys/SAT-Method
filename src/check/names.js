/* Every name the page's script declares at its top is declared once. assemble.py joins the site's files (src/site/*.js)
   into one function, so they share one set of names: when two files declare the same function or var, the browser says
   nothing, the one it reads last replaces the other, and whatever used the first one quietly breaks. This lists the names
   each file declares at the top and fails on a name declared twice, saying where.
   node --expose-internals src/check/names.js   (the flag lends the check Node's own JavaScript parser, acorn) */
const fs = require('fs'), path = require('path');
let acorn;
try { acorn = require('acorn'); } catch (e) {
  try { acorn = require('internal/deps/acorn/acorn/dist/acorn'); } catch (e2) {
    console.error('Could not load a JavaScript parser: run this as node --expose-internals src/check/names.js'); process.exit(1);
  }
}
const site = path.join(__dirname, '..', 'site');
/* the files, in the order assemble.py joins them */
const m = fs.readFileSync(path.join(site, 'assemble.py'), 'utf8').match(/^parts = \[([^\]]*)\]/m);
if (!m) { console.error('Could not find the list of files (parts = [...]) in assemble.py'); process.exit(1); }
const parts = m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
const head = "(function () {\n  'use strict';\n";
let js = head;
const from = [];
parts.forEach(f => { from.push([js.length, f]); js += fs.readFileSync(path.join(site, f), 'utf8'); });
js += '}());\n';
const ast = acorn.parse(js, { ecmaVersion: 'latest', locations: true });
const top = ast.body[0].expression.callee.body.body;
function where(node) {
  let f = from[0];
  for (const x of from) { if (x[0] <= node.start) { f = x; } }
  const line = js.slice(0, f[0]).split('\n').length;
  return f[1] + ':' + (node.loc.start.line - line + 1);
}
function ids(p, out) {
  if (!p) { return out; }
  if (p.type === 'Identifier') { out.push(p); }
  else if (p.type === 'ObjectPattern') { p.properties.forEach(x => ids(x.value || x.argument, out)); }
  else if (p.type === 'ArrayPattern') { p.elements.forEach(x => ids(x, out)); }
  else if (p.type === 'RestElement') { ids(p.argument, out); }
  else if (p.type === 'AssignmentPattern') { ids(p.left, out); }
  return out;
}
const seen = {};
let n = 0;
top.forEach(st => {
  let names = [];
  if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') { names = [st.id]; }
  else if (st.type === 'VariableDeclaration') { st.declarations.forEach(d => ids(d.id, names)); }
  names.forEach(id => { n++; (seen[id.name] = seen[id.name] || []).push(where(id)); });
});
const twice = Object.keys(seen).filter(k => seen[k].length > 1);
twice.forEach(k => console.log('FAIL ' + k + ' is declared more than once: ' + seen[k].join(', ')));
console.log((twice.length ? twice.length + ' names declared twice' : 'ok   all ' + n + ' top-level names are declared once') + ', in ' + parts.length + ' files');
process.exit(twice.length ? 1 : 0);

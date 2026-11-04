import fs from 'fs';
import path from 'path';

function walk(dir, acc = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		if (e.name === 'node_modules' || e.name === '.svelte-kit') continue;
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p, acc);
		else if (p.endsWith('.svelte')) acc.push(p);
	}
	return acc;
}

const files = walk('src');
let n = 0;
for (const f of files) {
	let s = fs.readFileSync(f, 'utf8');
	const orig = s;
	s = s.replace(/let \{([^}]+)\} = \$props<\{([^}]+)\}>\(\);/g, 'let {$1}: { $2 } = $props();');
	s = s.replace(/children: any/g, 'children: import("svelte").Snippet');
	if (s !== orig) {
		fs.writeFileSync(f, s);
		n++;
		console.log('fixed', f);
	}
}
console.log('count', n);

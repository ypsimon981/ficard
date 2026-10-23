// Inspect the optimized DEX, not just source rules: R8 must retain the annotation
// lookup used by every Capacitor permission request (capacitor#8589).
const fs=require('node:fs'),assert=require('node:assert/strict');
const dump=fs.readFileSync(process.argv[2],'utf8');
for(const name of ['CapacitorPlugin','Permission'])
 assert.ok(dump.includes('Lcom/getcapacitor/annotation/'+name+';'),'Missing runtime annotation '+name);
const methods=[...dump.matchAll(/name\s*:\s*'getPluginAnnotation'([\s\S]*?)(?=\n\s*#\d|Class #|$)/g)];
assert.ok(methods.some(m=>m[1].includes('iget-object')),'PluginHandle annotation getter missing or folded to null by R8');
console.log('Optimized DEX verified: Capacitor permission annotations and live annotation getter retained.');

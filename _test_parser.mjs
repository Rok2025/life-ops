import fs from 'fs';

const md = fs.readFileSync('/Users/freeman/Downloads/longman_3000.md', 'utf8');

// Check file basics
console.log('File size:', md.length, 'chars');
console.log('First 3 bytes hex:', Buffer.from(md.slice(0, 3)).toString('hex'));

const ENTRY_PATTERN = /^-\s+(.+?)\s+\(([^)]+)\)(?:\s+\[([^\]]+)\])?\s*$/;
const HEADING_PATTERN = /^##\s+(.+?)\s*$/;

function normalizeLevels(raw) {
    if (!raw) return [];
    return raw.split(',').map(l => l.trim()).filter(l => ['S1','S2','S3','W1','W2','W3'].includes(l));
}

const lines = md.split(/\r?\n/);
const entries = [];
const seen = new Set();
let currentInitial = 'A';
const unmatched = [];

for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    
    const headingMatch = line.match(HEADING_PATTERN);
    if (headingMatch) {
        currentInitial = headingMatch[1].trim().toUpperCase() || currentInitial;
        continue;
    }
    
    const entryMatch = line.match(ENTRY_PATTERN);
    if (!entryMatch) {
        if (line.startsWith('- ')) unmatched.push(line);
        continue;
    }
    
    const term = entryMatch[1].trim();
    const pos = entryMatch[2].trim();
    if (!term || !pos) continue;
    
    const key = `${term.toLowerCase()}::${pos.toLowerCase()}::longman_3000`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    entries.push({ term, pos, levels: normalizeLevels(entryMatch[3]), initial: currentInitial || term.charAt(0).toUpperCase(), source: 'longman_3000' });
}

console.log('Total parsed entries:', entries.length);
console.log('Unmatched dash lines:', unmatched.length);
if (unmatched.length > 0) {
    unmatched.forEach(l => console.log('  UNMATCHED:', JSON.stringify(l)));
}

// Check for any entries with unusual data
const longTerms = entries.filter(e => e.term.length > 30);
if (longTerms.length > 0) {
    console.log('Long terms:', longTerms.map(e => e.term));
}

const emptyPos = entries.filter(e => !e.pos);
console.log('Empty pos entries:', emptyPos.length);

const emptyInitial = entries.filter(e => !e.initial);
console.log('Empty initial entries:', emptyInitial.length);

// Sample first 5 and last 5
console.log('First 5:', JSON.stringify(entries.slice(0, 5)));
console.log('Last 5:', JSON.stringify(entries.slice(-5)));

// Check batch size issue
const BATCH_SIZE = 200;
const batchCount = Math.ceil(entries.length / BATCH_SIZE);
console.log('Batch count:', batchCount, '(batch size:', BATCH_SIZE, ')');

// Estimate JSON payload size for one batch
const sampleBatch = entries.slice(0, BATCH_SIZE);
const payloadSize = JSON.stringify(sampleBatch).length;
console.log('Sample batch JSON size:', payloadSize, 'bytes');

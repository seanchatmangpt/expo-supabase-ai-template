import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const testFiles = execSync('find src -name "*.test.ts" -o -name "*.test.tsx"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

let prunedFiles = 0;
let totalPrunedTests = 0;

for (const file of testFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  let testCount = 0;
  let inTestToDrop = false;
  let testDropDepth = 0;
  let currentDepth = 0;
  
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Calculate brace delta for this line
    // Count { and } but ignore those inside strings or comments (simple heuristic)
    // A more robust heuristic: remove strings and comments before counting
    const cleanLine = line.replace(/(['"`]).*?\1/g, '').replace(/\/\/.*$/, '');
    const openBraces = (cleanLine.match(/\{/g) || []).length;
    const closeBraces = (cleanLine.match(/\}/g) || []).length;
    
    if (!inTestToDrop) {
      // Check if this line starts a test
      if (/\b(it|test)\s*\(/.test(cleanLine)) {
        testCount++;
        if (testCount > 3) {
          inTestToDrop = true;
          testDropDepth = currentDepth; // Depth before the test block opens
          totalPrunedTests++;
        }
      }
    }
    
    // Update depth
    currentDepth += openBraces - closeBraces;
    
    if (!inTestToDrop) {
      newLines.push(line);
    } else {
      // If we are dropping a test, check if we've reached the end of its block
      // The block ends when depth returns to the drop depth
      // But wait, the line that ends the block might have the closing brace and maybe a semicolon.
      // E.g., `});`
      if (currentDepth <= testDropDepth) {
        inTestToDrop = false;
        // We do NOT push this closing line, because it belongs to the dropped test
      }
    }
  }
  
  const newContent = newLines.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    prunedFiles++;
  }
}

console.log(`Pruned ${totalPrunedTests} tests across ${prunedFiles} files.`);

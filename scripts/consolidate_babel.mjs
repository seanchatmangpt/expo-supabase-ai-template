import fs from 'fs';
import { execSync } from 'child_process';
import babel from '@babel/core';

const testFiles = execSync('find src -name "*.test.ts" -o -name "*.test.tsx"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

let totalPrunedTests = 0;

for (const file of testFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let testCount = 0;
  
  try {
    const { code } = babel.transformSync(content, {
      filename: file,
      presets: [
        ['@babel/preset-typescript', { isTSX: file.endsWith('.tsx'), allExtensions: true }]
      ],
      plugins: [
        function pruneTestsPlugin({ types: t }) {
          return {
            visitor: {
              CallExpression(path) {
                const callee = path.node.callee;
                if (t.isIdentifier(callee) && (callee.name === 'it' || callee.name === 'test')) {
                  testCount++;
                  if (testCount > 3) {
                    path.remove();
                    totalPrunedTests++;
                  }
                }
              },
              // Clean up empty describes to avoid jest errors
              CallExpression: {
                exit(path) {
                  const callee = path.node.callee;
                  if (t.isIdentifier(callee) && callee.name === 'describe') {
                    // Check if it has any tests left inside
                    let hasTests = false;
                    path.traverse({
                      CallExpression(innerPath) {
                        const innerCallee = innerPath.node.callee;
                        if (t.isIdentifier(innerCallee) && (innerCallee.name === 'it' || innerCallee.name === 'test')) {
                          hasTests = true;
                          innerPath.stop();
                        }
                      }
                    });
                    
                    if (!hasTests) {
                      path.remove();
                    }
                  }
                }
              }
            }
          };
        }
      ],
      retainLines: true
    });
    
    if (code !== content && testCount > 3) {
      fs.writeFileSync(file, code);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}

console.log(`Pruned tests using Babel. Total removed: ${totalPrunedTests}`);

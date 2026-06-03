import fs from 'fs';
import { execSync } from 'child_process';
import babel from '@babel/core';

const testFiles = execSync('find src -name "*.test.ts" -o -name "*.test.tsx"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

for (const file of testFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  try {
    const { code } = babel.transformSync(content, {
      filename: file,
      presets: [
        ['@babel/preset-typescript', { isTSX: file.endsWith('.tsx'), allExtensions: true }]
      ],
      plugins: [
        function pruneHooksPlugin({ types: t }) {
          return {
            visitor: {
              CallExpression(path) {
                const callee = path.node.callee;
                if (t.isIdentifier(callee) && ['beforeEach', 'afterEach', 'beforeAll', 'afterAll'].includes(callee.name)) {
                  // Find parent describe block
                  let describePath = path.findParent(p => 
                    p.isCallExpression() && t.isIdentifier(p.node.callee) && p.node.callee.name === 'describe'
                  );
                  
                  if (describePath) {
                    let hasTests = false;
                    describePath.traverse({
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
                  } else {
                    // Top level hook. Check if file has any tests at all.
                    let fileHasTests = false;
                    path.findParent(p => p.isProgram()).traverse({
                      CallExpression(innerPath) {
                        const innerCallee = innerPath.node.callee;
                        if (t.isIdentifier(innerCallee) && (innerCallee.name === 'it' || innerCallee.name === 'test')) {
                          fileHasTests = true;
                          innerPath.stop();
                        }
                      }
                    });
                    if (!fileHasTests) {
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
    
    if (code !== content) {
      fs.writeFileSync(file, code);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}
console.log('Hooks fixed.');

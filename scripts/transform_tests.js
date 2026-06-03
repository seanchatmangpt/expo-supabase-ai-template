module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  let testCount = 0;
  
  // Remove tests after the 3rd one
  root.find(j.CallExpression, {
    callee: { type: 'Identifier' }
  }).forEach(path => {
    if (path.node.callee.name === 'it' || path.node.callee.name === 'test') {
      testCount++;
      if (testCount > 3) {
        j(path).remove();
      }
    }
  });

  // Iteratively remove empty describes
  let changed = true;
  while(changed) {
    changed = false;
    root.find(j.CallExpression, {
      callee: { type: 'Identifier', name: 'describe' }
    }).forEach(path => {
      const hasTests = j(path).find(j.CallExpression).filter(p => {
        if (p.node.callee.type === 'Identifier') {
          return p.node.callee.name === 'it' || p.node.callee.name === 'test';
        }
        return false;
      }).size() > 0;
      
      if (!hasTests) {
        // Find if this describe is wrapped in an ExpressionStatement, if so remove the statement
        if (path.parentPath && path.parentPath.node.type === 'ExpressionStatement') {
          j(path.parentPath).remove();
        } else {
          j(path).remove();
        }
        changed = true;
      }
    });
  }
  
  // Also remove dangling top-level hooks if there are absolutely NO tests left in the file
  const totalTests = root.find(j.CallExpression).filter(p => 
    p.node.callee.type === 'Identifier' && (p.node.callee.name === 'it' || p.node.callee.name === 'test')
  ).size();
  
  if (totalTests === 0) {
    root.find(j.CallExpression).filter(p => {
      if (p.node.callee.type === 'Identifier') {
        return ['beforeEach', 'afterEach', 'beforeAll', 'afterAll'].includes(p.node.callee.name);
      }
      return false;
    }).forEach(path => {
      if (path.parentPath && path.parentPath.node.type === 'ExpressionStatement') {
        j(path.parentPath).remove();
      } else {
        j(path).remove();
      }
    });
  }

  return root.toSource();
};

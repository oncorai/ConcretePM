import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

async function fixApiRoutes() {
  const apiDir = path.join(process.cwd(), 'src/app/api');
  const files = await glob('**/route.ts', { cwd: apiDir, absolute: true });
  
  let fixedCount = 0;
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    let updated = content;
    
    // Pattern 1: { params }: { params: { id: string } }
    updated = updated.replace(
      /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g,
      '{ params }: { params: Promise<{$1}> }'
    );
    
    // Pattern 2: Update params access
    updated = updated.replace(
      /const\s+(\w+)\s*=\s*params\.(\w+);/g,
      'const { $2: $1 } = await params;'
    );
    
    // Pattern 3: Direct params.id access
    updated = updated.replace(
      /params\.(\w+)(?![\w.])/g,
      (match, prop) => {
        // Check if we're already in an await expression
        const lineStart = updated.lastIndexOf('\n', updated.indexOf(match));
        const line = updated.substring(lineStart, updated.indexOf(match) + match.length);
        if (line.includes('await params')) {
          return match;
        }
        return `(await params).${prop}`;
      }
    );
    
    if (content !== updated) {
      writeFileSync(file, updated);
      fixedCount++;
      console.log(`Fixed: ${path.relative(process.cwd(), file)}`);
    }
  }
  
  console.log(`\nFixed ${fixedCount} API route files`);
}

fixApiRoutes().catch(console.error);
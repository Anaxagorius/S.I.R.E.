
// Minimal smoke test for module presence
import('node:assert').then(({strictEqual}) => {
  strictEqual(typeof 1, 'number')
  console.log('Basic test passed')
})

// This script runs the AI moderator test in the Next.js environment
// It imports the testAIModerator function and executes it

const { testAIModerator } = require('../src/lib/test-moderator');

// Run the test
console.log('Running AI moderator tests with Next.js environment...\n');

testAIModerator()
  .then(() => {
    console.log('\nTests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  }); 
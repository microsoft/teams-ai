// serve-docs.js
const { spawn } = require('child_process');

console.log('📚 Starting documentation server...');

// Get all arguments after the script name and add them after 'book'
const args = ['serve', 'book', ...process.argv.slice(2)];
const child = spawn('mdbook', args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

// Monitor stdout and stderr for [ERROR]
const checkForErrors = (data) => {
  const output = data.toString();
  process.stdout.write(output); // Forward output

  if (output.includes('[ERROR]')) {
    console.error('\n❌ Error detected in documentation build');
    // Optional: Send system notification
    // require('node-notifier').notify({
    //   title: 'MDBook Error',
    //   message: 'Error detected in documentation build'
    // });
  }
};

child.stdout.on('data', checkForErrors);

// Handle clean shutdown
process.on('SIGINT', () => {
  child.kill();
  process.exit(0);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Documentation server crashed');
    process.exit(code);
  }
});

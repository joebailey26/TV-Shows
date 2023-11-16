import chokidar from 'chokidar';
import { spawn } from 'child_process';

// List of folders to watch
const foldersToWatch = ["./server", "./pages"];

// Keep track of the build process
let buildProcess = null;

// Function to run the build
function runBuild() {
  if (buildProcess) {
    console.log('Terminating the current build process...');
    buildProcess.kill(); // This sends a SIGTERM to the process
  }

  console.log('Starting a new build...');
  buildProcess = spawn('pnpm', ['run', 'build'], { shell: true });

  buildProcess.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
  });

  buildProcess.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });

  buildProcess.on('close', (code) => {
    console.log(`Build process exited with code ${code}`);
    buildProcess = null; // Reset when the build process is complete
  });

  buildProcess.on('error', (err) => {
    console.error(`Failed to start build process: ${err}`);
  });
}

// Initialize watcher
const watcher = chokidar.watch(foldersToWatch, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

// Event listeners
watcher
  .on('change', path => {
    console.log(`File ${path} has been changed`);
    runBuild();
  })
  .on('error', error => console.log(`Watcher error: ${error}`));

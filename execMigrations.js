import fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'

// Directory containing SQL files
const sqlDirectory = './db/migrations'

// Function to execute the command for each SQL file
function executeCommandForFile (filePath) {
  const command = 'wrangler'
  const args = ['d1', 'execute', 'tv_shows', '--local', '--file', filePath]
  if (process.env.PRODUCTION_MIGRATIONS) {
    args.push('--local')
  }
  const spawnproc = spawn(command, args)

  spawnproc.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  spawnproc.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })

  spawnproc.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })
}

// Read the directory and execute the command for each SQL file
fs.readdir(sqlDirectory, (err, files) => {
  if (err) {
    console.error(`Error reading directory ${sqlDirectory}: ${err}`)
    return
  }

  // Filter and sort .sql files
  const sqlFiles = files.filter(file => path.extname(file) === '.sql').sort()

  sqlFiles.forEach((file) => {
    executeCommandForFile(path.join(sqlDirectory, file))
  })
})

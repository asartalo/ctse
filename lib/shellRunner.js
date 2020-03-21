const childProcess = require('child_process');
const kill = require('tree-kill');
const ReadLineStream = require('readline-stream');

function shellRunner(command, args = [], options = {}) {
  const opts = { stdio: ['ignore', 'pipe', 'pipe'], cwd: process.cwd(), ...options };
  const cmd = `${command} ${args.join(' ')}`;

  let child;
  function run() {
    return new Promise((resolve, reject) => {
      try {
        child = childProcess.spawn(command, args, opts);
      } catch (error) {
        reject(error);
        return;
      }

      let stdout = '';
      let stderr = '';

      const stdOutLogger = options.logger ? options.logger : data => {
        stdout += data;
      };

      const stdErrLogger = options.logger ? options.logger : data => {
        stderr += data;
      };

      if (child.stdout) {
        const stdOutLine = child.stdout.pipe(ReadLineStream({}));
        stdOutLine.on('data', stdOutLogger);
      }

      if (child.stderr) {
        const stdErrLine = child.stderr.pipe(ReadLineStream({}));
        stdErrLine.on('data', stdErrLogger);
      }

      child.on('error', error => {
        resolve({
          error, stdout, stderr, cmd,
        });
      });

      child.on('close', code => {
        resolve({
          stdout, stderr, cmd, code,
        });
      });
    });
  }

  return {
    run,
    kill: (signal = 'SIGTERM') => new Promise(resolve => {
      if (child) {
        child.kill(signal);
        if (child.stdin) {
          child.stdin.pause();
        }
        kill(child.pid, signal, err => {
          resolve(err);
          child = null;
        });
      }
      resolve(0);
    }),
  };
}

module.exports = shellRunner;

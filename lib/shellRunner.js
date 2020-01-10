const childProcess = require('child_process');

function shellRunner(command, args = [], options = {}) {
  const opts = { stdio: 'pipe', cwd: process.cwd(), ...options };
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
        child.stdout.on('data', stdOutLogger);
      }

      if (child.stderr) {
        child.stderr.on('data', stdErrLogger);
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
    kill: (signal = 'SIGTERM') => {
      if (child) {
        child.kill(signal);
        child = null;
      }
    },
  };
}

module.exports = shellRunner;

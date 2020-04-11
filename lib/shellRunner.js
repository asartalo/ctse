const childProcess = require('child_process');
const kill = require('tree-kill');
const ReadLineStream = require('readline-stream');

class ShellRunnerError extends Error {
  addDetails(details = {}) {
    this.details = { ...details };
  }
}

const defaultOptions = {
  stdio: ['ignore', 'pipe', 'pipe'],
  cwd: process.cwd(),
};

function readlineLogger(stream, logger) {
  if (stream) {
    const stdOutLine = stream.pipe(ReadLineStream({}));
    stdOutLine.on('data', logger);
  }
}

function addLoggers(child, { logger, errorLogger }) {
  let stdout = '';
  let stderr = '';

  const stdOutLogger = logger
    || (data => {
      stdout += data;
    });

  const stdErrLogger = errorLogger
    || (logger
      || (data => {
        stderr += data;
      }));

  readlineLogger(child.stdout, stdOutLogger);
  readlineLogger(child.stderr, stdErrLogger);

  return { stdout, stderr };
}

function addListeners(child, commonFields, { reject, resolve }) {
  child.on('error', errorMessage => {
    const error = new ShellRunnerError(errorMessage);
    error.addDetails({ ...commonFields });
    reject(error);
  });

  child.on('close', code => {
    resolve({ ...commonFields, code });
  });
}

function processKillFn(process) {
  const proc = process;
  return (signal = 'SIGTERM') => new Promise(resolve => {
    if (proc) {
      proc.kill(signal);
      if (proc.stdin) {
        proc.stdin.pause();
      }
      kill(proc.pid, signal, err => {
        resolve(err);
        proc = null;
      });
    } else {
      resolve(0);
    }
  });
}

function shellRunner(command, args = [], options = {}) {
  const opts = { ...defaultOptions, ...options };

  let child;
  function run() {
    return new Promise((resolve, reject) => {
      try {
        child = childProcess.spawn(command, args, opts);
      } catch (error) {
        reject(error);
        return;
      }

      const streamStrings = addLoggers(child, options);
      const commonFields = { ...streamStrings, command, args };
      addListeners(child, commonFields, { reject, resolve });
    });
  }

  return {
    run,
    kill: processKillFn(child),
  };
}

shellRunner.ShellRunnerError = ShellRunnerError;
module.exports = shellRunner;

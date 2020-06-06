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
  const stdout = [];
  const stderr = [];

  const stdOutLogger = logger
    || (data => {
      stdout.push(data);
    });

  const stdErrLogger = errorLogger
    || logger
    || (data => {
      stderr.push(data);
    });

  readlineLogger(child.stdout, stdOutLogger);
  readlineLogger(child.stderr, stdErrLogger);

  return { stdout, stderr };
}

function addListeners(child, commonFields, { reject, resolve }) {
  const { stdout, stderr } = commonFields;
  child.on('error', errorMessage => {
    const error = new ShellRunnerError(errorMessage);
    error.addDetails({ ...commonFields, stdout: stdout.join(''), stderr: stderr.join('') });
    reject(error);
  });

  child.on('close', code => {
    resolve({
      ...commonFields,
      stdout: stdout.join(''),
      stderr: stderr.join(''),
      code,
    });
  });
}

function killProcess(proc, signal) {
  return new Promise(resolve => {
    if (proc) {
      if (proc.stdin) {
        proc.stdin.pause();
      }
      kill(proc.pid, signal, resolve);
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
    kill: async (signal = 'SIGTERM') => {
      const result = await killProcess(child, signal);
      if (child) {
        child = null;
      }
      return result;
    },
  };
}

shellRunner.ShellRunnerError = ShellRunnerError;
module.exports = shellRunner;

const { exec } = require("child_process");

const execAsync = command => {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        stdout,
        stderr
      });
    });
  });
};

module.exports = execAsync;

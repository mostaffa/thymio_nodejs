var spawn = require('child_process').spawn;
var grep  = spawn('grep', ['python']);

console.log(grep.pid);
grep.stdin.end();
process.exitCode = 0;

console.info("\x1b[1m\x1b[32m", "start tests", "\x1b[0m" );

require('./file-manager');
require('./create-db');

setTimeout(function () {
    console.info("\x1b[1m\x1b[32m", "done", require('./mokes').count(), "\x1b[0m");
}, 100);

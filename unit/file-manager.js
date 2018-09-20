// before

const moke = require('./mokes'), should = moke.should;


// main

const File = require('../file');

const test_file = __dirname + "/file.test";

console.info("\x1b[32m", "file-manager…", "\x1b[0m");

(async function () { // create file

    let file = File.build(test_file),
        init_data = ["bonjour tout le monde", "comment ça va ?", "&é\"'(-è_ç'@"],
        write_data = init_data.slice(),
        read_data = [];

    should(await file.exists(), false, "should not exist yet");

    should(await file.writeEachLine(function () {
        return write_data.shift();
    }), 3, "should count 3 lines inserted in document.");
    should(await file.exists(), true, "should exist now");

    should(await file.readEachLine(function (line) {
        read_data.push(line);
    }), 3, "should count 3 lines read");

    should(JSON.stringify(read_data), JSON.stringify(init_data), "should read same data as written");

    should(await file.unlink(), file, "should unlink with success");
    should(await file.exists(), false, "should exist no more");

})();


// after
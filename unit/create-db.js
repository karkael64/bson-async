// before

const moke = require('./mokes'), should = moke.should, throws = moke.throws, returns = moke.returns;
const Bson = require('../bson');

class Test extends Bson {
}

// main

console.info("\x1b[32m", "create-db…", "\x1b[0m");

(async function () {

    const path = require('path');
    let init_data = [], data, test;

    should(Test.getFile().path, path.normalize(__dirname + '/../test.bson'), "should be parent folder and \"test.bson\" file");
    should(await Test.select(function (data) {init_data.push(data);}), 0, "should try to read no data");
    should(init_data.length, 0, "should not length anything in data response.");

    data = {"hello":"world!"};
    init_data = [];
    should(await Test.insert(data), true, "should insert data" );
    should(await Test.select(function (data) {init_data.push(data);}), 1, "should try to read data");
    should(init_data.length, 1, "should length 1 row in data response.");
    should(JSON.stringify(init_data), '[{"hello":"world!","id":1}]', "should be the row inserted and its id.");

    init_data = [];
    should(await Test.insert({"hello":"you!"}), true, "should insert second data" );
    should(await Test.select(function (data) {init_data.push(data);}), 2, "should try to read second data");
    should(init_data.length, 2, "should length 2 row in data response.");
    should(JSON.stringify(init_data), '[{"hello":"world!","id":1},{"hello":"you!","id":2}]', "should be the rows inserted and their id.");

    test = new Test({"hello":"computer!"});
    should(await test.save(), test, "should save and return itself");

    test = new Test({"id":1});
    should(await test.load(), test, "should load and return itself");
    should(JSON.stringify(test.data), '{"hello":"world!","id":1}', "should load exact item");

    await Test.getFile().unlink();

})();

// after


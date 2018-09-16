const File = require('./file');

function is_function(el) {
    return (typeof el === 'function');
}

function is_number(el) {
    return (typeof el === 'number');
}

function is_object(el) {
    return (typeof el === 'object') && (el !== null);
}

/**
 * @class BSON is a class for reading/writing files in BSON format, with NoSQL methods.
 */

class BSON {


    //  row functions

    /**
     * @method constructor is used to instanciate a row of a collection saved in BSON.
     * @param data number|object|null|undefined
     */

    constructor(data) {

        this.sync_date = null;

        if (is_object(data))
            this.data = data;
        else
            this.data = {};
    }


    /**
     * @method load is used to get informations associated with its id, then call ${next} as callback.
     * @returns {BSON}
     */

    async load() {
        let id = this.data.id,
            self = this,
            done = false,
            file = this.getFile();
        if (is_number(id)) {
            await file.readEachLine((line) => {
                if (!done) {
                    let data = JSON.parse(line);
                    if (data.id === id) {
                        self.sync_date = Date.now();
                        done = true;
                        self.data = data;
                    }
                }
            });
        }
        return this;
    }


    /**
     * @method save is used to set informations, then call ${next} as a callback.
     * @returns {BSON}
     */

    async save() {
        let self = this.data;
        if (this.data.id) {
            await this.update((data) => {
                if (data.id === self.id) {
                    self.sync_date = Date.now();
                    return self;
                }
            });
        }
        else {
            await this.insert(self);
            this.sync_date = Date.now();
        }
        return this;
    }


    /**
     * @method get is used to get current row field value, or send undefined if not found.
     * @param name
     * @returns {*}
     */

    get(name) {
        return this.data[name];
    }


    /**
     * @method set is used to set row field value.
     * @param name
     * @param value
     * @returns {BSON}
     */

    set(name, value) {
        this.data[name] = value;
        return this;
    }


    //  collection functions

    /**
     * @method select is used to seek each rows, and then use next as a callback.
     * @param each function( Error err, Object data, Function then )
     * @returns BSON
     */

    static async select(each) {

        if (is_function(each)) {
            let file = this.getFile();
            await file.readEachLine(async function (line) {
                await each(JSON.parse(line));
            });
        }
        return this;
    }


    /**
     * @method update is used to seek each rows and set them in third parameter of ${each} function.
     * @param each function( Error err, Object data, Function push )
     * @return BSON
     */

    static async update(each) {
        if (is_function(each)) {
            let file = this.getFile();
            await file.replaceEachLine(async function (line) {
                let data = await each(JSON.parse(line));
                if (data === BSON.UPDATE_REMOVE)
                    return undefined;
                if (data === BSON.UPDATE_IGNORE)
                    return line;
                if (data instanceof BSON)
                    data = data.data;
                return JSON.stringify(data);
            });
        }
        return this;
    }


    /**
     * @method insert is used to append a row with ${data}, then call ${next} as a callback.
     * @param data Object
     * @returns BSON
     */

    static async insert(data) {
        if (is_object(data)) {
            if (data instanceof BSON) data = data.data;
            let file = this.getFile();
            data.id = await this.nextId();
            await file.append(JSON.stringify(data) + '\n');
        }
        return this;
    }


    /**
     * @method nextId is used to get next unique id in these rows.
     * @return {number}
     */

    static async nextId() {
        let file = this.getFile();
        let max = 1;
        await file.readEachLine(function(line){
            let data = JSON.parse(line);
            if (data.id >= max)
                max = data.id + 1;
        });
        return max;
    }


    /**
     * @method getFile is used to get the file associated.
     * @returns {File}
     */

    static getFile() {
        return File.build(BSON.FOLDER + this.name.toLowerCase() + '.bson');
    }
}

BSON.FOLDER = 'C:/www/motor-js/data/';
BSON.UPDATE_REMOVE = undefined;
BSON.UPDATE_IGNORE = null;

BSON.File = File;

module.exports = BSON;

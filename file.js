const pt = require('path');
const fs = require('fs');

function is_function(el) {
    return (typeof el === 'function');
}

function is_string(el) {
    return (typeof el === 'string');
}

class File {

    constructor(path, chunk_size) {

        path = pt.normalize(path);

        Object.defineProperty(this, 'path', {"enumerable": true, "writable": false, "value": path});
        this.chunk_size = chunk_size || File.CHUNK_SIZE;

        File.all[path] = this;
    }


    /**
     * @function build is a static method called to be sure to have only one instance for this file.
     * @param path
     * @returns File
     */

    static build(path) {
        path = pt.normalize(path);
        let file = File.all[path];
        if (file instanceof File)
            return file;
        else
            return new File(path);
    }


    //  COMMON FILE

    /**
     * @function read is used to read entire file.
     * @returns string
     */

    async read() {
        return await fs.readFileSync(this.path, {'encoding': File.CHARSET, 'flag': 'r'});
    }


    /**
     * @function write is used to write an entire file, create it or replace it.
     * @param text {string}
     * @returns {File}
     */

    async write(text) {
        await fs.writeFileSync(this.path, text, {'encoding': File.CHARSET, 'flag': 'w'});
        return this;
    }


    /**
     * @function append is used to write at the end of a file.
     * @param text {string}
     * @returns {File}
     */

    async append(text) {
        await fs.writeFileSync(this.path, text, {'encoding': File.CHARSET, 'flag': 'a'});
        return this;
    }


    /**
     * @function exists is used to check if this file exists in this system.
     * @returns {boolean}
     */

    async exists() {
        try {
            await fs.accessSync(this.path);
            return true;
        }
        catch (e) {
            return false;
        }
    }


    /**
     * @function size returns the file length in bytes.
     * @returns {number}
     */

    async size() {
        let fd = await fs.openSync(this.path, {'encoding': File.CHARSET, 'flag': 'r'}),
            stat = await fs.fstatSync(fd);
        await fs.closeSync(fd);
        return stat.size;
    }


    /**
     * @function rename move current file and returns its interface.
     * @param newPath
     * @returns {File}
     */

    async rename(newPath) {
        await fs.rename(this.path, newPath);
        return File.build(newPath);
    }


    /**
     * @function unlink delete this file
     * @throws {Error}
     */

    async unlink() {
        await fs.unlinkSync(this.path);
        return this;
    }


    //  LARGE FILE

    /**
     * @function readEachChunk
     * @param each {function({Buffer})}
     * @param chunk_size {number}
     */

    async readEachChunk(each, chunk_size) {
        let fd;
        if (is_function(each) && (await this.exists()) && (fd = await fs.openSync(this.path, 'r'))) {
            let stat = await fs.fstatSync(fd),
                bufferSize = stat.size;

            if (bufferSize <= 1)
                return null;

            chunk_size = chunk_size || this.chunk_size;
            let buffer = Buffer.alloc(chunk_size),
                bytesRead = 0;

            let fn = async function () {
                if (bytesRead < bufferSize) {
                    let tmp_size;
                    if ((bytesRead + chunk_size) >= bufferSize) {
                        chunk_size = (bufferSize - bytesRead);
                        tmp_size = await fs.readSync(fd, buffer, 0, chunk_size, bytesRead);
                        bytesRead += tmp_size;
                        await each(buffer.slice(0, tmp_size));
                        await fs.closeSync(fd);
                    }
                    else {
                        tmp_size = await fs.readSync(fd, buffer, 0, chunk_size, bytesRead);
                        bytesRead += tmp_size;
                        await each(buffer);
                        await fn();
                    }
                }
            };
            await fn();
            return false;
        }
        return null;
    }


    /**
     * @function readEachLine is used to call function ${each) at each end of line.
     * @param each {function({string})}
     * @returns {number} of lines
     */

    async readEachLine(each) {
        if (is_function(each)) {
            let text = '',
                line = '',
                count = 0;

            await this.readEachChunk(async function (buffer) {
                text += buffer.toString();
                let r;
                while ((r = text.indexOf('\n')) !== -1) {
                    line = text.substr(0, r).trim();
                    text = text.substr(r + 1);
                    await each(line);
                    count++;
                }
            });

            if (text.length) {
                line = text.trim();
                await each(line);
                count++;
            }
            return count;
        }
        return null;
    }


    /**
     * @function writeEachLine is used to write in a file each of these lines pushed in third parameter or ${each}
     * @param each {function()}
     * @returns {number} of lines inserted
     */

    async writeEachLine(each) {
        if (is_function(each)) {
            let fd = await fs.openSync(this.path, 'w'),
                count = 0;

            let fn = async function () {
                let data = await each();
                if (is_string(data)) {
                    count++;
                    await fs.writeSync(fd, data + '\n', File.CHARSET);
                    await fn();
                }
            };
            await fn();
            return count;
        }
    }


    /**
     * @function replaceEachLine is used to replace each line read in the file.
     * @warn For performance settings, this function create a temp file (this.path + '_temp'). Beware there is no existing
     * file with this path.
     * @param each {function({string})}
     * @returns {number}
     */

    async replaceEachLine(each) {
        if (is_function(each)) {
            let path = this.path + '_temp',
                temp = await this.rename(path),
                cache = [],
                count = 0;

            temp.readEachLine(function (line) {
                cache.push(line);
                count++;
            });

            await this.writeEachLine(async function () {
                return await each(cache.shift());
            });

            await temp.unlink();
            return count;
        }
        return null;
    }
}

File.all = [];
File.CHUNK_SIZE = 0x10000;
File.CHARSET = 'utf8';

module.exports = File;
const sdk = require('bce-sdk-js');
const fs = require('fs');
const merge = require('lodash/merge');
const path = require('path');
const chalk = require('chalk');

const success = chalk.bold.green;
const error = chalk.bold.red;
const warning = chalk.keyword('orange');
const log = console.log;

function getContentType(fileName) {
    // Content-Type
    let ext = path.extname(fileName).toLowerCase();
    return sdk.MimeType.guess(ext);
}

function genPath(fileName, basePath) {
    return fileName.substr(basePath.length);
}

function readdir(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, 'utf-8', function (err, files) {
            if (err) {
                reject(err);
            }

            resolve(files);
        });
    });
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
}

module.exports = class Uploader {
    constructor(options) {
        this.options = options.bos;
        this.prefix = options.prefix;
        this.basePath = '';
        // 待上传文件
        this._files = [];
        // 正在上传的文件列表
        this._realFiles = [];
        this.cache = {};
        this.client = new sdk.BosClient(this.options);
    }

    async uploadDir(dir) {
        this.basePath = path.resolve(dir, '..');
        await this.getCache();
        await this.readDir(dir);
        this.filterRealFiles();
        await this.uploadFiles();
    }

    async getCache() {
        const res = await this.client.listObjects(this.options.bucketName, {
            prefix: this.prefix + '/'
        });
        res.body.contents.forEach(item => {
            this.cache[item.key] = true;
        });
    }

    filterRealFiles() {
        this._files.forEach(file => {
            let key = genPath(file, this.basePath);
            let filePath = this.prefix + key;
            if (!this.cache[filePath]) {
                this._realFiles.push(file);
            }
            else {
                log(warning(`exist ${filePath}`));
            }
        });
    }

    async readDir(base) {
        try {
            let isDir = fs.lstatSync(base).isDirectory();
            if (!isDir) {
                this._files.push(base);
                return;
            }

            let files = await readdir(base);
            if (files.length === 0) {
                throw 'dist is empty, please check.';
            }

            for (let i = 0; i < files.length; i++) {
                await this.readDir(path.resolve(base, files[i]));
            }
        }
        catch (err) {
            log(error(err));
        }
    }

    async uploadFiles() {
        const files = this._realFiles.splice(0, 5);
        if (files.length === 0) {
            log(success('complate upload files'));
            return;
        }

        const uploadingFiles = files.map(item => this.upload(item));

        const res = await Promise.all(uploadingFiles);
        res.forEach(r => log(success(r)));
        await this.uploadFiles();
    }

    async upload(fileName, options = {}) {
        let key = genPath(fileName, this.basePath);
        let filePath = this.prefix + key;
        // 默认加上缓存
        if (!options['Cache-Control']) {
            options['Cache-Control'] = 'max-age=2592000';
        }

        if (!options['Content-Type']) {
            options['Content-Type'] = getContentType(fileName);
        }

        let data = await readFile(fileName);
        await this.client.putObject(
            this.options.bucketName,
            filePath,
            data,
            options
        );
        return this.options.urlPrefix + filePath;
    }
};

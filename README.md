# bos-upload-dir
上传文件夹至bos。

## 使用
### 安装
```bash
npm install bos-upload-dir
```

### 配置

```js
const path = require('path');
const Uploader = require('bos-upload-dir');


const uploader = new Uploader({
    bos: {
        credentials: {
            ak: 'xxxxxxxx',
            sk: 'xxxxxxxx'
        },
        endpoint: 'http://xx.xxx.com',
        bucketName: 'xxx',
        urlPrefix: '//xxx.bdstatic.com/'
    },
    prefix: 'test'
});
// 上传 lib 文件夹下的文件至 bos
uploader.uploadDir(path.resolve(__dirname, 'lib')).then(() => console.log('done'));

```

## Options
name    | type     | default | required | Description
----    | ---      | ----    |    ---   |     ---
bos     | {Object} |         |    true  | bos相关配置，具体可参考百度云文档
prefix  | {String} | ''      |    false | 上传至 bos bucket 下的前缀路径
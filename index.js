'use strict';
const executor = require('./src/core/executor');

const main = async () => {
    const target = './etc/helloworld.wasm';
    const res = await executor.runLocalFile(target);
    console.log(res);

    // const url = 'https://github.com/wasmerio/docs.wasmer.io/raw/master/integrations/shared/wat/wasi/helloworld.wasm';
    // const res1 = await executor.runRemoteFile(url);
    // console.log(res1);
}

main();

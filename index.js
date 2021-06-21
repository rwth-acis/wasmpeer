'use strict';   
const executor = require('./src/core/executor');

const main = async () => {
    const target = './etc/fibo.wasm';
    const res = await executor.runLocalFile(target, 'main', { i: 1 });
    console.log(res);
}

main();

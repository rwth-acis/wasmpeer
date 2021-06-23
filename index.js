'use strict';   
const { default: Executor } = require('./src/core/executor');

const main = async () => {
    const target = './etc/main.wasm';
    const res = await Executor.runLocalFile(target, 'add', { i: 10, j: 11 });
    console.log(res);
}

main();

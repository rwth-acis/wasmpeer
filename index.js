'use strict';   
const { default: Executor } = require('./src/core/executor');

const main = async () => {
    const target = './etc/fibo.wasm';
    const res = await Executor.runLocalFile(target, 'main', { i: 5 });
    console.log(res);
}

main();

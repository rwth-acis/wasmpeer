import Wasmpeer from "../src/index.js";
import fs from 'fs';
import Compiler from '../src/utils/compiler.js';
import { exit } from "process";

(async () => {

  [2].forEach(async x => {
    const wasmpeer = await Wasmpeer.buildNodeJS({repoName: x.toString(), compiler: Compiler});

    const path1 = './static/services/issue/issue.ts';
    const input1 = {
        title: 'Assemblyscript can\'t support JSON',
        description: 'Apparently JSON is not available natively in Assemblyscript'
    };
    const input2 = {
        title: 'Assemblyscript can\'t support Overloading',
        description: 'Apparently it is not available'
    };


    const mainRaw = fs.readFileSync(path1);
    const filename = path1.replace(/^.*[\\\/]/, '')
    const id = await wasmpeer.manager.uploadAS(filename, mainRaw.toString());
    

    for (const a of Array.from(Array(1).keys())) {
      console.log(a);
      await wasmpeer.executor.run(id, 'add', input1);  
    }
    // const promises = Array.from(Array(100).keys()).map(x => {
    //   console.log(x);
    //   return wasmpeer.executor.run(id, 'add', input1);
    // })

    // await Promise.all(promises);

    const res = await wasmpeer.executor.run(id, 'list', null);
    console.log(res);

    setInterval(() => {
      // console.log(wasmpeer.manager.getAvailableServices());
    }, 5000)
  })
  exit;
})();
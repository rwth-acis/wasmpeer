import asc from "assemblyscript/cli/asc";
import fs from "fs";
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { extractor } from './parser.js';

export default class Compiler {
	static async AS(sourceStr) {
		await asc.ready;

		const dir = os.tmpdir() + '/wasmpeer/compiler/' + uuidv4() + '/';

		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(dir + 'main.ts', sourceStr);

		asc.main([
			dir + 'main.ts',
			"--binaryFile", dir + 'main.wasm',
			"--tsdFile", dir + 'main.d.ts',
			"--exportRuntime"
		], {
			stdout: process.stdout,
			stderr: process.stderr
		}, err => {
			if (err) {
				throw err;
			}
		});

		const binary = fs.readFileSync(dir + 'main.wasm');
		const tsd = fs.readFileSync(dir + 'main.d.ts').toString();

		fs.rmdirSync(dir, { recursive: true })

		const meta = extractor(tsd);
		const res = {
			source: binary,
			raw: sourceStr,
			meta: meta
		};
		return res;
	}
}

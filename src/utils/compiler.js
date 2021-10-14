import asc from "assemblyscript/cli/asc";
import fs from "fs";
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
export default class Compiler {
	static async AS(sourceStr) {
		await asc.ready;

		const dir = os.tmpdir() + '/wasmpeer/' + uuidv4() + '/';

		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(dir + 'input.ts', sourceStr);

		asc.main([
			dir + 'input.ts',
			"--binaryFile", dir + 'binary',
			"--tsdFile", dir + 'tsd',
			"--exportRuntime"
		], {
			stdout: process.stdout,
			stderr: process.stderr
		}, err => {
			if (err) {
				throw err;
			}
		});

		const binary = fs.readFileSync(dir + 'binary');
		const tsd = fs.readFileSync(dir + 'tsd').toString();

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

const extractor = (str) => {
	const funcs = {};
	str.split('\n').map(x => getParams(x)).filter(x => x && x.name.slice(0, 2) !== '__').forEach(x => {
		funcs[x.name] = x;
	});
	return funcs;
};

const getParams = (str) => {
	let cleanStr = str.replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
	const first = 'export function ';
	if (!cleanStr.includes(first)) return;
	cleanStr = cleanStr.split(first)[1];

	const paramStartIndex = cleanStr.indexOf('(');
	const paramEndIndex = cleanStr.indexOf(')');
	const funcName = cleanStr.slice(0, paramStartIndex);
	const rawParams = cleanStr.slice(paramStartIndex + 1, paramEndIndex);
	const params = {};
	rawParams.split(', ').forEach(x => {
		const a = x.split(': ');
		if (a[0]) {
			params[a[0]] = a[1];
		}
	});

	const returnType = cleanStr.slice(paramEndIndex + 3, cleanStr.length - 1);
	return { name: funcName, paramsType: params, returnType: returnType };
}

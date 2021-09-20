import asc from "assemblyscript/cli/asc";

export default class Compiler {
	static async AS(sourceStr) {
		await asc.ready;
		const { binary, stdout } = asc.compileString(sourceStr, { exportRuntime: true, tsdFile: '' });
		const res = {
			source: binary,
			raw: sourceStr,
		};
		return res;
	}
}

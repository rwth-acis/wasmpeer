'use strict';
import fs from 'fs';
import os from 'os';
export default class Accessor {
	constructor(instanceId) {

		this.targetDir = os.tmpdir() + '/wasmpeer/storage/' + instanceId + '/';
		if (!fs.existsSync(this.targetDir)) {
			fs.mkdirSync(this.targetDir, { recursive: true });
		};
		// TODO: fomulate encryption/decryption key
	}

	put(path, object) {
		const encrypted = this.encrypt(object);
		return fs.writeFileSync(this.targetDir + path, encrypted);
	}

	fetch(path) {
		const raw = fs.readFileSync(this.targetDir + path);
		return this.decrypt(raw);
	}

	encrypt(inp) {
		// TODO: encryption algorithm will be used
		return inp;
	}

	decrypt(inp) {
		// TODO: decryption algorithm will be used
		return inp;
	}
}
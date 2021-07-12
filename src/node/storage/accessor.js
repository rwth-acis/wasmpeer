'use strict';
import fs from 'fs';

export default class Accessor {
	constructor() {
		// TODO: fomulate encryption/decryption key
	}

	put(path, object) {
		const encrypted = this.encrypt(object);
		return fs.writeFileSync(path, encrypted);
	}

	fetch(path) {
		const raw = fs.readFileSync(path);
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
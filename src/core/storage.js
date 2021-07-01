'use strict';
import fs from 'fs';
import os from 'os';
import { v4 as uuid_v4 } from 'uuid';

const storeFileIdentifier = '_store';
const sourceFileIdentifier = '_source';
export default class Storage {
    constructor(instanceId) {
        this.catalog = new Catalog(instanceId);
        this.accessor = new Accessor();
    }

    storeService(filename, object) {
        const source = this.catalog.store(filename, object);
        const store = this.catalog.store(null, JSON.stringify({}, null, 0));

        const detail = JSON.stringify({
            [storeFileIdentifier]: store.id,
            [sourceFileIdentifier]: source.id
        }, null, 2);

        const entry = this.catalog.store(filename, detail);

        return entry.id;
    }

    getService(id) {
        const entry = this.catalog.getJSON(id);
        const source = this.catalog.get(entry[sourceFileIdentifier]);
        const store = this.catalog.getJSON(entry[storeFileIdentifier]);

        return {
            sourceId: entry[sourceFileIdentifier],
            storeId: entry[storeFileIdentifier],
            source: source,
            store: store
        };
    }

    update(id, object) {
        const entry = this.catalog.lookAt(id);
        this.accessor.put(entry.path, object);
    }

    read(id) {
        const entry = this.catalog.lookAt(id);
        return this.accessor.fetch(entry.path);
    }
}

class Catalog {
    constructor(instanceId) {
        const dir = os.tmpdir() + '/wasmpeer/storage/' + instanceId + '/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        };

        this.targetDir = dir;
        this.catalogPath = dir + 'catalog';

        this.accessor = new Accessor();
    }

    lookAt(id) {
        const catalog = this.load();
        return catalog[id];
    }

    new(name) {
        const id = uuid_v4();
        const entry = {
            path: this.targetDir + id,
            id: id
        };

        if (name) {
            entry.name = name;
        }

        const db = this.load();
        db[id] = entry;

        this.save(db);
        return entry;
    }

    store(name, object) {
        const entry = this.new(name);
        this.accessor.put(entry.path, object);
        return entry;
    }

    get(id) {
        const file = this.lookAt(id);
        if (!file) {
            throw new Error('file is not found');
        }
        
        return this.accessor.fetch(file.path);
    }

    getJSON(id) {
        return JSON.parse(this.get(id));
    }

    load() {
        // TODO: requires encryption
        if (!fs.existsSync(this.catalogPath)) {
            return {};
        } else {
            return JSON.parse(fs.readFileSync(this.catalogPath));
        }
    }

    save(object) {
        // TODO: requires encryption
        fs.writeFileSync(this.catalogPath, JSON.stringify(object, null, 2));
    }
}
class Accessor {
    constructor() {
        // TODO: fomulate encryption/decryption key
    }

    put(path, object) {
        const raw = fs.writeFileSync(path, object);
        this.encrypt(raw);
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
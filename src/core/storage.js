'use strict';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export default class Storage {
    constructor(instanceId) {
        this.instanceId = instanceId;

        //TODO: persisted catalog will be implemented
        this.db = {};

        const dir = os.tmpdir() + '/wasmpeer/storage/' + instanceId + '/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, {recursive: true});
        };

        this.targetDir = dir;
    }

    read(id) {
        const { path } = this.lookAtCatalog(id);
        return this.fetch(path);
    }

    create(name, object) {
        const {id, path} = this.newEntryCatalog(name);
        this.put(path, object);
        return id;
    }

    update(id, object) {
        const { path } = this.lookAtCatalog(id);
        this.put(path, object);
    }

    lookAtCatalog(id) {
        return this.db[id];
    }

    newEntryCatalog(name) {
        const id = uuidv4();
        const entry = {
            path: this.targetDir + id,
            id: id,
            name: name
        };
        this.db[entry.id] = entry
        return entry;
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
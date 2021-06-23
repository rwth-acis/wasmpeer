'use strict';
import fs from 'fs';
import os from 'os';
import { v4 as uuid_v4 } from 'uuid';

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
        this.catalogPath = dir + 'catalog';
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

    getCatalog() {
        if (!fs.existsSync(this.catalogPath)) {
            return {};
        } else {
            return JSON.parse(fs.readFileSync(this.catalogPath));
        }
    }

    setCatalog(object) {
        fs.writeFileSync(this.catalogPath, JSON.stringify(object));
    }

    lookAtCatalog(id) {
        return this.getCatalog()[id];
    }

    newEntryCatalog(name) {
        const id = uuid_v4();
        const entry = {
            path: this.targetDir + id,
            id: id,
            name: name
        };

        const db = this.getCatalog();
        db[entry.id] = entry;
        this.setCatalog(db);
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
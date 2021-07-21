'use strict';
import express from 'express';
import Executor from '../core/executor';
import Storage from './storage';
export default class Communicator {
    constructor(instanceId, port) {
        this.instanceId = instanceId;
        this.port = port;
    }

    start() {
        const app = express();
        const storage = new Storage(this.instanceId);

        const listener = async (req, res) => {
            try {
                const { serviceId, endpoint } = req.params;
                const { version, peerId } = req.query;
                const input = populateInput(req);
                const executor = new Executor(storage);
                const finalResult = await executor.run(serviceId, endpoint, input);
                res.send(finalResult.toString());
            }
            catch (err) {
                console.error(err);
                res.status(500).send('failed');
            }
        }

        app.all('/:serviceId/:endpoint', listener);
        app.listen(this.port);
        console.log('listening to: ', this.port);

        this.app = app;
    }
}



const populateInput = (req) => {
    delete req.query.version;
    delete req.query.peerId;
    switch (req.method) {
        case 'POST':
        case 'PUT':
            return req.body;
        default:
            return req.query;
    }
}
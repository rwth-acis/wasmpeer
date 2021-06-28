'use strict';
import express from 'express';
import Executor from './executor';
export default class Communicator {
    constructor(instanceId, port) {
        this.instanceId = instanceId;
        this.port = port;
    }

    start() {
        const app = express();
        app.all('/:serviceId/:endpoint', async (req, res) => {
            const { serviceId, endpoint } = req.params;
            const { version, peerId } = req.query;
            const input = populateInput(req);
            const executor = new Executor(this.instanceId);
            const finalResult = await executor.run(serviceId, endpoint, input);
            res.send(finalResult.toString());
        });

        console.log('listening to: ', this.port);
        app.listen(this.port);

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
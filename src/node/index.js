'use strict';
const { default: Communicator } = require('./communicator');
// REMARK: InstanceId will be stored in the local storage, including port
const instanceId = 'f5e9de80-e9f2-4fcd-8ea0-2e089565ae9p';
const port = 3000;

const communicator = new Communicator(instanceId, port);
communicator.start();
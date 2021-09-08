import 'regenerator-runtime/runtime';
import Communicator from './communicator';

const urlMatcher = 'wasmpeer.org';

// REMARK: will be auto-generated in every new browser instance
const instanceId = 'f5e9de80-e9f2-4fcd-8ea0-2e089565ae9p';
window.wasmpeer = new Communicator(instanceId);

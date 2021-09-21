import 'regenerator-runtime/runtime';
import Communicator from './communicator';

const urlMatcher = 'wasmpeer.org';

// REMARK: will be auto-generated in every new browser instance
const instanceId = 'f5e9de80-e9f2-4fcd-8ea0-2e089565ae9p';

// The install handler
self.addEventListener('install', event => {
	event.waitUntil(self.skipWaiting());
});

// The activate handler
self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
	const target = event.request.url.toString();
	const communicator = new Communicator(instanceId);
	// reroute every call that match the matcher
	if (target.includes(urlMatcher)) {
		event.respondWith(communicator.listen(target));
	}
});


import Libp2p from 'libp2p';
import Bootstrap from 'libp2p-bootstrap';
import KadDHT from 'libp2p-kad-dht';
import Gossipsub from 'libp2p-gossipsub';
import MPLEX from 'libp2p-mplex';
import { NOISE } from '@chainsafe/libp2p-noise';
import WebRTCStar from 'libp2p-webrtc-star';
import wrtc from 'wrtc';

export const libp2pBundleNodeJS = (opts) => {
	opts.transport = {
		[WebRTCStar.prototype[Symbol.toStringTag]]: {
			wrtc
		}
	};
	return libp2pBundle(opts);
}

export const libp2pBundle = (opts) => {
	const peerId = opts.peerId
	const bootstrapList = [
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
	];
	const transport = opts.transport || {};

	return Libp2p.create({
		peerId,
		addresses: {
			listen: [
				'/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
				'/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
			]
		},
		connectionManager: {
			minPeers: 25,
			maxPeers: 100,
			pollInterval: 5000
		},
		modules: {
			transport: [
				WebRTCStar
			],
			streamMuxer: [
				MPLEX
			],
			connEncryption: [
				NOISE
			],
			peerDiscovery: [
				Bootstrap
			],
			dht: KadDHT,
			pubsub: Gossipsub
		},
		config: {
			transport: transport,
			peerDiscovery: {
				autoDial: true,
				mdns: {
					interval: 10000,
					enabled: true
				},
				bootstrap: {
					interval: 30e3,
					enabled: true,
					list: bootstrapList
				}
			},
			relay: {
				enabled: true,
				hop: {
					enabled: true,
					active: true
				}
			},
			dht: {
				enabled: true,
				kBucketSize: 20,
				randomWalk: {
					enabled: true,
					interval: 10e3,
					timeout: 2e3
				}
			},
			pubsub: {
				enabled: true
			}
		},
		metrics: {
			enabled: true,
			computeThrottleMaxQueueSize: 1000,
			computeThrottleTimeout: 2000,
			movingAverageIntervals: [
				60 * 1000,
				5 * 60 * 1000,
				15 * 60 * 1000
			],
			maxOldPeersRetention: 50
		}
	});
}

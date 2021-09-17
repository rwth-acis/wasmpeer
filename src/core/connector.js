import Libp2p from 'libp2p';
import WebRTCStar from 'libp2p-webrtc-star';
import Websockets from 'libp2p-websockets';
import Mplex from 'libp2p-mplex';
import Bootstrap from 'libp2p-bootstrap';
import { NOISE } from '@chainsafe/libp2p-noise';
import wrtc from 'wrtc';
import pipe from 'it-pipe';
import PeerId from 'peer-id';

export default class Connector {
  constructor(node, log) {
    this.node = node;
    this.log = log;
  }

  static buildNodeJs(peerId, params = {}) {
    params.transport = {
      [WebRTCStar.prototype[Symbol.toStringTag]]: {
        wrtc
      }
    }
    return Connector.build(peerId, params);
  }

  static async build(peerId, params = {}) {
    let { transport, log, sigServers, bootstrappers } = params;
    
    transport = transport || {};
    log = log || (() => {});
    peerId = peerId || await PeerId.create();

    const node = await Libp2p.create({
      peerId: peerId,
      addresses: {
        listen: sigServers
      },
      modules: {
        transport: [Websockets, WebRTCStar],
        streamMuxer: [Mplex],
        connEncryption: [NOISE],
        peerDiscovery: [Bootstrap]
      },
      config: {
        peerDiscovery: {
          autoDial: true,
          [Bootstrap.tag]: {
            enabled: true,
            list: bootstrappers
          }
        },
        transport: transport
      },
    });

    node.connectionManager.on('peer:connect', (connection) => {
      log(`Connected to ${connection.remotePeer.toB58String()}!`)
    });

    node.connectionManager.on('peer:disconnect', (connection) => {
      log(`Disconnected from '${connection.remotePeer.toB58String()}`)
    });
  
    // node.on('peer:discovery', (peerId) => {
    //   log(`Found peer ${peerId.toB58String()}`)
    // })

    await node.start();
    log('peerId: ' + node.peerId.toB58String());
    node.handle(node.peerId.toB58String(), Invocator.handler);

    return new Connector(node, log);
  }

  async sendMessage(targetPeerId, message) {
    
    this.node.peerStore.peers.forEach(async peerData => {
      const peerId = peerData.id.toB58String();
      if (targetPeerId !== peerId) return;


      let connection = this.node.connectionManager.get(peerData.id)
      if (!connection) {
        connection = await this.node.dial(peerData.id);
      }
      console.log(peerId);
      if (!connection) return;

      

      try {

        
        const { stream } = await connection.newStream([peerId])
        await Invocator.send(message, stream);
      } catch (err) {
        console.error('Could not negotiate chat protocol stream with peer', err)
      }
    })
  }
}

const Invocator = {
  handler: async ({ connection, stream }) => {
    try {
      await pipe(
        stream,
        async function (source) {
          for await (const message of source) {
            
            console.info(`${connection.remotePeer.toB58String().slice(0, 8)}: ${String(message)}`)
          }
        }
      )

      await pipe([], stream)
    } catch (err) {
      console.error(err)
    }
  },
  send: async (message, stream) => {
    try {
      await pipe(
        [message],
        stream,
        async (source) => {
          for await (const message of source) {
            console.info(String(message))
          }
        }
      )
    } catch (err) {
      console.error(err)
    }
  }
}
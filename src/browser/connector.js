import Explorer from 'webrtc-explorer';
import { v4 as uuidv4 } from 'uuid';
import UI from './UI';

var config = {
  signalingURL: 'http://localhost:9000',
  logging: true
};

export default class Connector {
  constructor() {
    this.callStack = {};
    this.peerId = '';

    this.start();
  }

  start() {
    UI.log('start');
    const peer = new Explorer(config);
    peer.register();
    this.peer = peer;

    peer.events.on('registered', data => {
      this.peerId = data.peerId;
      UI.peerId(this.peerId);
    });

    peer.events.on('finger-update', data => {
      UI.peerTable(data);
    });

    peer.events.on('message', async envelope => {
      const req = envelope.data;
      if (req.type === 'ANS') {
        if (!this.callStack[req.callId]) {
          throw new Error('Incoming not recognized: ', req.callId);
        }
        this.callStack[req.callId](req);
        this.callStack[req.callId] = null;
      } else {
        UI.log('INCOMING REQ: ', req.callId);
        const resp = await this.getService(req);

        const payload = {
          type: 'ANS',
          req: req,
          callId: req.callId,
          data: resp
        };

        this.peer.send(envelope.srcId, payload);
      }
    });
  }

  async getService(order) {
    const aa = await window.wasmpeer.listen('https://wasmpeer.org/e21af0b5-2a5c-4e93-9ee2-d3449fcf23e3/main?i=10');
    return aa;
  }

  async call(id, method, parameter) {
    const payload = {
      callId: uuidv4(),
      method: method,
      type: 'GET',
      serviceId: 'abcdef',

      parameter: parameter
    };

    const ress = new Promise((resolve, reject) => {
      UI.log('REQ: ', payload.callId);
      this.peer.send(id, payload);
      this.callStack[payload.callId] = resolve;
    });

    const resp = await ress.then(x => {
      return x.data;
    });

    UI.log('ANS:', resp);

    return resp;
  }

  callFirst() {
    const list = this.peer.fingerTable.getTable();
    const a = Object.values(list)[0];

    return this.call(a.fingerId, null);
  }
}

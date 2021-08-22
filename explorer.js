var Explorer = require('webrtc-explorer');

console.log('start');

var config = {
  signalingURL: 'http://localhost:9000',
  logging: true
};

var peer = new Explorer(config);

peerGlobal = peer;
let peerId = null;
peer.events.on('registered', function(data) {
  peerId = data.peerId;
  document.getElementById('peerId').innerHTML = 'peer id: ' + peerId;
  // console.log('registered with Id:', data.peerId);
});

peer.events.on('finger-update', function(data) {
  
  document.getElementById('peers').innerHTML = data.map(x => '"' + x.key + '": ' + x.value).join('<br />');
  console.log('ready to send messages');
});

const callStack = {};

peer.events.on('message', function(envelope) {
  // console.log('receive: ', envelope);

  if (envelope.data.type === 'GET') {
    const payload = {
      type: 'ANS',
      req: {
        type: 'GET',
        callId: '12sdfadsa',
        serviceId: 'abcdef',
        method: '1234',
        parameter: {
          a: 1,
          b: 2
        }
      },
      callId: '12sdfadsa',
      response: 'nice dude'
    };
    console.log('send answer to: ', envelope.srcId);
    peerGlobal.send(envelope.srcId, payload);
  } else {
    // console.log('answer received', envelope.data);
    callStack[envelope.data.callId](envelope.data);
    callStack[envelope.data.callId] = null;
  }

});

peer.register();

function call(id, method) {
  const list= peerGlobal.fingerTable.getTable();
  const a = Object.values(list)[0];

  // console.log(a.fingerId);

  id = id || a.fingerId;

  const payload = {
    type: 'GET',
    callId: '12sdfadsa',
    serviceId: 'abcdef',
    method: '1234',
    parameter: {
      a: 1,
      b: 2
    }
  };


  console.log(id);
  const ress = new Promise((resolve, reject) => {
    peerGlobal.send(id, payload);
    callStack[payload.callId] = resolve;
  })

  ress.then(x => {
    console.log('res: ', x);
  });
  

  // try {
  //   const result = await apiFunctionWrapper("query all users");
  //       console.log(result);
        
  //       // the next line will fail
  //       const result2 = await apiFunctionWrapper("bad query");
  //   } catch(error) {
  //       console.error("ERROR:" + error);
  //   }
    
}

peer.call = call;

// let's say this is the API function with two callbacks,
// one for success and the other for error
function apiFunction(query, successCallback, errorCallback) {
  if (query == "bad query") {
      errorCallback("problem with the query");
  }
  successCallback("Your query was <" + query + ">");
}

// myFunction wraps the above API call into a Promise
// and handles the callbacks with resolve and reject
function apiFunctionWrapper(query) {
  return new Promise((resolve, reject) => {
      apiFunction(query,(successResponse) => {
          resolve(successResponse);
      }, (errorResponse) => {
          reject(errorResponse);
      });
  });
}

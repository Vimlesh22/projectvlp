var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://test.mosquitto.org');
// client.publish('learner/connect',function(){
//   console.log('Learner connected to mqtt');
// })

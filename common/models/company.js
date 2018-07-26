'use strict';
var helper = require('./helper');
var EventEmitter = require('events');
var emailService = require('../service/emailService');
var schedule = require('node-schedule');
var redis = require('redis');
const elasticSearch = require('elasticsearch');
const esClient = new elasticSearch.Client({
  host : 'localhost:9200',
  log : 'trace'
});

 //    esClient.ping({
 //    requestTimeout: 30000,
 //    }, function (error) {
 //    if (error) {
 //      console.error('elasticsearch cluster is down!');
 //    } else {
 //      console.log('All is well');
 //    }
 //  });
 // }




//3)searching document by firstName



var client = redis.createClient();
// var mqtt = require('mqtt');
// var clientMqtt  = mqtt.connect('mqtt://test.mosquitto.org');
var Client = require('strong-pubsub');
var Adapter = require('strong-pubsub-mqtt');

var clientMqtt = new Client({
  host: 'localhost',
  port: 1883
}, Adapter);

clientMqtt.publish("/hello","mqtt conected");
clientMqtt.subscribe("/hello");

module.exports = function(Company) {
  var app = require('../../server/server.js');
  var Learner = app.models.Learner;
  // console.log("lear",Learner);
  helper(Company,['upsert']);
  client.on('connect', function() {
    console.log('redis server connected');
  });
  var enumObject = Company.definition.rawProperties.weeklyOff.enum;
  Company.config = function(cb){
    var weeklyOff = {
      weeklyOffData : enumObject
    }
    var result = {
      status : true,
      "message" : "success",
      data : weeklyOff
    }
    cb(null,weeklyOff);
  };

  Company.createElasticIndex = function(index,cb) {
    //1)creating index
    esClient.indices.create({
      index : index
    },function(error,resp,status){
      if(error){
        cb(error);
      }
      else{
        var result = {
          status : status,
          response : resp
        }
        cb(null,result);
      }
    });

  }

  Company.insertAtIndex = function(insertObject,cb) {
    //2)adding document to index
    esClient.index({
      index : insertObject.index,
      id : insertObject.id,
      type : insertObject.type,
      body : {
        "firstName" : insertObject.body.firstName,
        "lastName": insertObject.body.lastName,
        "techStack" : insertObject.body.techStack,
        "duration" : insertObject.body.duration,
      }
    },function(error,res,status) {
      if(error){
        cb(error);
      }
      else {
        var result = {
          status : status,
          response : res
        }
        cb(null,result);
      }
    });
  }

  Company.searchFromElastic = function (object,cb) {
    console.log(object);
    esClient.search({
      index : object.index,
      type : object.type,
      body : {
        query : {
          match : {
            firstName : object.firstName
          }
        }
      }
    },function (error,response,status) {
      if(error){
        cb(error);
      }else {
        var result = {
          status : status,
          response :response.hits.hits
        }
        cb(null,result);
      }
    });


  }


  Company.updateCompany = function(companyId,cb) {
    var Scheduler = app.models.scheduler;
    Company.find({ where : {_id : companyId }},function(err,doc){
           try{
                 if(err) throw err;
                 if(doc.length < 1){
                   return cb(null,null)
                 }
                 Scheduler.find({ where : { companyId : doc[0].id }},function(err,result){
                   if(err) throw err;
                   var  jobObject = JSON.parse(result[0]);
                   console.log(jobObject.j.cancel());
                   cb(null,result);
                 });
           }catch(e){
             console.error(e);
           }
         });
  }

  Company.addCompany = function(companyObject,cb) {
    var startDate = companyObject.startDate;
    var date = new Date(startDate);
    var teckStack = companyObject.teckStack;
    var shortName = companyObject.shortName;
    var newDate = date.getDate()+"-"+date.getMonth()+"-"+date.getFullYear();
    companyObject.batchName = shortName+"_"+teckStack+"_"+newDate;
    companyObject.save(function(err,doc){
      try{
        if(err) throw err;
        var result = {
          status : 'successfull',
          company : companyObject,
          message : 'Company added successfully'
        }
        client.hmset('hellocompany',companyObject.id,JSON.stringify({
          startTime : companyObject.startTime,
          endTime : companyObject.endTime,
          date : companyObject.startDate
        }));
        cb(null,result);
      }catch(e){
        console.error(err);
      }
    });
  }



  // Company.SchedulRunner = function(companyId){
  //   var Learner = app.models.Learner;
  //     console.log('Hello Vimlesh....!!! Checking MQTT');
  //     Learner.find({ where: { companyId : companyId }  },function(err,doc) {
  //       // for(var i in doc) {
  //       //   console.log(doc[i]);
  //       //   clientMqtt.publish('learner/'+companyId,'Your machine has been started');
  //       // }
  //       console.log(doc);
  //     });
  // }
  // Company.SchedulRunner('5b509279dd0b286de873f445');




  Company.observe('after save', function(ctx, next) {
    var Scheduler = app.models.Scheduler;
    // var email = ctx.instance.email;
    // var event = new EventEmitter();
    // event.on('email', () => {
    //   console.log('Sending email');
    //   emailService.emailService(email);
    // });
    // console.log(ctx.instance);
    if(ctx.instance.isDeleted == false && ctx.isNewInstance == true ) {
    var startTime = ctx.instance.startTime.split(/:| /);
    var startHour = startTime[0];
    var startMinute = startTime[1];
    // event.emit('email');
    // console.log('Email Sent');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [0, new schedule.Range(1 , 6)];
    rule.hour = startHour;
    rule.minute = startMinute;
    var job = schedule.scheduleJob(rule, function(){
      var Learner = app.models.Learner;
      Learner.find({where : {companyId : ctx.instance.id}},function(err,doc){
        try{
          if(err) throw err;
          for(var i in doc) {
            console.log(doc[i]);
          }
          clientMqtt.publish('learner/'+ctx.instance.id,'Your machine has been started');
          // clientMqtt.subscribe('learner/'+ctx.instance.id);
        }catch(e){
          console.log(e);
        }
      });
    });
    var variable = job; //JSON.stringify(job);
    console.log("job:", typeof variable,variable);
    Scheduler.create([{
      companyId : ctx.instance.id,
      j : variable
    }],function(err,done){
      console.log('scheduler saved', done);
    })

    var rule1 = new schedule.RecurrenceRule();
    rule1.dayOfWeek = [0, new schedule.Range(1 , 6)];
    var endTime = ctx.instance.endTime.split(/:| /);
    var endHour = endTime[0];
    var endMinute = endTime[1];
    rule1.hour = endHour;
    rule1.minute = endMinute;
    var j = schedule.scheduleJob(rule1,function() {
      console.log("Its Closing Time!!!");
    });
  }
  else {
    console.log('Data Not Saved SuccessFully');
  }
  next();
});

  Company.softDelete = function(companyName,cb){
    Company.find({where : { name : companyName } },function(err,doc){
      try{
            if(err) throw err;
            if(doc.length < 1){
              return cb(null,null)
            }
            let companyDoc  = doc[0];
            companyDoc.isDeleted = true;
            companyDoc.save(function(err,result) {
              if(err) throw err;
              cb(null,result);
            });
      }catch(e){
        console.error(e);
      }
    });
  }

   Company.findAllCompanies = function(cb){
     // client.hgetall('hellocompany',function(err,doc) {
     //   var array = [];
     //   for(var i in doc) {
     //      array.push(JSON.parse(doc[i]));
     //   }
     //   // console.log(doc);
     //   cb(null,array);
     // });
     Company.find(function(err,result){
       try{
         if(err) throw err;
         var response = {
           status : "successfull",
           data : result,
           message : "Fetched all company details"
         }
         cb(null,response);
       }catch(e){
         console.error(e);
       }
     });
   }

   Company.remoteMethod('createElasticIndex',{
     http : {
       path : '/index',
       verb : 'post',
       status : 200
     },
     returns : {
       arg : 'result',
       root : true
     },
     accepts : {
       arg : 'index',
       type : 'string'
     }
   });

   Company.remoteMethod('searchFromElastic',{
     http : {
       path : '/searchFromElastic',
       verb : 'post',
       source : 'body',
       status : 200
     },
     returns : {
       arg : 'result',
       root : true
     },
     accepts : {
       arg : 'object',
       type : 'object',
       http : {
         source : 'body'
       }
     }
   })

   Company.remoteMethod('insertAtIndex',{
     http : {
       path : '/insertAtIndex',
       verb : 'post',
       source : 'body',
       status : 200
     },
     returns : {
       arg : 'result',
       root : true
     },
     accepts : {
       arg : 'object',
       type : 'object',
       http : {
         source : 'body'
       }
     }
   })



   Company.remoteMethod('findAllCompanies',{
     http : {
        path : '/findAllCompanies',
        verb : 'get',
        status : 200
      },
      returns: {
        arg : 'data',
        root : true
      }
   });

   Company.remoteMethod('updateCompany',{
     http : {
        path : '/updateCompany',
        verb : 'post',
        status : 200
      },
      returns: {
        arg : 'data',
        root : true
      },
      accepts : {
        arg: 'companyId',
        type : 'string'
       }
   });

   Company.remoteMethod('addCompany',{
     http : {
        path : '/addCompany',
        verb : 'post',
        source : 'body',
        status : 200
      },
      returns: {
        arg : 'data',
        root : true
      },
      accepts : {
        arg  : 'companyDetails',
        type:"company",
        http:{
          "source":"body"
        }
      }
   });

  Company.remoteMethod('config',{
    http : {
       path : '/configWeekOff',
       verb : 'get',
       status : 200
     },
     returns: {
       arg : 'data',
       root : true
     }
  });

   Company.remoteMethod('softDelete',{
     http : {
        path : '/delete',
        verb : 'post',
        status : 200
      },
      returns: {
        arg : 'data',
        root : true
      },
      accepts : {
        arg : 'companyName',
        type : 'string'
      }
   });
};

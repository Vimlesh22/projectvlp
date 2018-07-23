const chai = require('chai');
const expect = require('chai').expect;
chaiHttp = require('chai-http');
var app = require('../server/server.js');
chai.use(chaiHttp);

const addCompany = require('../common/models/company').findAllCompanies;

describe('Api end Point /findAllCompanies',function(){
  it('should list all the company',function(){
    return chai.request(app)
    .get('/api/companies/findAllCompanies')
    .then(function(res){
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.an('object');
    });
  });
});

describe('Api End point /addCompany' ,function () {
  it('should add a company in list',function(){
    return chai.request(app)
    .post('/api/companies/addCompany')
    .send({
      "name": "Capegemini",
      "shortName": "TG",
      "email": "kumarvimlessh007@gmail.com",
      "teckStack": "java",
      "startDate": "2018-07-21T07:14:33.807Z",
      "startTime": "17:14 PM",
      "endTime": "17:15 PM",
      "batchName": "TG_java_21-6-2018",
      "isDeleted": false,
      "weeklyOff": [
        "Saturday",
        "Sunday"
      ]
    })
    .then(function (res) {
      expect(res).to.have.status(200);
      expect(res).to.be.an('object');
    });
  });
});

'use strict';
const helper = require('./helper');

module.exports = function(Learner) {
helper(Learner,['create','update','delete']);
console.log(Learner.relations);
};

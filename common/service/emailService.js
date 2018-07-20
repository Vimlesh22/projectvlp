/***************************************************************************************
 *  Purpose         : Defines all the Services required to send email to particular user for email verification.
 *
 *  @description
 *
 *  @file           : emailService.js
 *  @overview       : Creating transporter and helper method for sending email.
 *  @author         : Vimlesh Kumar <kumarvimlesh007@gmail.com>
 *  @version        : 1.0
 *  @since          : 17-05-2018
 *
 *****************************************************************************************/
 /**
 * @description Dependencies require to be installed before the execution of this file.
 * @var {Class} nodemailer class instance of the nodemailer.
 * @var {Class} config class instance
 * @var {Class} tokenGenerator class instance of token-generator
 */

const nodemailer = require('nodemailer');
const XOAuth2 = require('xoauth2');
var smtpTransport = require('nodemailer-smtp-transport');

var TokenGenerator = require( 'token-generator' )({
       salt: 'thisismysecret',
       timestampMap: 'abcdefghij',
   });

function EmailService() {

};

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: "fundoo8080@gmail.com",
    pass : "pubggoku"
    // clientId: "782825772780-jv4f6s2me8vp34cckq6lrm2jfpglch3p.apps.googleusercontent.com",
    // clientSecret: "DQix2f0jhHHL_y1-BbAvN6YE",
    // refreshToken: "1/j9OhxTCavS85bsoxAXPo9OB3a-lK9Jp_TFBOKSNoS_o",
  }
});

/**
 * @description Prototype property adding the property functions for NoteModel Calss.
 * @method emailService() - Create a method to whom email is to sent after user clicking on forget password link.
 */
EmailService.prototype.emailService = async (email,callback) => {
  var token = TokenGenerator.generate();
  var forgotURL = 'http://localhost:3000/' + 'api/forgetpassword?token=' + token;
  var helperOptions = {
    from : 'Vimlesh Kumar <kumarvimlesh007@gmail.com>',
    to : email,
    subject : 'Confirm Email',
    html : 'Please click the link to confirm your email.<a href="'+forgotURL+'">click</a>'
  }
  await transporter.sendMail(helperOptions, callback);
};

module.exports = new EmailService();

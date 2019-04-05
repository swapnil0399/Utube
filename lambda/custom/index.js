/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
var {google} = require('googleapis');
var fs = require('fs');
var googleAuth = require('google-auth-library');
var client;

function searchListByKeyword(auth, requestData) {
  var service = google.youtube('v3');
  var parameters = requestData['params'];
  parameters['auth'] = auth;
  service.search.list(parameters, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    console.log(response);
  });
}

fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }

  client = JSON.parse(content);

});


const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) { 
    console.log('session details', handlerInput.requestEnvelope.session.sessionId);
    console.log('accessToken: ', handlerInput.requestEnvelope.context.System.user.accessToken);
    var accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
    if (accessToken == undefined) {
      //no token, show link account card
      handlerInput.responseBuilder.shouldEndSession(true).say('Your Youtube account is not linked');
      return true;
    } else {
      // i've got a token! move forward
      const speechText = 'What do you want me to play on Youtube?';
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .withSimpleCard(speechText)
        .getResponse();
    }
  }
};

const StreamYoutubeIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'StreamYoutubeIntent';
  },
  handle(handlerInput) {
    
    var keyword = handlerInput.requestEnvelope.request.intent.slots.value.value;
    
    const speechText = keyword;

    // return handlerInput.responseBuilder
    //   .speak(speechText)
    //   .withSimpleCard('Hello World', speechText)
    //   .getResponse();
    
      var requestData = {
                          'params': {
                            'maxResults': '10',
                            'part': 'snippet',
                            'q': keyword,
                            'type': 'video'}
                        }

      var credentials = client;
      var clientSecret = credentials.web.client_secret;
      var clientId = credentials.web.client_id;
      var redirectUrl = credentials.web.token_uri;
      var auth = new googleAuth();
      var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
      oauth2Client.credentials = JSON.parse(handlerInput.requestEnvelope.context.System.user.accessToken);

      var res = searchListByKeyword(auth, requestData);
      if(res != undefined){
        return handlerInput.responseBuilder
        .speak("Obtained")
        .withSimpleCard('Hello World', speechText)
        .getResponse();
      }
      
      console.log(res);

      
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    StreamYoutubeIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

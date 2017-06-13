var express    			=  require('express'),
	bodyParser 			=  require('body-parser'),
	application         =  express(),
	cors                =  require('./authentication/cors-filter')(application),
	fs 					=  require('fs'),
	https 				=  require('http'),
	constantValues		=  require('./constant-values')(),
	genericConstants 	=  require('./generic-constants')(constantValues),
	tokenHandler 		=  require('./token-handler')(application, genericConstants),
	personalityTools    =  require('./personality/personality-tools')(),
    mongodb = require('mongodb'),
    mongoClient = mongodb.MongoClient;

mongoClient.connect(genericConstants.MONGO_URL, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    var authMongoHandler    = require('./mongo-handlers/authentication-mongo-handler')(genericConstants, db),
		persMongoHandler    = require('./mongo-handlers/personality-mongo-handler')(genericConstants, db),
		gkMongoHandler		= require('./mongo-handlers/gk-mongo-handler')(genericConstants, db),
		intelMongoHandler	= require('./mongo-handlers/intel-mongo-handler')(genericConstants, db),
		genericTools 		= require('./generic-tools')(genericConstants);
		
	    require('./authentication/authentication-server')(application, 
			genericConstants, tokenHandler, authMongoHandler, persMongoHandler, intelMongoHandler, gkMongoHandler, genericTools, personalityTools);
		require('./personality/personality-server')(application, genericConstants, tokenHandler, persMongoHandler, genericTools, tokenHandler);
		require('./intelligence/intel-server')(application, genericConstants, tokenHandler, intelMongoHandler, genericTools);
		require('./general-knowledge/gk-server')(application, genericConstants, tokenHandler, gkMongoHandler, genericTools);
  }
});


application.use(bodyParser.json());
application.use(bodyParser.urlencoded({
    extended : true
}));

/*var options = {
    key: fs.readFileSync('./newkey.pem'),
    cert: fs.readFileSync('./cert.pem')
};
*/

https.createServer(/*options, */application).listen(process.env.PORT, function(){
  console.log("Express server listening on port " + process.env.PORT);
});

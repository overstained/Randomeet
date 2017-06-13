module.exports = function(application, genericConstants, tokenHandler, gkMongoHandler, genericTools) {
	var gkConstants		 	  	=  require('./gk-constants')(),
		gkService               =  require('./gk-service')(application, gkConstants, genericConstants, gkMongoHandler, tokenHandler);


	application.post(genericConstants.RANDOM_GK_QUESTION_URL, function(req, res) {
		 var data = req.body,
             token = req.headers[genericConstants.TOKEN_HEADER],
             user = token?tokenHandler.decodeToken(token):null;

          if(!user ||
          !data.reqtimestamp) {
            return res.status(genericConstants.UNAUTHORIZED).json({
                error: genericConstants.INCOMPLETE_DATA.message
            });
          }

         var requestTime = new Date() - new Date(data.reqtimestamp);

          gkService
         .getRandomQuestion(user, requestTime, res);
	});

	application.post(genericConstants.ANSWER_GK_QUESTION_URL, function(req, res) {
		 var quiz = req.body,
             token = req.headers[genericConstants.TOKEN_HEADER],
             user = token?tokenHandler.decodeToken(token):null;

         if(quiz.answerId == null ||
            quiz.reqtimestamp == null) {
            return res.status(genericConstants.UNAUTHORIZED).json({
                message: genericConstants.INCOMPLETE_DATA.message
            });
         }

         var requestTime = new Date() - new Date(quiz.reqtimestamp);

          gkService
         .answerQuestion(user, requestTime, quiz, res);
	});
};
module.exports = function(application, genericConstants, tokenHandler, persMongoHandler, genericTools, tokenHandler) {
	var personalityConstants		 	  	=  require('./personality-constants')(),
		  personalityService  		  	  =  require('./personality-service')(application, personalityConstants, genericConstants, persMongoHandler, tokenHandler);


	application.get(genericConstants.NEXT_PERSONALITY_QUESTION_URL, function(req, res) {
  		var token = req.headers[genericConstants.TOKEN_HEADER],
			    user = token? tokenHandler.decodeToken(token):null;
      if(!user) {
        return res.status(genericConstants.UNAUTHORIZED).json({
            error: genericConstants.INCOMPLETE_DATA.message
        });
      }

  		 personalityService
  		.getNextQuestion(user.ky, res)
  		.catch(function(error) {
  			res.status(genericConstants.INTERNAL_ERROR).json({
  				message: error.message,
          trace: 'P-SRV-NQ'
  			});
  		});
  });

  application.post(genericConstants.ANSWER_PERSONALITY_QUESTION_URL, function(req, res) {
      var question = req.body;
      var token = req.headers[genericConstants.TOKEN_HEADER],
          user = token? tokenHandler.decodeToken(token): null;
      if(question.answer == null ||
        question.negativelyAffectedType == null ||
        !user) {
        return res.status(genericConstants.UNAUTHORIZED).json({
            error: genericConstants.INCOMPLETE_DATA.message
        });
      }

      personalityService.
      answerQuestion(user, question, res)
      .catch(function(err) {
        res.status(genericConstants.INTERNAL_ERROR).json({
          message: err.message,
          trace: 'P-SRV-AQ'
        });
      });
  });
};
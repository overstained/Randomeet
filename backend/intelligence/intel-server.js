module.exports = function(application, genericConstants, tokenHandler, iqMongoHandler, genericTools) {
	var iqConstants		 	  	=  require('./intel-constants')(),
		iqService               =  require('./intel-service')(application, iqConstants, genericConstants, iqMongoHandler, tokenHandler);



	application.post(genericConstants.RANDOM_IQ_QUESTION_URL, function(req, res) {
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

      iqService
     .getRandomQuestion(user, requestTime, res)
     .catch(function(error) {
       	res.status(genericConstants.INTERNAL_ERROR).json({
       		message: error.message,
       		trace: 'IQ-SRV-GRQ'
       	});
     });
	});

	application.post(genericConstants.ANSWER_IQ_QUESTION_URL, function(req, res) {
		 var question = req.body,
		 	 token = req.headers[genericConstants.TOKEN_HEADER],
         	 user = token?tokenHandler.decodeToken(token):null;

         if(question.answerId == null ||
          question.reqtimestamp == null) {
         	res.status(genericConstants.UNAUTHORIZED).json({
         		message: genericConstants.INCOMPLETE_DATA.message
         	});
         }

         var requestTime = new Date() - new Date(question.reqtimestamp);

          iqService
         .answerQuestion(user, requestTime, question, res)
         .catch(function(error) {
            res.status(genericConstants.INTERNAL_ERROR).json({
                message: error.message,
                trace: 'IQ-SRV-AQ'
            });
         });
    });
};
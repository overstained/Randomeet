module.exports = function(application, gkConstants, genericConstants, gkMongoHandler, tokenHandler) {
	var schedule = require('node-schedule'),
		questionCount = 0;
	var constantValues = genericConstants.GET_VALUES;

	var removeTimedOutQuestions = function() {
		 gkMongoHandler
		.updateUserScoreGlobal()
		.then(function() {
		})
		.catch(function(error) {
	   		console.log('Error while updating score for timed out questions!', error.message);
	   });
	}, sendNewQuestion = function(user, res, requestTime, sendToken) {
		 gkMongoHandler
		.getRandomQuestion()
		.then(function(data) {
			 var timeLimit = constantValues.GK_TIME_LIMIT;
			 gkMongoHandler
		    .setTimeout(user.ky, data._id, 2 * requestTime)
		    .then(function() {
				delete data.correctAnswerID;
				data.expirationTimestamp = Date.now() + timeLimit;
				if(sendToken) {
					console.log('sendingToken', sendToken);
					res.writeHead(genericConstants.OK, {'x-auth-token': tokenHandler.generateToken(user)});
					res.end(JSON.stringify(data));
				} else {
					res.status(genericConstants.OK).json(data);
				}
		    })
		    .catch(function(error) {
		    	res.status(genericConstants.INTERNAL_ERROR).json({
					message: error.message,
					trace: 'IQ-SCE-GRQ'
				});
		    });	
		})
		.catch(function(error) {
			res.status(genericConstants.INTERNAL_ERROR).json({
				message: error.message,
				trace: 'IQ-SCE-GRQ'
			});
		});
	};


	return {
		getRandomQuestion: function(user, requestTime, res) {
			return gkMongoHandler
			.getQuestionForUser(user.ky)
			.then(function(data) {
				var timeLimit = 0;
				if(data.gkQuestion && data.gkQuestion.length !== 0) {
					 var gkQuestion = data.gkQuestion[0];
					 timeLimit = constantValues.GK_TIME_LIMIT;

					var diftime = new Date() - Date.parse(data.generalKnowledge.ongoingGKQuestion.startedTimestamp);
					if(diftime < timeLimit + 2 * requestTime) {
						gkMongoHandler
						.updateTimeout(user.ky, 2 * requestTime, function(err) {
							delete gkQuestion.correctAnswerID;
							gkQuestion.expirationTimestamp = Date.now() + (timeLimit-diftime);
							res.status(genericConstants.OK).json(gkQuestion);
						});
					} else {
						 gkMongoHandler
						.updateUserScore(user.ky, false, function(err, gkScore, remaining) {
							console.log('gkScore: ', gkScore);
							gkMongoHandler
							.removeTimeout(user.ky)
							.then(function() {
								user.gk = gkScore;
								user.gkR = remaining;
								console.log(user);
								sendNewQuestion(user, res, requestTime, true);
							})
							.catch(function(err) {
							});
						});
					}
				} else {
					sendNewQuestion(user, res, requestTime, false);
				}
			});
		},
		answerQuestion: function(user, requestTime, question, res) {
			return gkMongoHandler
			.getQuestionForUser(user.ky)
			.then(function(data) {
				var timeLimit = 0;
				if(data.gkQuestion && data.gkQuestion.length !== 0) {
					 var gkQuestion = data.gkQuestion[0];
					 timeLimit = constantValues.GK_TIME_LIMIT;

					 var diftime = new Date() - Date.parse(data.generalKnowledge.ongoingGKQuestion.startedTimestamp);
					 var isCorrect = false;
					 if(diftime < (timeLimit + requestTime)) {
					 	isCorrect = question.answerId === parseInt(gkQuestion.correctAnswerID);
					 }

					 gkMongoHandler
					.updateUserScore(user.ky, isCorrect, function(err, gkScore, remaining) {
						gkMongoHandler
						.removeTimeout(user.ky)
						.then(function() {
							user.gk = gkScore;
							user.gkR = remaining;
							res.writeHead(genericConstants.OK, {'x-auth-token': tokenHandler.generateToken(user)});
							res.end();
						})
						.catch(function(err) {
							console.log(err);
						});
					});
				}
			});
		}
		
	};
};
module.exports = function(application, iqConstants, genericConstants, iqMongoHandler, tokenHandler) {
	var schedule = require('node-schedule');
	var constantValues = genericConstants.GET_VALUES;

	var removeAllDifficultiesTimedOutQuestions = function() {
		 iqMongoHandler
		.updateUserScoreGlobalEasy()
		.then(function() {
		})
		.catch(function(error) {
	   		console.log('Error while updating score for easy timed out questions!', error.message);
	    });
		iqMongoHandler
		.updateUserScoreGlobalMedium()
		.then(function() {
		})
		.catch(function(error) {
	   		console.log('Error while updating score for medium timed out questions!', error.message);
	    });
  		iqMongoHandler
		.updateUserScoreGlobalHard()
		.then(function() {
		})
		.catch(function(error) {
	   		console.log('Error while updating score for hard timed out questions!', error.message);
	    });
	}, sendNewQuestion = function (user, res, requestTime, sendToken) {
		var random = Math.random(), difficulty = 0;
		if(random >= constantValues.IQ_PROBABILITY_SPLIT[0] && random < constantValues.IQ_PROBABILITY_SPLIT[1]) {
			difficulty = 1;
		} else if(random >= constantValues.IQ_PROBABILITY_SPLIT[1]) {
			difficulty = 2;
		}

		 iqMongoHandler
		.getRandomQuestion(difficulty)
		.then(function(data) {
		    var timeLimit = parseInt(data.difficulty) === 0 ? constantValues.IQ_TIME_LIMIT_EASY:
			 (parseInt(data.difficulty) === 1? constantValues.IQ_TIME_LIMIT_MEDIUM : 
			  constantValues.IQ_TIME_LIMIT_HARD);
			 iqMongoHandler
		    .setTimeout(user.ky, data._id, 2 * requestTime)
		    .then(function() {
				delete data.correctAnswerID;
				data.expirationTimestamp = Date.now() + timeLimit;
				if(sendToken) {
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

	//removeAllDifficultiesTimedOutQuestions();
	//updateRemainingIqQuestions();

	//should run every hour!
	/*schedule.scheduleJob('* * 1 * *', function(){
		removeAllDifficultiesTimedOutQuestions();
	});*/


	return {
		getRandomQuestion: function(user, requestTime, res) {
			return iqMongoHandler
			.getQuestionForUser(user.ky)
			.then(function(data) {
				var timeLimit = 0;
				if(data.iqQuestion && data.iqQuestion.length !== 0) {
					 var iqQuestion = data.iqQuestion[0];
					 timeLimit = parseInt(iqQuestion.difficulty) === 0 ? constantValues.IQ_TIME_LIMIT_EASY:
					 (parseInt(iqQuestion.difficulty) === 1? constantValues.IQ_TIME_LIMIT_MEDIUM : 
					  constantValues.IQ_TIME_LIMIT_HARD);

					var diftime = new Date() - Date.parse(data.intelligence.ongoingIQQuestion.startedTimestamp);
					if(diftime < timeLimit + 2 * requestTime) {
						iqMongoHandler
						.updateTimeout(user.ky, 2 * requestTime, function(err) {
							delete iqQuestion.correctAnswerID;
							iqQuestion.expirationTimestamp = Date.now() + (timeLimit-diftime);
							res.status(genericConstants.OK).json(iqQuestion);
						});
					} else {
						 iqMongoHandler
						.updateUserScore(user.ky, iqQuestion.difficulty, false, function(err, iqScore, remaining) {
							console.log('iqScore: ', iqScore);
							iqMongoHandler
							.removeTimeout(user.ky)
							.then(function() {
								user.iq = iqScore;
								user.iqR = remaining;
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
			return iqMongoHandler
			.getQuestionForUser(user.ky)
			.then(function(data) {
				var timeLimit = 0;
				if(data.iqQuestion && data.iqQuestion.length !== 0) {
					 var iqQuestion = data.iqQuestion[0];
					  timeLimit = parseInt(iqQuestion.difficulty) === 0 ? genericConstants.GET_VALUES.IQ_TIME_LIMIT_EASY:
					 (parseInt(iqQuestion.difficulty) === 1? genericConstants.GET_VALUES.IQ_TIME_LIMIT_MEDIUM : 
					  genericConstants.GET_VALUES.IQ_TIME_LIMIT_HARD);

					 var diftime = new Date() - Date.parse(data.intelligence.ongoingIQQuestion.startedTimestamp);
					 var isCorrect = false;
					 if(diftime < (timeLimit + requestTime)) {
					 	isCorrect = question.answerId === parseInt(iqQuestion.correctAnswerID);
					 }

					 iqMongoHandler
					.updateUserScore(user.ky, iqQuestion.difficulty, isCorrect, function(err, iqScore, remaining) {
						iqMongoHandler
						.removeTimeout(user.ky)
						.then(function() {
							user.iq = iqScore;
							user.iqR = remaining;
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
module.exports = function(application, personalityConstants, genericConstants, persMongoHandler, tokenHandler) {
		var personalityTools = require('./personality-tools')();

		var getPersonalityExchangeModel = function(data) {
			return {
				index: data.index,
				negativelyAffectedType: data.negativelyAffectedType,
				question: data.question
			};
		};

		return {
			getNextQuestion: function(userId, res) {
				return persMongoHandler
					.getNextQuestion(userId)
					.then(function(data) {
						if(data && data.personalityQuestion[0]) {
							res.status(genericConstants.OK).json(getPersonalityExchangeModel(data.personalityQuestion[0]));
						} else {
							res.status(genericConstants.UNAUTHORIZED).json({
								message: personalityConstants.NO_MORE_QUESTIONS.message 
							});
						}
					});
			},
			answerQuestion: function(user, question, res) {
				return persMongoHandler
					.getCurrentPersonalityRaw(user.ky)
					.then(function(data) {
						if(data) {
							var updatedPersonality = personalityTools.updatePersonality(data.personality.currentPersonalityRaw, 
								parseInt(question.negativelyAffectedType), question.answer);
							var	formattedPersonality = personalityTools.formatPersonality(updatedPersonality);
							var reducedPersonality = personalityTools.reducePersonality(formattedPersonality);
							persMongoHandler
							.updateNextQuestionAndPersonality(user.ky, updatedPersonality, reducedPersonality)
							.then(function() {
								var splitPersonality = updatedPersonality.split('.');
								user.p = {
									t1: splitPersonality[0],
									t2: splitPersonality[1],
									t3: splitPersonality[2],
									t4: splitPersonality[3]
								};
								user.pr = reducedPersonality;
								res.writeHead(genericConstants.OK, {'x-auth-token': tokenHandler.generateToken(user)});
								res.end();		
							}).catch(function(error) {
								res.status(genericConstants.INTERNAL_ERROR).json({
					  				message: error.message,
					  				trace: 'P-SCE-AQ'
					  			});
							});
						} else {
							res.status(genericConstants.UNAUTHORIZED).json({
								message: personalityConstants.UNKNOWN_USER.message 
							});
						}
					});
			}
		};
};
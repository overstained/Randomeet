module.exports = function(genericConstants, db) {
	var userCollection = db.collection('users');
	var iqCollection = db.collection('iqQuestions');
	var ObjectId = require('mongodb').ObjectID;
	var constantValues = genericConstants.GET_VALUES;

	return  {
		getRemainingIqQuestionsForUser: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			return userCollection.findOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_GET_REMAINING_DAILY_IQ_QUESTIONS_QUERY);
		},
		getQuestionForUser: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_GET_IQ_QUESTION_FOR_USER_QUERY[0].$match = genericConstants.MONGO_BY_ID_FILTER;
			return userCollection.aggregate(genericConstants.MONGO_GET_IQ_QUESTION_FOR_USER_QUERY).next();
		},
		getQuestionById: function(questionId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(questionId);
			return iqCollection.findOne(genericConstants.MONGO_BY_ID_FILTER);
		},
		getRandomQuestion: function(difficulty) {
			genericConstants.MONGO_SELECT_RANDOM_IQ_QUERY[0].$match.difficulty = difficulty;
			return iqCollection.aggregate(genericConstants.MONGO_SELECT_RANDOM_IQ_QUERY).next();
		},
		setTimeout: function(userId, questionId, requestTime) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_SET_OR_REMOVE_IQ_TIMEOUT_QUERY.$set['intelligence.ongoingIQQuestion.ongoingIQQuestionID'] = questionId;
			genericConstants.MONGO_SET_OR_REMOVE_IQ_TIMEOUT_QUERY.$set['intelligence.ongoingIQQuestion.startedTimestamp'] = 
			new Date(Date.now() + requestTime).toISOString();
			return userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_SET_OR_REMOVE_IQ_TIMEOUT_QUERY);
		},
		updateTimeout: function(userId, requestTime, callback) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			userCollection.find(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_IQ_TIMEOUT_FIELDS).forEach(function(data) {
				genericConstants.MONGO_UPDATE_IQ_TIMEOUT_QUERY.$set['intelligence.ongoingIQQuestion.startedTimestamp'] = 
			    new Date((Date.parse(data.intelligence.ongoingIQQuestion.startedTimestamp) + requestTime)).toISOString();
			    userCollection
			    .updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_UPDATE_IQ_TIMEOUT_QUERY)
			    .then(function() {
			    	callback();
			    })
			    .catch(function(err) {
			    	callback(err);
			    });  
			});
		},
		removeTimeout: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_SET_OR_REMOVE_IQ_TIMEOUT_QUERY.$set['intelligence.ongoingIQQuestion.ongoingIQQuestionID'] = null;
			genericConstants.MONGO_SET_OR_REMOVE_IQ_TIMEOUT_QUERY.$set['intelligence.ongoingIQQuestion.startedTimestamp'] = null;
			return userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_SET_OR_REMOVE_IQ_TIMEOUT_QUERY);
		},
		updateUserScore: function(userId, difficulty, isCorrect, callback) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			userCollection.find(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_INTELLIGENCE_QUERY).forEach(function(data) {
				var intelligence = data.intelligence;
				if(difficulty === 0) {
					intelligence.correctEasyIQAnswers += isCorrect;
					intelligence.totalEasyIQAnswers += 1;
				}
				if(difficulty === 1) {
					intelligence.correctMediumIQAnswers += isCorrect;
					intelligence.totalMediumIQAnswers += 1;
				}
				if(difficulty === 2) {
					intelligence.correctHardIQAnswers += isCorrect;
					intelligence.totalHardIQAnswers += 1;
				}
				intelligence.currentIQScore = (intelligence.totalEasyIQAnswers !== 0?
						((intelligence.correctEasyIQAnswers/intelligence.totalEasyIQAnswers) * 
						(intelligence.totalEasyIQAnswers/(intelligence.totalEasyIQAnswers + constantValues.ACCELERATION_PARAMETER)) * constantValues.EASY_IQ_WEIGHT):0) +
						(intelligence.totalMediumIQAnswers !== 0?
						((intelligence.correctMediumIQAnswers/intelligence.totalMediumIQAnswers) * 
						(intelligence.totalMediumIQAnswers/(intelligence.totalMediumIQAnswers + constantValues.ACCELERATION_PARAMETER)) * constantValues.MEDIUM_IQ_WEIGHT):0) +
						(intelligence.totalHardIQAnswers !== 0?
						((intelligence.correctHardIQAnswers/intelligence.totalHardIQAnswers) * 
						(intelligence.totalHardIQAnswers/(intelligence.totalHardIQAnswers + constantValues.ACCELERATION_PARAMETER)) * constantValues.HARD_IQ_WEIGHT):0);
				console.log('easy score:', (intelligence.correctEasyIQAnswers/intelligence.totalEasyIQAnswers) * 
						(intelligence.totalEasyIQAnswers/(intelligence.totalEasyIQAnswers + constantValues.ACCELERATION_PARAMETER)) * constantValues.EASY_IQ_WEIGHT);
				console.log('medium score:', (intelligence.correctMediumIQAnswers/intelligence.totalMediumIQAnswers) * 
						(intelligence.totalMediumIQAnswers/(intelligence.totalMediumIQAnswers + constantValues.ACCELERATION_PARAMETER)) * constantValues.MEDIUM_IQ_WEIGHT);
				console.log('hard score:', (intelligence.correctHardIQAnswers/intelligence.totalHardIQAnswers) * 
						(intelligence.totalHardIQAnswers/(intelligence.totalHardIQAnswers + constantValues.ACCELERATION_PARAMETER)) * constantValues.HARD_IQ_WEIGHT);
				intelligence.remainingDailyIQQuestions = Math.max(0, intelligence.remainingDailyIQQuestions-1);
				intelligence.ongoingIQQuestion.ongoingIQQuestionID = null;
				intelligence.ongoingIQQuestion.startedTimestamp = null;
				genericConstants.MONGO_INTELLIGENCE_UPDATE_QUERY.$set.intelligence = intelligence;
				userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_INTELLIGENCE_UPDATE_QUERY)
				.then(function() {
					callback(null, intelligence.currentIQScore, intelligence.remainingDailyIQQuestions);
				})
				.catch(function(err) {
					callback(err);
				});
			});
		},
		updateUserScoreGlobalEasy: function() {
			var shouldHaveStartedAtMost = new Date();
			shouldHaveStartedAtMost.setSeconds(shouldHaveStartedAtMost.getSeconds() - constantValues.IQ_TIME_LIMIT_EASY);
			genericConstants.MONGO_TIMED_OUT_IQ_QUESTIONS_FILTER['intelligence.ongoingIQQuestion.startedTimestamp'].$lte = shouldHaveStartedAtMost.toISOString();
			userCollection.find(genericConstants.MONGO_TIMED_OUT_IQ_QUESTIONS_FILTER, genericConstants.MONGO_INTELLIGENCE_QUERY).forEach(function(data) {
				var intelligence = data.intelligence;
				intelligence.totalEasyIQAnswers += 1;
				intelligence.currentIQScore = intelligence.currentIQScore + (intelligence.correctEasyIQAnswers * (intelligence.totalEasyIQAnswers + 2) + 
					intelligence.correctEasyIQAnswers * (intelligence.totalEasyIQAnswers+1))/
				    ((intelligence.totalEasyIQAnswers+1) * (intelligence.totalEasyIQAnswers+2)) * constantValues.EASY_IQ_WEIGHT;
				intelligence.remainingDailyIQQuestions = Math.max(0, intelligence.remainingDailyIQQuestions-1);
				intelligence.ongoingIQQuestion.ongoingIQQuestionID = null;
				intelligence.ongoingIQQuestion.startedTimestamp = null;
				genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(data._id);
				MONGO_INTELLIGENCE_UPDATE_QUERY.$set.intelligence = intelligence;
				userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, MONGO_INTELLIGENCE_UPDATE_QUERY).then(function() {});
			})
			.catch(function(error) {
				throw error;
			});
		},
		updateUserScoreGlobalMedium: function() {
			var shouldHaveStartedAtMost = new Date();
			shouldHaveStartedAtMost.setSeconds(shouldHaveStartedAtMost.getSeconds() - constantValues.IQ_TIME_LIMIT_MEDIUM);
			genericConstants.MONGO_TIMED_OUT_IQ_QUESTIONS_FILTER['intelligence.ongoingIQQuestion.startedTimestamp'].$lte = shouldHaveStartedAtMost.toISOString();
			userCollection.find(genericConstants.MONGO_TIMED_OUT_IQ_QUESTIONS_FILTER, genericConstants.MONGO_INTELLIGENCE_QUERY).forEach(function(data) {
				var intelligence = data.intelligence;
				intelligence.totalMediumIQAnswers += 1;
				intelligence.currentIQScore = intelligence.currentIQScore + (intelligence.correctMediumIQAnswers * (intelligence.totalMediumIQAnswers + 2) + 
					intelligence.correctMediumIQAnswers * (intelligence.totalMediumIQAnswers+1))/
				    ((intelligence.totalMediumIQAnswers+1) * (intelligence.totalMediumIQAnswers+2)) * constantValues.MEDIUM_IQ_WEIGHT;
				intelligence.remainingDailyIQQuestions = Math.max(0, intelligence.remainingDailyIQQuestions-1);
				intelligence.ongoingIQQuestion.ongoingIQQuestionID = null;
				intelligence.ongoingIQQuestion.startedTimestamp = null;
				genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(data._id);
				MONGO_INTELLIGENCE_UPDATE_QUERY.$set.intelligence = intelligence;
				userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, MONGO_INTELLIGENCE_UPDATE_QUERY).then(function() {});
			})
			.catch(function(error) {
				throw error;
			});
		},
		updateUserScoreGlobalHard: function() {
			var shouldHaveStartedAtMost = new Date();
			shouldHaveStartedAtMost.setSeconds(shouldHaveStartedAtMost.getSeconds() - constantValues.IQ_TIME_LIMIT_HARD);
			genericConstants.MONGO_TIMED_OUT_IQ_QUESTIONS_FILTER['intelligence.ongoingIQQuestion.startedTimestamp'].$lte = shouldHaveStartedAtMost.toISOString();
			userCollection.find(genericConstants.MONGO_TIMED_OUT_IQ_QUESTIONS_FILTER, genericConstants.MONGO_INTELLIGENCE_QUERY).forEach(function(data) {
				var intelligence = data.intelligence;
				intelligence.totalHardIQAnswers += 1;
				intelligence.currentIQScore = intelligence.currentIQScore + (intelligence.correctHardIQAnswers * (intelligence.totalHardIQAnswers + 2) + 
					intelligence.correctHardIQAnswers * (intelligence.totalHardIQAnswers+1))/
				    ((intelligence.totalHardIQAnswers+1) * (intelligence.totalHardIQAnswers+2)) * constantValues.HARD_IQ_WEIGHT;
				intelligence.remainingDailyIQQuestions = Math.max(0, intelligence.remainingDailyIQQuestions-1);
				intelligence.ongoingIQQuestion.ongoingIQQuestionID = null;
				intelligence.ongoingIQQuestion.startedTimestamp = null;
				genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(data._id);
				MONGO_INTELLIGENCE_UPDATE_QUERY.$set.intelligence = intelligence;
				userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, MONGO_INTELLIGENCE_UPDATE_QUERY).then(function() {});
			})
			.catch(function(error) {
				throw error;
			});
		}
	};
};
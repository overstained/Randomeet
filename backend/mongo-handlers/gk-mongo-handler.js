module.exports = function(genericConstants, db) {
	var userCollection = db.collection('users');
	var gkCollection = db.collection('gkQuestions');
	var ObjectId = require('mongodb').ObjectID;
	var constantValues = genericConstants.GET_VALUES;

	return  {
		getRemainingGkQuestionsForUser: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			return userCollection.findOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_GET_REMAINING_DAILY_GK_QUESTIONS_QUERY);
		},
		getQuestionForUser: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_GET_GK_QUESTION_FOR_USER_QUERY[0].$match = genericConstants.MONGO_BY_ID_FILTER;
			return userCollection.aggregate(genericConstants.MONGO_GET_GK_QUESTION_FOR_USER_QUERY).next();
		},
		getQuestionById: function(questionId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(questionId);
			return gkCollection.findOne(genericConstants.MONGO_BY_ID_FILTER);
		},
		getRandomQuestion: function() {
			return gkCollection.aggregate([genericConstants.MONGO_SELECT_RANDOM_QUERY]).next();
		},
		setTimeout: function(userId, questionId, requestTime) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_SET_OR_REMOVE_GK_TIMEOUT_QUERY.$set['generalKnowledge.ongoingGKQuestion.ongoingGKQuestionID'] = questionId;
			genericConstants.MONGO_SET_OR_REMOVE_GK_TIMEOUT_QUERY.$set['generalKnowledge.ongoingGKQuestion.startedTimestamp'] =
			new Date(Date.now() + requestTime).toISOString();
			return userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_SET_OR_REMOVE_GK_TIMEOUT_QUERY);
		},
		removeTimeout: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_SET_OR_REMOVE_GK_TIMEOUT_QUERY.$set['generalKnowledge.ongoingGKQuestion.ongoingGKQuestionID'] = null;
			genericConstants.MONGO_SET_OR_REMOVE_GK_TIMEOUT_QUERY.$set['generalKnowledge.ongoingGKQuestion.startedTimestamp'] = null;
			return userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_SET_OR_REMOVE_GK_TIMEOUT_QUERY);
		},
		updateUserScore: function(userId, isCorrect, callback) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			userCollection.find(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_GENERAL_KNOWLEDGE_QUERY).forEach(function(data) {
				var generalKnowledge = data.generalKnowledge;
				generalKnowledge.correctGKAnswers += isCorrect;
				generalKnowledge.totalGKAnswers += 1;
				generalKnowledge.currentGKScore = generalKnowledge.correctGKAnswers/generalKnowledge.totalGKAnswers * 
				(generalKnowledge.totalGKAnswers/(generalKnowledge.totalGKAnswers + constantValues.ACCELERATION_PARAMETER))
				* constantValues.MAX_GK_SCORE;
				generalKnowledge.remainingDailyGKQuestions = Math.max(0, generalKnowledge.remainingDailyGKQuestions-1);
				generalKnowledge.ongoingGKQuestion.ongoingGKQuestionID = null;
				generalKnowledge.ongoingGKQuestion.startedTimestamp = null;
				genericConstants.MONGO_GENERAL_KNOWLEDGE_UPDATE_QUERY.$set.generalKnowledge = generalKnowledge;
				userCollection
				.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_GENERAL_KNOWLEDGE_UPDATE_QUERY)
				.then(function() {
					callback(null, generalKnowledge.currentGKScore, generalKnowledge.remainingDailyGKQuestions);
				})
				.catch(function(err) {
					callback(err);
				});
			})
			.catch(function(error) {
				callback(err);
			});
		},
		updateTimeout: function(userId, requestTime, callback) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			userCollection.find(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_GK_TIMEOUT_FIELDS).forEach(function(data) {
				genericConstants.MONGO_UPDATE_GK_TIMEOUT_QUERY.$set['generalKnowledge.ongoingGKQuestion.startedTimestamp'] = 
			    new Date((Date.parse(data.generalKnowledge.ongoingGKQuestion.startedTimestamp) + requestTime)).toISOString();
			    userCollection
			    .updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_UPDATE_GK_TIMEOUT_QUERY)
			    .then(function() {
			    	callback();
			    })
			    .catch(function(err) {
			    	callback(err);
			    });  
			});
		},
		updateUserScoreGlobal: function() {
			var shouldHaveStartedAtMost = new Date();
			shouldHaveStartedAtMost.setSeconds(shouldHaveStartedAtMost.getSeconds() - constantValues.GK_TIME_LIMIT);
			genericConstants.MONGO_TIMED_OUT_GK_QUESTIONS_FILTER['generalKnowledge.ongoingGKQuestion.startedTimestamp'].$lte = shouldHaveStartedAtMost.toISOString();
			userCollection.find(genericConstants.MONGO_TIMED_OUT_GK_QUESTIONS_FILTER, genericConstants.MONGO_GENERAL_KNOWLEDGE_QUERY).forEach(function(data) {
				var generalKnowledge = data.generalKnowledge;
				generalKnowledge.correctGKAnswers += isCorrect;
				generalKnowledge.totalGKAnswers += 1;
				generalKnowledge.currentGKScore = generalKnowledge.correctGKAnswers/(generalKnowledge.totalGKAnswers+1);
				generalKnowledge.remainingDailyGKQuestions = Math.max(0, generalKnowledge.remainingDailyGKQuestions-1);
				generalKnowledge.ongoingGKQuestion.ongoingGKQuestionID = null;
				generalKnowledge.ongoingGKQuestion.startedTimestamp = null;
				genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(data._id);
				MONGO_GENERAL_KNOWLEDGE_UPDATE_QUERY.$set.generalKnowledge = generalKnowledge;
				userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, MONGO_GENERAL_KNOWLEDGE_UPDATE_QUERY).then(function() {});
			});
		}
	};
};
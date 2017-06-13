module.exports = function(genericConstants, db) {
	var userCollection = db.collection('users');
	var ObjectId = require('mongodb').ObjectID;

	return  {
		getNextQuestion: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_GET_NEXT_PERSONALITY_QUESTION_QUERY[0].$match = genericConstants.MONGO_BY_ID_FILTER;
			return userCollection.aggregate(genericConstants.MONGO_GET_NEXT_PERSONALITY_QUESTION_QUERY).next();
		},
		updateNextQuestionAndPersonality: function(userId, currentPersonalityRaw, currentPersonality) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_UPDATE_NEXT_QUESTION_AND_PERSONALITY_QUERY.$set['personality.currentPersonalityRaw'] = currentPersonalityRaw;
			genericConstants.MONGO_UPDATE_NEXT_QUESTION_AND_PERSONALITY_QUERY.$set['personality.currentPersonality'] = currentPersonality;
			console.log(genericConstants.MONGO_UPDATE_NEXT_QUESTION_AND_PERSONALITY_QUERY);
			return userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_UPDATE_NEXT_QUESTION_AND_PERSONALITY_QUERY);
		},
		getCurrentPersonalityRaw: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			return userCollection.findOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_GET_CURRENT_PERSONALITY_RAW_QUERY);
		}
	};
};
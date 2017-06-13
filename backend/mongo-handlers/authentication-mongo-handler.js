module.exports = function(genericConstants, db, o) {
	var userCollection = db.collection('users');
	var ObjectId = require('mongodb').ObjectID;
	var constantValues = genericConstants.GET_VALUES;

	return {
		gatherPersonalityStatistics: function() {
		},
		gatherGeneralKnowledgeStatistics: function() {
		},
		gatherIQStatistics: function() {
		},
		updateRemainingQuestionsAndTrials: function() {
			var currentDate = new Date().toISOString(),
				options = {
					w:1,
					many: true
				};
			genericConstants.MONGO_MEMBER_FILTER['membership.membershipExpirationDate'].$gte = currentDate;
			userCollection.updateMany(genericConstants.MONGO_MEMBER_FILTER, 
				genericConstants.MONGO_UPDATE_DAILY_REMAINING_FOR_MEMBERS_QUERY, options);
			genericConstants.MONGO_NON_MEMBER_FILTER['membership.membershipExpirationDate'].$lte = currentDate;
			userCollection.updateMany(genericConstants.MONGO_NON_MEMBER_FILTER, 
				genericConstants.MONGO_UPDATE_DAILY_REMAINING_FOR_NON_MEMBERS_QUERY, options);
			
		},
		setUserBasicInfo: function(userId, profile) {
		  genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
		  genericConstants.MONGO_SET_USER_PROFILE_QUERY.$set.username = profile.username;
		  genericConstants.MONGO_SET_USER_PROFILE_QUERY.$set.birthdate = profile.birthdate;
		  genericConstants.MONGO_SET_USER_PROFILE_QUERY.$set.gender = profile.gender;

		  return userCollection.findAndModify(
		  	genericConstants.MONGO_BY_ID_FILTER, [['email', 1]], genericConstants.MONGO_SET_USER_PROFILE_QUERY, {new: true});
		},
		updateLastLogin: function(username) {
			genericConstants.MONGO_BY_USERNAME_FILTER.username = username;
			genericConstants.MONGO_UPDATE_LAST_lOGIN_QUERY.$set.lastLoginDate = new Date().toISOString();
			return userCollection.updateOne(genericConstants.MONGO_BY_USERNAME_FILTER, genericConstants.MONGO_UPDATE_LAST_lOGIN_QUERY);
		},
		updateUserProfile: function(userId, info) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			if(info.gender != null) {
				genericConstants.MONGO_UPDATE_PROFILE_QUERY.$set.gender = info.gender;
			}
			if(info.birthdate != null) {
				genericConstants.MONGO_UPDATE_PROFILE_QUERY.$set.birthdate = info.birthdate;
			}
			return userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_UPDATE_PROFILE_QUERY);
		},
		updateProfileAnswers: function(userId, updatedPersonality, reducedPersonality, correctIQ, correctGK, intelligence, generalKnowledge) {
				genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
				genericConstants.MONGO_UPDATE_PROFILE_ANSWERS_QUERY.$set['personality.currentPersonalityQuestionID'] = 2;
				genericConstants.MONGO_UPDATE_PROFILE_ANSWERS_QUERY.$set['personality.currentPersonalityRaw'] = updatedPersonality;
				genericConstants.MONGO_UPDATE_PROFILE_ANSWERS_QUERY.$set['personality.currentPersonality'] = reducedPersonality;

			    intelligence.correctEasyIQAnswers += correctIQ?1:0;
				intelligence.totalEasyIQAnswers += 1;
				intelligence.currentIQScore = 
						intelligence.correctEasyIQAnswers/intelligence.totalEasyIQAnswers * 
						(intelligence.totalEasyIQAnswers/(intelligence.totalEasyIQAnswers + constantValues.ACCELERATION_PARAMETER)) * constantValues.EASY_IQ_WEIGHT;
				intelligence.remainingDailyIQQuestions = constantValues.IQ_MAX_QUESTIONS_FOR_NON_MEMBERS;

				generalKnowledge.correctGKAnswers += correctGK?1:0;
				generalKnowledge.totalGKAnswers += 1;
				generalKnowledge.currentGKScore = generalKnowledge.correctGKAnswers/(generalKnowledge.totalGKAnswers+1);
				generalKnowledge.remainingDailyGKQuestions = constantValues.GK_MAX_QUESTIONS_FOR_NON_MEMBERS;

				genericConstants.MONGO_UPDATE_PROFILE_ANSWERS_QUERY.$set.intelligence = intelligence;
				genericConstants.MONGO_UPDATE_PROFILE_ANSWERS_QUERY.$set.generalKnowledge = generalKnowledge;
				genericConstants.MONGO_UPDATE_PROFILE_ANSWERS_QUERY.$set['match.remainingDailyMatchTrials'] = constantValues.MATCH_MAX_TRIALS_FOR_NON_MEMBERS;
				return userCollection.findAndModify(genericConstants.MONGO_BY_ID_FILTER, [['username', 1]], genericConstants.MONGO_UPDATE_PROFILE_ANSWERS_QUERY, {new: true});
		},
		updateMembership: function(userId, expirationISODate) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			genericConstants.MONGO_UPDATE_MEMBERSHIP_QUERY.$set['intelligence.remainingDailyIQQuestions'] = constantValues.IQ_MAX_QUESTIONS_FOR_MEMBERS;
			genericConstants.MONGO_UPDATE_MEMBERSHIP_QUERY.$set['generalKnowledge.remainingDailyGKQuestions'] = constantValues.GK_MAX_QUESTIONS_FOR_MEMBERS;
			genericConstants.MONGO_UPDATE_MEMBERSHIP_QUERY.$set['membership.membershipExpirationDate'] = expirationISODate;
			return userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_UPDATE_MEMBERSHIP_QUERY);
		},
		getIdFromEmail: function(email) {
			genericConstants.MONGO_BY_EMAIL_FILTER.email = email;
			return userCollection.findOne(genericConstants.MONGO_BY_EMAIL_FILTER,
						genericConstants.MONGO_GET_ID_BY_EMAIL_QUERY);
		},
		getEmailFromId: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			return userCollection.findOne(genericConstants.MONGO_BY_ID_FILTER,
						genericConstants.MONGO_GET_EMAIL_BY_ID_QUERY);
		},
		getIqGkScore: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			return userCollection.findOne(genericConstants.IQ_GK_SCORES_QUERY);
		},
		checkProfileCompletionById: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			return userCollection.findOne(genericConstants.MONGO_BY_ID_FILTER, 
				genericConstants.MONGO_CHECK_PROFILE_COMPLETION_QUERY);
		},
		registerUser: function(user, facebook) {
			var userTemplate = genericConstants.USER_DOCUMENT;
			userTemplate.email = user.email;
			userTemplate.password = user.password;
			userTemplate.facebook = facebook;
			return userCollection.insertOne(userTemplate);
		},
		activateAccount: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			return userCollection.updateOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_ACTIVATE_ACCOUNT_QUERY);
		},
		checkEmailExistence: function(email) {
			genericConstants.MONGO_BY_EMAIL_FILTER.email = email;
			return userCollection.findOne(genericConstants.MONGO_BY_EMAIL_FILTER, genericConstants.MONGO_CHECK_EMAIL_EXISTENCE_QUERY);
		},
		checkUsernameExistence: function(username) {
			genericConstants.MONGO_BY_USERNAME_FILTER.username = username;
			return userCollection.findOne(genericConstants.MONGO_BY_USERNAME_FILTER, genericConstants.MONGO_CHECK_USERNAME_EXISTENCE_QUERY);
		},
		getAccountStatus: function(userId) {
			genericConstants.MONGO_BY_ID_FILTER._id = new ObjectId(userId);
			return userCollection.findOne(genericConstants.MONGO_BY_ID_FILTER, genericConstants.MONGO_GET_ACCOUNT_STATUS_QUERY);
		},
		getUserDataByEmail: function(email) {
			genericConstants.MONGO_BY_EMAIL_FILTER.email = email;
			return userCollection.findOne(genericConstants.MONGO_BY_EMAIL_FILTER, genericConstants.MONGO_GET_USER_DATA_BY_EMAIL_QUERY);
		}
	};
};
module.exports = function(constantValues) {
	// to break down into files
	return {
		//http status
		OK : 			200,
		UNAUTHORIZED: 	401,
		FORBIDDEN: 		403,
		INTERNAL_ERROR: 500,
		CONFLICT: 		409,

		LOGIN_URL: 				'/auth/login',
		LOGOUT_URL: 			'/auth/logout',
		REGISTRATION_URL:   	'/auth/register',
		USERNAME_CHECK_URL: 	'/auth/usernameUse',
		EMAIL_CHECK_URL: 		'/auth/emailUse',
		VERIFY_TOKEN_URL: 		'/auth/verifyToken',
		ACTIVATE_ACCOUNT_URL:   '/auth/activateAccount',
		RESEND_EMAIL_URL: 		'/auth/resendEmail',
		SET_PROFILE_URL:        '/auth/setProfile',
		GET_PROFILE_QUESTIONS_URL: '/auth/getProfileQuestions',
		STATISTICS_URL: 		'/auth/statistics',
		GET_HASH_URL: 			'/auth/getHash',
		CHECK_HASH_URL: 		'/auth/checkHash',
		UPDATE_USER_PROFILE_URL:'/auth/updateProfile',

		NEXT_PERSONALITY_QUESTION_URL: 		'/personality/nextQuestion',
		ANSWER_PERSONALITY_QUESTION_URL: 	'/personality/answerQuestion',

		RANDOM_GK_QUESTION_URL: '/gk/randomQuestion',
		ANSWER_GK_QUESTION_URL: '/gk/answerQuestion',

		RANDOM_IQ_QUESTION_URL: '/iq/randomQuestion',
		ANSWER_IQ_QUESTION_URL: '/iq/answerQuestion',

		MONGO_URL: 'mongodb://vradu:1234@ds155718.mlab.com:55718/randomeetdb',

		USER_COLLECTION: 'users',
		PERSONALITY_QUESTIONS_COLLECTION: 'personalityQuestions',
		IQ_QUESTIONS_COLLECTION: 'iqQuestions',
		GK_QUESTIONS_COLLECTIONL: 'gkQuestions',

		USER_DOCUMENT: {
			email: '',
			username: '',
			password: '',
			gender: '',
			birthdate: '',
			accountStatus: 'INACTIVE',
			personality: {
				currentPersonalityQuestionID: 1,
				currentPersonalityRaw: '0.0.0.0',
				currentPersonality: 'ESFJ'
			},
			intelligence: {
				currentIQScore: 90,
				correctEasyIQAnswers: 0,
				totalEasyIQAnswers: 0,
				correctMediumIQAnswers: 0,
				totalMediumIQAnswers: 0,
				correctHardIQAnswers: 0,
				totalHardIQAnswers: 0,
				remainingDailyIQQuestions: 0,
				ongoingIQQuestion: {
					ongoingIQQuestionID: '',
					startedTimestamp: ''
				}
			},
			generalKnowledge: {
				currentGKScore: 0,
				correctGKAnswers: 0,
				totalGKAnswers: 0,
				remainingDailyGKQuestions: 0,
				ongoingGKQuestion: {
					ongoingGKQuestionID: '',
					startedTimestamp: ''
				}
			},
			match: {
				remainingDailyMatchTrials: 0
			},
			membership: {
				membershipExpirationDate: '',
			}
		},

		PERSONALITY_QUESTIONS_DOCUMENT: {
			question: '',
			index: '',
			negativelyAffectedType: ''
		},

		IQ_QUESTIONS_DOCUMENT: {
			questionLink: '',
			difficulty: '',
			answers: [],
			correctAnswerID: ''
		},

		GK_QUESTIONS_DOCUMENT: {
			category: '',
			gkQuestion: '',
			answers: [],
			correctAnswerID: ''
		},

		MONGO_BY_ID_FILTER: {
			_id: null
		},
		MONGO_BY_EMAIL_FILTER: {
			email: null
		},
		MONGO_MEMBER_FILTER: {
			'membership.membershipExpirationDate': {
				$gte: null
			}
		},
		MONGO_NON_MEMBER_FILTER: {
			'membership.membershipExpirationDate': {
				$lte: null
			}
		},
		MONGO_BY_USERNAME_FILTER: {
			username: null
		},
		MONGO_TIMED_OUT_IQ_QUESTIONS_FILTER: {
			'intelligence.ongoingIQQuestion.ongoingIQQuestionID': {
				$ne: null
			},
			'intelligence.ongoingIQQuestion.startedTimestamp': {
				$lte: null
			}
		},
		MONGO_TIMED_OUT_GK_QUESTIONS_FILTER: {
			'generalKnowledge.ongoingGKQuestion.ongoingGKQuestionID': {
				$ne: null
			},
			'generalKnowledge.ongoingGKQuestion.startedTimestamp': {
				$lte: null
			}
		},
		MONGO_UPDATE_PROFILE_QUERY: {
			$set: {
			}	
		},
		MONGO_SET_USER_PROFILE_QUERY: {
			$set: {
				username: null,
				birthdate: null,
				gender: null
			}
		},
		MONGO_GET_ID_BY_EMAIL_QUERY: {
			_id: 1
		},
		MONGO_GET_EMAIL_BY_ID_QUERY: {
			email: 1
		},
		MONGO_CHECK_PROFILE_COMPLETION_QUERY: {
			username: 1
		},
		MONGO_ACTIVATE_ACCOUNT_QUERY: {
			$set: {
				accountStatus: 'ACTIVE'
			}
		},
		MONGO_UPDATE_LAST_lOGIN_QUERY: {
			$set: {
				lastLoginDate: null
			}
		},
		MONGO_GET_ACCOUNT_STATUS_QUERY: {
			accountStatus: 1
		},
		MONGO_CHECK_EMAIL_EXISTENCE_QUERY: {
			email: 1
		},
		MONGO_UPDATE_PROFILE_ANSWERS_QUERY: {
			$set: {
				'personality.currentPersonalityQuestionID': null,
				'personality.currentPersonalityRaw': null,
				'personality.currentPersonality': null,
				'intelligence': null,
				'generalKnowledge': null,
				'match.remainingDailyMatchTrials': null
			}
		},
		MONGO_CHECK_USERNAME_EXISTENCE_QUERY: {
			username: 1
		},
		MONGO_IQ_GK_SCORES_QUERY: {
			'intelligence.currentIQScore': 1,
			'generalKnowledge.currentGKScore': 1
		},
		MONGO_GET_USER_DATA_BY_EMAIL_QUERY: {
			_id: 1,
			username: 1,
			email: 1,
			password: 1,
			gender: 1,
			birthdate: 1,
			accountStatus: 1,
			'intelligence.remainingDailyIQQuestions': 1,
			'generalKnowledge.remainingDailyGKQuestions': 1,
			'intelligence.currentIQScore': 1,
			'generalKnowledge.currentGKScore': 1,
			'personality.currentPersonality': 1,
			'personality.currentPersonalityRaw': 1,
			'membership.membershipExpirationDate': 1,
			'match.remainingDailyMatchTrials': 1,
			'facebook': 1
		},
		MONGO_GET_NEXT_PERSONALITY_QUESTION_QUERY: [{
			$match: ''
		},{
		   $lookup: {
		       from: 'personalityQuestions',
		       localField: 'personality.currentPersonalityQuestionID',
		       foreignField: 'index',
		       as: 'personalityQuestion'
		   }
		},{
			$project: {
				personalityQuestion: 1
			}
		}],
		MONGO_UPDATE_NEXT_QUESTION_AND_PERSONALITY_QUERY: {
			$inc: { 
				'personality.currentPersonalityQuestionID' : 1 
			},
			$set: {
				'personality.currentPersonalityRaw': null,
				'personality.currentPersonality': null
			}
		},
		MONGO_GET_CURRENT_PERSONALITY_RAW_QUERY: {
			'personality.currentPersonalityRaw': 1
		},
		MONGO_SELECT_RANDOM_QUERY: {
			$sample: { 
				size: 1 
			} 
		},
		MONGO_SELECT_RANDOM_IQ_QUERY: [{
			$match: {
				difficulty: null
			}
		},{
			$sample: { 
				size: 1 
			} 
		}],
		MONGO_GET_IQ_QUESTION_FOR_USER_QUERY: [{
			$match: ''
		},{
		   $lookup:{
		       from: 'iqQuestions',
		       localField: 'intelligence.ongoingIQQuestion.ongoingIQQuestionID',
		       foreignField: '_id',
		       as: 'iqQuestion'
		     }
		},{
			$project: {
				'intelligence.ongoingIQQuestion': 1,
				'iqQuestion': 1
			}
		}],
		MONGO_GET_REMAINING_DAILY_IQ_QUESTIONS_QUERY: {
			'intelligence.remainingDailyIQQuestions': 1
		},
		MONGO_IQ_FIELDS: {
			questionLink: 1,
			difficulty: 1,
			answers: 1,
			correctAnswerID: 1
		},
		MONGO_UPDATE_DAILY_REMAINING_FOR_MEMBERS_QUERY: {
			$set: {
				'intelligence.remainingDailyIQQuestions': constantValues.IQ_MAX_QUESTIONS_FOR_MEMBERS,
				'generalKnowledge.remainingDailyGKQuestions': constantValues.GK_MAX_QUESTIONS_FOR_MEMBERS
			}
		},
		MONGO_UPDATE_DAILY_REMAINING_FOR_NON_MEMBERS_QUERY: {
			$set: {
				'intelligence.remainingDailyIQQuestions': constantValues.IQ_MAX_QUESTIONS_FOR_NON_MEMBERS,
				'generalKnowledge.remainingDailyGKQuestions': constantValues.GK_MAX_QUESTIONS_FOR_NON_MEMBERS,
				'match.remainingDailyMatchTrials': constantValues.MATCH_MAX_TRIALS_FOR_NON_MEMBERS
			}
		},
		MONGO_SET_OR_REMOVE_IQ_TIMEOUT_QUERY: {
			$set: {
				'intelligence.ongoingIQQuestion.ongoingIQQuestionID': null,
				'intelligence.ongoingIQQuestion.startedTimestamp': null
			}
		},
		MONGO_IQ_TIMEOUT_FIELDS: {
			'intelligence.ongoingIQQuestion.startedTimestamp': 1
		},
		MONGO_GK_TIMEOUT_FIELDS: {
			'generalKnowledge.ongoingGKQuestion.startedTimestamp': 1
		},
		MONGO_UPDATE_IQ_TIMEOUT_QUERY: {
			$set: {
				'intelligence.ongoingIQQuestion.startedTimestamp': null
			}
		},
		MONGO_UPDATE_GK_TIMEOUT_QUERY: {
			$set: {
				'generalKnowledge.ongoingGKQuestion.startedTimestamp': null
			}
		},
		MONGO_INTELLIGENCE_QUERY: {
			intelligence: 1
		},
		MONGO_INTELLIGENCE_UPDATE_QUERY: {
			$set: {
				intelligence: null
			}
		},
		MONGO_GET_GK_QUESTION_FOR_USER_QUERY: [{
			$match: ''
		},{
		   $lookup:{
		       from: 'gkQuestions',
		       localField: 'generalKnowledge.ongoingGKQuestion.ongoingGKQuestionID',
		       foreignField: '_id',
		       as: 'gkQuestion'
		     }
		},{
			$project: {
				'generalKnowledge.ongoingGKQuestion': 1,
				'gkQuestion': 1
			}
		}],
		MONGO_GET_REMAINING_DAILY_GK_QUESTIONS_QUERY: {
			'generalKnowledge.remainingDailyGKQuestions': 1
		},
		MONGO_SET_OR_REMOVE_GK_TIMEOUT_QUERY: {
			$set: {
				'generalKnowledge.ongoingGKQuestion.ongoingGKQuestionID': null,
				'generalKnowledge.ongoingGKQuestion.startedTimestamp': null
			}
		},
		MONGO_GENERAL_KNOWLEDGE_QUERY: {
			generalKnowledge: 1
		},
		MONGO_GENERAL_KNOWLEDGE_UPDATE_QUERY: {
			$set: {
				generalKnowledge: null
			}
		},
		MONGO_UPDATE_MEMBERSHIP_QUERY: {
			$set: {
				'intelligence.remainingDailyIQQuestions': null,
				'generalKnowledge.remainingDailyGKQuestions': null,
				'match.remainingDailyMatchTrials': -1,
				'membership.membershipExpirationDate': null
			}
		},

		GET_VALUES: constantValues,
		TOKEN_HEADER: 'x-auth-token',
		TOKEN_OPTIONS: { /*
			algorithm: 'RS256', */
			expiresIn: null 
		},
		SUBSCRIPTION_TYPE: {
			'MONTH': 1,
			'TWO_MONTHS': 2,
			'SIX_MONTHS': 6,
			'YEAR': 12
		},

		INVALID_TOKEN: new Error('INVALID_TOKEN'),
		UNKNOWN_USER: new Error('UNKNOWN_USER'),
		INCOMPLETE_DATA: new Error('INCOMPLETE_DATA'),
		BAD_DATA: new Error('BAD_DATA'),
		NO_MORE_GK_QUESTIONS: new Error('NO_MORE_GK_QUESTIONS'),
		NO_MORE_IQ_QUESTIONS: new Error('NO_MORE_IQ_QUESTIONS'),
		NO_MORE_MATCHES: new Error('NO_MORE_MATCHES'),

		//crypto
		CRYPTO_ALGORITHM: 'aes-256-ctr',
		CRYPTO_SECRET: 'd6F3Efeq',

		CRON_8_AM: '0 8 * * *'
	};

};
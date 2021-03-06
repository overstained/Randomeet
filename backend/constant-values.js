module.exports = function() {
	return {
		IQ_MAX_QUESTIONS_FOR_NON_MEMBERS: 10,
		GK_MAX_QUESTIONS_FOR_NON_MEMBERS: 10,
		MATCH_MAX_TRIALS_FOR_NON_MEMBERS: 20,
		IQ_MAX_QUESTIONS_FOR_MEMBERS: 50,
		GK_MAX_QUESTIONS_FOR_MEMBERS: 50,
		FREE_IQ_WEIGHT: 50,
		ACCELERATION_PARAMETER: 10,
		EASY_IQ_WEIGHT: 110,
		MEDIUM_IQ_WEIGHT: 35,
		HARD_IQ_WEIGHT: 25,

		IQ_TIME_LIMIT_EASY: 60000,
		IQ_TIME_LIMIT_MEDIUM: 100000,
		IQ_TIME_LIMIT_HARD: 140000,
		IQ_PROBABILITY_SPLIT: [0.70, 0.90],

		GK_TIME_LIMIT: 10000,
		MAX_GK_SCORE: 170,

		PERSONALITY_QUESTIONS_COUNT: 19,

		DETLA_UPDATE_TIME_BOUND: 60000,

		SECONDS_IN_A_DAY: 86400,
		SECONDS_IN_6_HOURS: 21600,
		MILLISECONDS_IN_SECOND: 1000
	};
};
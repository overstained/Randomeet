angular.module('loginModule').constant('personalityConstant', {
	NEXT_PERSONALITY_QUESTION_URL: 		'/personality/nextQuestion',
	ANSWER_PERSONALITY_QUESTION_URL: 	'/personality/answerQuestion',
	BEST_MATCH: {
		INFP: ['ENFJ', 'ENFJ'],
		ENFP: ['INFJ', 'INTJ'],
		INFJ: ['ENFP', 'ENTP'],
		ENFJ: ['INFP', 'ISFP'],
		INTJ: ['ENFP', 'ENTP'],
		ENTJ: ['INFP', 'INTP'],
		INTP: ['ENTJ', 'ESTJ'],
		ENTP: ['INFJ', 'INTJ'],
		ISFP: ['ENFJ', 'ESTJ'],
		ESFP: ['ISFJ', 'ISTJ'],
		ESTP: ['ISFJ', 'ISTJ'],
		ISFJ: ['ESFP', 'ESTP'],
		ESFJ: ['ISFP', 'ISTP'],
		ISTJ: ['ESFP', 'ESTP'],
		ESTJ: ['INTP', 'ISTP']
	},
	PERSONALITY_QUESTION_COUNT: 19
});
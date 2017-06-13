angular.module('loginModule').service('gkService', ['$http','gkConstant', 'genericConstant', '$localStorage',
 function ( $http, gkConstants, genericConstants, $localStorage) {
 	return {
 		getRandomQuestion: function(user) {
	 		return $http.post(genericConstants.BASE_URL + gkConstants.RANDOM_GK_QUESTION_URL, {
	 			reqtimestamp: Date.now()
	 		},{
	 			headers: {
	 				'x-auth-token': $localStorage.token
	 			}
	 		});
	 	},
	 	answerQuestion: function(answerId) {
	 		return $http.post(genericConstants.BASE_URL + gkConstants.ANSWER_GK_QUESTION_URL, {
	 			answerId: answerId,
	 			reqtimestamp: Date.now()
	 		},{
	 			headers: {
	 				'x-auth-token': $localStorage.token
	 			}
	 		});
	 	}
	};
}]);
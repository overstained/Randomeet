angular.module('loginModule').service('personalityService', ['$http','personalityConstant', 'genericConstant', '$localStorage',
 function ( $http, personalityConstant, genericConstant, $localStorage) {
 	return {
 		getNextQuestion: function() {
	 		return $http.get(genericConstant.BASE_URL + personalityConstant.NEXT_PERSONALITY_QUESTION_URL, {
	 			headers: {
	 				'X-Auth-Token': $localStorage.token
	 			}
	 		});
	 	},
	 	answerQuestion: function(answer) {
	 		return $http.post(genericConstant.BASE_URL + personalityConstant.ANSWER_PERSONALITY_QUESTION_URL, answer, {
	 			headers: {
	 				'X-Auth-Token': $localStorage.token
	 			}
	 		});
	 	},
		formatPersonality: function(splitPersonality) {
			return {
					type1: {
						label: parseInt(splitPersonality.t1)<0?'I':'E',
						percentage: parseInt(splitPersonality.t1)
					},
					type2: {
						label: parseInt(splitPersonality.t2)<0?'N':'S',
						percentage: parseInt(splitPersonality.t2)
					},
					type3: {
						label: parseInt(splitPersonality.t3)<0?'T':'F',
						percentage: parseInt(splitPersonality.t3)
					},
					type4: {
						label: parseInt(splitPersonality.t4)<0?'P':'J',
						percentage: parseInt(splitPersonality.t4)
					}
			};
		},
		reducePersonality: function(formattedPersonality) {
			return formattedPersonality.type1.label +
				   formattedPersonality.type2.label	+
				   formattedPersonality.type3.label +      
				   formattedPersonality.type4.label;
		}
	};
}]);
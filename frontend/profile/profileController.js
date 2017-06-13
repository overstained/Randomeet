angular.module('loginModule').controller('profileController', ['$scope', '$state', 'loginService', 'tokenService', '$localStorage', '$stateParams', 
	'$rootScope', 'WizardHandler', '$timeout', '$interval', '$mdDialog', '$sce', 'personalityConstant',
function($scope, $state, loginService, tokenService, $localStorage, $stateParams, $rootScope, 
	WizardHandler, $timeout, $interval, $mdDialog, $sce, personalityConstant) {

	if($stateParams.userHash) {
		 loginService
		.checkHash($stateParams.userHash)
		.then(function() {
		}, function(err) {
			$state.go('authentication');
		});
	} else {
		$state.go('authentication');
	}

	if($localStorage.profileQuestions) {
		$scope.personalityQuestion = $localStorage.profileQuestions.personalityQuestion[0];
		$scope.iqQuestion = $localStorage.profileQuestions.iqQuestion;
		$scope.gkQuestion = $localStorage.profileQuestions.gkQuestion;
		console.log($scope.personalityQuestion);
	} else {
		loginService
		.getProfileQuestions($stateParams.userHash)
		.then(function(obj) {
			$localStorage.profileQuestions = obj.data;
			$scope.personalityQuestion = obj.data.personalityQuestion;
			$scope.iqQuestion = obj.data.iqQuestion;
			$scope.gkQuestion = obj.data.gkQuestion;
		}, function(err) {
			console.log(err);
		});
	}
	$scope.bestPersonalityMatch = personalityConstant.BEST_MATCH['ESFJ'];

  	var dateNow = new Date();

	$scope.user = {
		gender: 0,
		username: '',
		birthdate: new Date(
			dateNow.getFullYear() - 15,
			dateNow.getMonth(),
			dateNow.getDate())
	};

	$scope.labels = ['INTP', 'INTJ', 'INFP', 'INFJ','ISTP', 'ISTJ', 'ISFJ', 'ISFP',
					 'ENTP', 'ENTJ', 'ENFP', 'ENFJ','ESTP', 'ESTJ', 'ESFJ', 'ESFP',];
	$scope.data = [4, 4, 8, 5, 5, 9, 6, 9, 5, 5, 8, 5, 5, 8, 5, 9];

	$scope.minDate = new Date(
		dateNow.getFullYear() - 150,
		dateNow.getMonth(),
		dateNow.getDate());

	$scope.maxDate = dateNow;

  	$scope.slider = {
  		value: 50
  	};

  	$scope.answerText = 'Neutral';

  	$scope.bestPersonalityMatch = [];

  	$scope.setAnswerText = function() {
		switch($scope.slider.value) {
			case 0:
				$scope.answerText = 'Completely disagree';
			break;
			case 25:
				$scope.answerText = 'Disagree';
			break;
			case 50:
				$scope.answerText = 'Neutral';
			break;
			case 75:
				$scope.answerText = 'Agree';
			break;
			case 100:
				$scope.answerText = 'Completely agree';
			break;
		}
	};

	$scope.previousPage = function() {
		$rootScope.previousState.pageIndex = 0;
		$rootScope.dialog = $rootScope.previousState;
		delete $rootScope.previousState;
	};


	$scope.showPersonalityDialog = function(e) {
		delete $rootScope.previousState;
		$rootScope.dialog = {
			stateLabel: 'Personality',
			state: 'PERSONALITY',
			tabIndex: 1,
			pageIndex: 0
		};
		$mdDialog.show({
		  controller: 'profileController',
		  templateUrl: '/profile/templates/dialog/dialog.html',
		  parent: angular.element(document.body),
		  targetEvent: e,
		  clickOutsideToClose:true
		});
	};

	$scope.showPersonalityDetails = function() {
		$rootScope.previousState = $rootScope.dialog;
		$rootScope.dialog.pageIndex = 1;
		$rootScope.dialog.stateLabel = 'Personality info';
	};

	$scope.showLogicDialog = function(e) {
		delete $rootScope.previousState;
		$rootScope.dialog = {
			stateLabel: 'Logic',
			state: 'LOGIC',
			tabIndex: 2,
			pageIndex: 0
		};
		$mdDialog.show({
			controller: 'profileController',
			templateUrl: '/profile/templates/dialog/dialog.html',
			parent: angular.element(document.body),
			targetEvent: e,
			onComplete: function() {
				drawGauss(35, 8, $('#iqGaussCanvas'), $('#iqGaussWrapper'), "#dd3f20", true);
			},
			clickOutsideToClose:true
		});
  	};

  	$scope.showLogicDetails = function() {
		$rootScope.previousState = $rootScope.dialog;
		$rootScope.dialog.pageIndex = 1;
		$rootScope.dialog.stateLabel = 'Logic info';
	};

  	$scope.getDifficultyElement = function(difficulty) {
  		switch(difficulty) {
  			case 0:
  				return $sce.trustAsHtml('<span style="color:green !important;">Easy</span>');
  			case 1:
  				return $sce.trustAsHtml('<span style="color:yellow !important;">Medium</span>');
			case 2:
  				return $sce.trustAsHtml('<span style="color:red !important;">Hard</span>');
  		}
  	};

	$scope.showGeneralKnowledgeDialog = function(e) {
		delete $rootScope.previousState;
		$scope.gkQuestion.answerId = 0;
		$rootScope.dialog = {
			stateLabel: 'General knowledge',
			state: 'GENERAL_KNOWLEDGE',
			tabIndex: 3,
			pageIndex: 0
		};
		$mdDialog.show({
		  controller: 'profileController',
		  templateUrl: '/profile/templates/dialog/dialog.html',
		  parent: angular.element(document.body),
		  targetEvent: e,
		  onComplete: function() {
				drawGauss(35, 8, $('#gkGaussCanvas'), $('#gkGaussWrapper'), "#ffe57f", false);
		  },
		  clickOutsideToClose:true
		});
	};

	$scope.showGeneralKnowledgeDetails = function() {
		$rootScope.previousState = $rootScope.dialog;
		$rootScope.dialog.pageIndex = 1;
		$rootScope.dialog.stateLabel = 'General knowledge info';
	};

  	$scope.setBasicProfileInfo = function(profileForm) {
		profileForm.username.$setValidity('usernameInUse', true);
		if(profileForm.$invalid) {
			return;
		}

		$rootScope.user = $scope.user;

		 loginService
		.checkUsername($rootScope.user.username)
		.then(function() {
			WizardHandler.wizard().next();
		}, function(err) {
			profileForm.username.$setValidity('usernameInUse', false);
		});
	};

	$scope.setPersonalityAnswer = function() {
		$rootScope.personalityQuestion = $scope.personalityQuestion;
		$rootScope.personalityQuestion.answer = $scope.slider.value/25;
		WizardHandler.wizard().next();
		$mdDialog.hide();
	};


	$scope.setIQAnswer = function(answerId) {
		$scope.iqQuestion.answerId = answerId;
		$rootScope.iqQuestion = $scope.iqQuestion;
		WizardHandler.wizard().next();
		$mdDialog.hide();
	};

	$scope.setGkAnswer = function() {
		if($scope.gkQuestion.answerId != null &&
		   $rootScope.iqQuestion.answerId != null &&
		   $rootScope.personalityQuestion.answer != null) {
		   	loginService
		   .setProfile({
		   		hash: $stateParams.userHash,
		   		basicInfo: {
		   			username: $rootScope.user.username,
   					gender: $rootScope.user.gender,
   					birthdate: $rootScope.user.birthdate
		   		},
		   		personalityAnswer: {
		   			answer: $rootScope.personalityQuestion.answer,
		   			negativelyAffectedType: $rootScope.personalityQuestion.negativelyAffectedType
		   		},
		   		iqAnswer: {
		   			answer: $rootScope.iqQuestion.answerId,
		   			questionId: $rootScope.iqQuestion._id
		   		},
		   		gkAnswer: {
		   			answer: $scope.gkQuestion.answerId,
		   			questionId: $scope.gkQuestion._id
		   		}
		   })
		   .then(function(data) {
				if(data.headers('x-auth-token')) {
					delete $localStorage.profileQuestions;
					$mdDialog.hide();
			   		$timeout(function() {
			   			$state.go('chat');
			   		}, 2000);
				}
		   }, function(err) {
		   	console.log(err);
		   });
		}
	};


	var drawGauss = function(mean, deviation, canvas, wrapper, color, isIq) {
		var a = 100,
			ctx = canvas[0].getContext("2d");

			canvas[0].width = wrapper.width();
			canvas[0].height = wrapper.height();
			ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
			ctx.font = "10px Arial";

			var rectWidth = canvas[0].width/70;
			var shiftBy= canvas[0].height/4;
			
			for (var j=0; j< 150; j++){
				var y = a/Math.pow(Math.E, (Math.pow(j-mean, 2))/(2*deviation*deviation));

				if(j < 36){
					ctx.fillStyle = color;
				} else {
					ctx.fillStyle = "white";
				}
				ctx.beginPath();
				ctx.rect(j*rectWidth, shiftBy + canvas[0].height/2-y, rectWidth, y);
				ctx.closePath();
				ctx.fill();
				ctx.lineWidth = 1;
				ctx.strokeStyle = "black";
				ctx.stroke();
			}
			ctx.fillStyle = "black";
			for(var j=canvas[0].width/8;j<canvas[0].width;j+=canvas[0].width/8) {
				ctx.moveTo(j,canvas[0].height/2);
				ctx.arc(j, shiftBy + canvas[0].height/2, 2, 0, 2 * Math.PI, false);
				if(isIq) {
					ctx.fillText(((j*8)/canvas[0].width)*25, j, shiftBy + canvas[0].height/2 + 20);
				} else {
					ctx.fillText(Math.round(((j*8)/(canvas[0].width*170))*25*10)/10, j, shiftBy + canvas[0].height/2 + 20);
				}
			}
			/*ctx.moveTo(300,0);
			ctx.lineTo(300,cv.height/2+50);
			
			ctx.moveTo(310,50);
			ctx.font = "15px Arial";
			ctx.fillText("You: 120", 310, 20);
		    ctx.stroke();*/
	};

	
}]); 
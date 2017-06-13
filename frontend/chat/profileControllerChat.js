angular.module('chatModule').controller('profileControllerChat', ['$scope', '$http', '$state', 'tokenService', 
	'$rootScope', 'personalityService', '$mdDialog', 'personalityConstant', 'iqService', '$sce', '$interval',
  'loginService', 'gkService', function($scope, $http, $state, tokenService, $rootScope, personalityService, $mdDialog,
  	personalityConstant, iqService, $sce, $interval, loginService, gkService) {

	$scope.bestPersonalityMatch = personalityConstant.BEST_MATCH[$rootScope.localUser.pr];
	$scope.answerText = 'Neutral';
	$scope.showPersonalityQuestion = false;
	$scope.showLogicQuestion = false;
	$scope.showGeneralKnowledgeQuestion = false;
	$scope.basicInfoUpdate = {
		birthdate: new Date(Date.parse($rootScope.localUser.bd)),
		gender: $rootScope.localUser.g
	};


	$scope.labels = ['INTP', 'INTJ', 'INFP', 'INFJ','ISTP', 'ISTJ', 'ISFJ', 'ISFP',
					 'ENTP', 'ENTJ', 'ENFP', 'ENFJ','ESTP', 'ESTJ', 'ESFJ', 'ESFP'];
	$scope.data = [4, 4, 8, 5, 5, 9, 6, 9, 5, 5, 8, 5, 5, 8, 5, 9];

	$scope.slider = {
		value: 50
	};

	$scope.formatIQ = function(iq) {
		return Math.round(iq);
	};

	$scope.formatGKQ = function(gkq) {
		return Math.round(gkq);
	};

	$scope.formatBirthdate = function(date) {
		return moment(date).format('DD/MM/YYYY');
	};

	$scope.formatGender = function(gender) {
		return gender === 0 ? 'Male': 'Female';
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
  };


  $scope.getNextPersonalityQuestion = function(showQuestion) {
    var personalityQuestion = null;
    if(tokenService.getStorageForUser($rootScope.localUser.ky)) {
       personalityQuestion = tokenService.getByKeyForUser($rootScope.localUser.ky, 'personalityQuestion');
    }
    if(personalityQuestion) {
      $scope.personalityQuestion = personalityQuestion;
      if(showQuestion) {
        $scope.showPersonalityQuestion = true;
      }
      $scope.personalityQuestionsRemaining = personalityConstant.PERSONALITY_QUESTION_COUNT - $scope.personalityQuestion.index + 1;
    } else {
       personalityService
      .getNextQuestion()
      .then(function(obj) {
        tokenService.storeForUser($rootScope.localUser.ky, 'personalityQuestion', obj.data);
        $scope.personalityQuestion = obj.data;
        $scope.personalityQuestionsRemaining = personalityConstant.PERSONALITY_QUESTION_COUNT - $scope.personalityQuestion.index;
        if(showQuestion) {
          $scope.showPersonalityQuestion = true;
        }
      }, function(err) {
        console.log(err);
      });
    }
    
  };


  $scope.previousPage = function() {
    $rootScope.previousState.pageIndex = 0;
    $rootScope.dialog = $rootScope.previousState;
    delete $rootScope.previousState;
  };

  $scope.changePasswordPage = function() {
    $rootScope.previousState = $rootScope.dialog;
    $rootScope.dialog.pageIndex = 1;
    $rootScope.dialog.stateLabel = 'Change password';
  };

  $scope.shouldSaveBasicInfo = function() {
    $scope.basicInfoSaveNeeded = false;
    if($scope.basicInfoUpdate.gender != null) {
      if($rootScope.localUser.g !== $scope.basicInfoUpdate.gender) {
        $scope.basicInfoSaveNeeded = true;
      }
    }
    if($scope.basicInfoUpdate.birthdate != null) {
      if(Date.parse($rootScope.localUser.bd) != Date.parse($scope.basicInfoUpdate.birthdate)) {
        $scope.basicInfoSaveNeeded = true;
      }
    }
  };

  $scope.updateProfile = function() {
    if($scope.basicInfoSaveNeeded) {
      loginService
      .updateProfile($scope.basicInfoUpdate)
      .then(function() {

      }, function(err) {
        console.log(err);
      });
    }
  };

  $scope.openedBasicInfoTab = function() {
    delete $rootScope.previousState;
    $rootScope.dialog = {
      stateLabel: 'Basic profile',
      state: 'BASIC_PROFILE',
      tabIndex: 0,
      pageIndex: 0
    };
    $scope.basicInfoUpdate = {
      birthdate: new Date(Date.parse($rootScope.localUser.bd)),
      gender: $rootScope.localUser.g
    };
    $scope.basicInfoSaveNeeded = false;
  };

  $scope.openedPersonalityTab = function() {
    delete $rootScope.previousState;
    $rootScope.dialog = {
      stateLabel: 'Personality',
      state: 'PERSONALITY',
      tabIndex: 0,
      pageIndex: 0
    };
  };

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

  $scope.answerPersonalityQuestion = function() {
      personalityService.answerQuestion({
        answer: $scope.slider.value/25,
        negativelyAffectedType: $scope.personalityQuestion.negativelyAffectedType
      }).then(function(data) {
        $scope.bestPersonalityMatch = personalityConstant.BEST_MATCH[$rootScope.localUser.pr];
        tokenService.deleteByKeyForUser($rootScope.localUser.ky, 'personalityQuestion');
        $scope.slider.value = 50;
        $scope.showPersonalityQuestion = false;
      }, function(err) {
        console.log(err);
      });
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

  var setIQTimer = function(expirationTimestamp) {
      if($scope.IQIntervalPromise) {
        $interval.cancel($scope.IQIntervalPromise);
        console.log('canceled');
      }
      $scope.IQtimeElapsedPercent = 0;
      var period = 100;
      var timeElapsed = 0;
      var maxIQTime = (expirationTimestamp - Date.now());
      $scope.IQIntervalPromise = $interval(function(){
        $scope.IQtimeElapsedPercent += (100*period)/maxIQTime;
        timeElapsed += period;
        if(timeElapsed >= maxIQTime) {
         $scope.answerLogicQuestion();
         $interval.cancel($scope.IQIntervalPromise);
        }
      }, period);
  };

  $scope.openedLogicTab = function() {
    delete $rootScope.previousState;
    $rootScope.dialog = {
      stateLabel: 'Logic',
      state: 'LOGIC',
      tabIndex: 0,
      pageIndex: 0
    };
    drawGauss(35, 8, $('#iqGaussCanvas'), $('#iqGaussWrapper'), "#dd3f20", true);
    if(!$scope.iqQuestion) {
      var iqQuestion = null;
      if(tokenService.getStorageForUser($rootScope.localUser.ky)) {
         iqQuestion = tokenService.getByKeyForUser($rootScope.localUser.ky, 'iqQuestion');
      }
      if(iqQuestion && Date.now() - iqQuestion.expirationTimestamp < 0) {
        $scope.iqQuestion = iqQuestion;
        $scope.showLogicQuestion = true;
        setIQTimer(iqQuestion.expirationTimestamp);
      } else {
        $scope.showLogicQuestion = false;
      }
    } 
  };

  $scope.getNextLogicQuestion = function() {
       iqService
      .getRandomQuestion()
      .then(function(obj) {
        var iqQuestion = obj.data;
        if(iqQuestion) {
          $scope.iqQuestion = iqQuestion;
          tokenService.storeForUser($rootScope.localUser.ky, 'iqQuestion', iqQuestion);
          $scope.showLogicQuestion = true;
          if(iqQuestion.expirationTimestamp) {
            setIQTimer(iqQuestion.expirationTimestamp);
          }
        }
      }, function(err) {
        console.log(err);
      });
  };

  $scope.answerLogicQuestion = function(answerId) {
   if($scope.IQIntervalPromise) {
      $interval.cancel($scope.IQIntervalPromise);
    }
    iqService
    .answerQuestion(answerId)
    .then(function() {
      $scope.iqQuestion = null;
      $scope.showLogicQuestion = false;
      tokenService.deleteByKeyForUser($rootScope.localUser.ky, 'iqQuestion');
    }, function(err) {
    });
  };

  var setGKTimer = function(expirationTimestamp) {
      if($scope.GKIntervalPromise) {
        $interval.cancel($scope.GKIntervalPromise);
      }
      $scope.GKtimeElapsedPercent = 0;
      var period = 100;
      var timeElapsed = 0;
      var maxGKTime = (expirationTimestamp - Date.now());
      $scope.GKIntervalPromise = $interval(function(){
        $scope.GKtimeElapsedPercent += (100*period)/maxGKTime;
        timeElapsed += period;
        if(timeElapsed >= maxGKTime) {
         $scope.answerGeneralKnowledgeQuestion();
         $interval.cancel($scope.GKIntervalPromise);
        }
      }, period);
  };

  $scope.openedGeneralKnowledgeTab = function() {
    delete $rootScope.previousState;
    $rootScope.dialog = {
      stateLabel: 'General knowledge',
      state: 'GENERAL_KNOWLEDGE',
      tabIndex: 0,
      pageIndex: 0
    };
    drawGauss(35, 8, $('#gkGaussCanvas'), $('#gkGaussWrapper'), "#ffe57f", false);
    if(!$scope.gkQuestion) {
      var gkQuestion = null;
      if(tokenService.getStorageForUser($rootScope.localUser.ky)) {
         gkQuestion = tokenService.getByKeyForUser($rootScope.localUser.ky, 'gkQuestion');
      }
      if(gkQuestion && Date.now() - gkQuestion.expirationTimestamp < 0) {
        $scope.gkQuestion = gkQuestion;
        $scope.gkQuestion.answerId = 0;
        $scope.showGeneralKnowledgeQuestion = true;
        setGKTimer(gkQuestion.expirationTimestamp);
      } else {
        $scope.showGeneralKnowledgeQuestion = false;
      }
    } 
  };

  $scope.getNextGeneralKnowledgeQuestion = function() {
    gkService
    .getRandomQuestion()
    .then(function(obj) {
      var gkQuestion = obj.data;
      if(gkQuestion) {
        $scope.gkQuestion = gkQuestion;
        $scope.gkQuestion.answerId = 0;
        tokenService.storeForUser($rootScope.localUser.ky, 'gkQuestion', gkQuestion);
        $scope.showGeneralKnowledgeQuestion = true;
        if(gkQuestion.expirationTimestamp) {
          setGKTimer(gkQuestion.expirationTimestamp);
        }
      }
    }, function(err) {
      console.log(err);
    });
  };

  $scope.answerGeneralKnowledgeQuestion = function() {
    if($scope.GKIntervalPromise) {
      $interval.cancel($scope.GKIntervalPromise);
    }

    gkService
    .answerQuestion($scope.gkQuestion.answerId)
    .then(function() {
      $scope.gkQuestion = null;
      $scope.showGeneralKnowledgeQuestion = false;
      tokenService.deleteByKeyForUser($rootScope.localUser.ky, 'gkQuestion');
    }, function(err) {
    });
  };



  }]);
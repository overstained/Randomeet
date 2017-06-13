angular.module('loginModule').controller('loginController', ['$scope', '$state', 'loginService', 'tokenService', '$rootScope', '$window', 'facebookService',
function($scope, $state, loginService, tokenService, $rootScope, $window, facebookService) {
	if(tokenService.checkToken()) {
		$state.go('chat');
	}

	$scope.facebookLoginDisabled = true;

	$scope.loginWithFacebook = function() {
		facebookService
	   .loginOrRegisterFacebook(function(error) {
	   		if(error.message === 'EMAIL_IN_USE') {
	   			alert('Email already used!');
	   		}
	   });
	};


	$scope.loginNative = function() {
		$scope.inactiveAccount = false;
		$scope.loginForm.email.$setValidity('inactiveAccount', true);
		$scope.loginForm.email.$setValidity('invalidCredentials', true);
		$scope.loginForm.password.$setValidity('invalidCredentials', true);

		if($scope.loginForm.$invalid) {
			return;
		}
		loginService
		.authenticate($scope.user)
		.success(function(data, status, headers) {
			var token = headers()['x-auth-token'];
			if(token) {
				$state.go('chat');
			}
 		}).error(function(err) {
 			switch(err.message) {
 				case 'INCOMPLETE_PROFILE':
	 				if(err.hash) {
	 					$state.go('completeProfile',{hash: err.hash});
	 				}
 				break;
 				case 'INACTIVE_ACCOUNT':
 					$scope.inactiveAccount = true;
 					$scope.loginForm.email.$setValidity('inactiveAccount', false);
 				break;
 				case 'BAD_CREDENTIALS':
 					$scope.loginForm.email.$setValidity('invalidCredentials', false);
 					$scope.loginForm.password.$setValidity('invalidCredentials', false);
 				break;
 			}
 		});
	};

	$scope.resendEmail= function() {
		loginService
		.resendEmail($scope.user.email)
		.success(function(data) {
			$scope.emailSent = true;
		})
		.error(function(error) {
		});
	};

	$scope.register = function() {
		$scope.registrationForm.email.$setValidity('emailInUse', true);
		if($scope.registrationForm.$invalid) {
			return;
		}
		loginService.register($scope.user, true)
		.success(function(data) {
			$rootScope.email = $scope.user.email;
			$state.go('mailSent');
		})
		.error(function(err) {
			switch(err.message) {
				case 'EMAIL_IN_USE':
					$scope.registrationForm.email.$setValidity('emailInUse', false);
				break;
			}
		});
	};

	$window.fbAsyncInit = function() {
    	FB.init({ 
	      appId: '567955236725308',
	      status: true, 
	      cookie: true, 
	      xfbml: true,
	      version: 'v2.4'
	    });
	    $scope.facebookLoginDisabled = false;
	    $scope.$apply();
	};

	(function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
	
}]);
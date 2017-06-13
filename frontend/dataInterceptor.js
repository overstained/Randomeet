angular.module('mainModule').factory('dataInterceptor', ['$q', '$rootScope', 'tokenService', '$injector',
function($q, $rootScope, tokenService, $injector) {
	return {
		'request': function (config) {
            return config || $q.when(config);
        },
        'requestError': function (response) {
            return $q.reject(response);
        },
        'response': function (response) {
        	if(response.headers('x-auth-token')) {
        		tokenService.storeToken(response.headers('x-auth-token'));
            	$rootScope.localUser = tokenService.decodeToken();
            	console.log($rootScope.localUser);
        	}
            return response || $q.when(response);
        },
		responseError : function(response) {
			switch(response.status) {
				case 401:
				 	var error = response.data.message;
				 	switch(error) {
				 		case 'INVALID_TOKEN':
				 			$rootScope.$emit('logoutEvent');
				 		return $q.resolve(response);
				 	}
				break;
				case 403:
					
				break;
			}
			return $q.reject(response);
		}
	};
}]);
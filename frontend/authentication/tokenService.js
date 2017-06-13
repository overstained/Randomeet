angular.module('loginModule').service('tokenService', ['$localStorage', 'jwtHelper',
 function ($localStorage, jwtHelper) {
 	return {
 		storeToken: function(token) {
 			$localStorage.token = token;
 		},
 		checkToken: function() {
	 		if(!$localStorage.token) {
	 			return false;
	 		}
	 		return true;
	 	},
	 	storeForUser: function(user, key, data) {
	 		if(!$localStorage[user])
	 			$localStorage[user] = {};
	 		$localStorage[user][key] = data;
	 	},
	 	getByKeyForUser: function(user, key) {
	 		return $localStorage[user][key];
	 	},
	 	getStorageForUser: function(user) {
	 		return $localStorage[user];
	 	},
	 	deleteByKeyForUser: function(user, key) {
	 		delete $localStorage[user][key];
	 	},
	 	decodeToken: function() {
	 		var user = jwtHelper.decodeToken($localStorage.token),
		    	ageDifMs = Date.now() - new Date(user.bd).getTime(),
		    	ageDate = new Date(ageDifMs);
		    user.a = Math.abs(ageDate.getUTCFullYear() - 1970);
	 		return user;
	 	},
	 	deleteToken: function() {
	 		delete $localStorage.token;
	 	}
 	};
}]);
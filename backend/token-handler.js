module.exports = function(application,
						  genericConstants) {
	var uuid        =  require('node-uuid');
	var jwt 		=  require('jsonwebtoken');
	var secretKey   =  uuid.v4();



	function tokenInterceptor(req, res, next) {
		if(req.url === genericConstants.LOGIN_URL ||
		req.url === genericConstants.REGISTRATION_URL ||
		req.url === genericConstants.ACTIVATE_ACCOUNT_URL ||
		req.url === genericConstants.USERNAME_CHECK_URL ||
		req.url === genericConstants.EMAIL_CHECK_URL ||
		req.url === genericConstants.GET_HASH_URL ||
		req.url === genericConstants.CHECK_HASH_URL ||
		req.url === genericConstants.SET_PROFILE_URL ||
		req.url === genericConstants.GET_PROFILE_QUESTIONS_URL) {
			return next();
		}
		var token = req.headers[genericConstants.TOKEN_HEADER];
		
		if(!token){
			return res.status(genericConstants.UNAUTHORIZED).json({
				message: genericConstants.INVALID_TOKEN.message
			});	
		}

		try {
			jwt.verify(token, secretKey);
		} catch(ex) {
			return res.status(genericConstants.UNAUTHORIZED).json({
				message: genericConstants.INVALID_TOKEN.message
			});
		}

		if(req.url === genericConstants.RANDOM_IQ_QUESTION_URL) {
			var decodedToken = jwt.decode(token);
			if(decodedToken.iqR === 0) {
	            return res.status(genericConstants.UNAUTHORIZED).json({
	                error: genericConstants.NO_MORE_IQ_QUESTIONS.message
	            });
		    }
		}

		if(req.url === genericConstants.RANDOM_GK_QUESTION_URL) {
			var decodedToken = jwt.decode(token);
			if(decodedToken.gkR === 0) {
	            return res.status(genericConstants.UNAUTHORIZED).json({
	                error: genericConstants.NO_MORE_GK_QUESTIONS.message
	            });
		    }
		}

		return next();
	}

	application.use(tokenInterceptor);

	var setTodayAt8AM = function() {
		var at8am= new Date();
	    at8am.setHours(8);
	    at8am.setMinutes(0);
	    at8am.setSeconds(0);
	    return at8am;
	}

	var constantValues = genericConstants.GET_VALUES;

	return {
		generateToken: function(user) {
			
			var at8am = setTodayAt8AM(),
				dateNowTimestamp = Date.now();
		    var diff = dateNowTimestamp - (at8am.getTime() + constantValues.DETLA_UPDATE_TIME_BOUND);
		    var expirationTime = null; 
		    if(diff > 0) {
		    	expirationTime = constantValues.SECONDS_IN_A_DAY - diff/constantValues.MILLISECONDS_IN_SECOND;
		    } else {
		    	expirationTime = Math.abs(diff);
		    }
		    if(user.exp){
		    	expirationTime = Math.min(expirationTime, (parseInt(user.exp) * constantValues.MILLISECONDS_IN_SECOND - dateNowTimestamp)/constantValues.MILLISECONDS_IN_SECOND)
		    } else {
		    	expirationTime = Math.min(expirationTime, constantValues.SECONDS_IN_6_HOURS);
		    }
		    genericConstants.TOKEN_OPTIONS.expiresIn = expirationTime;

		    try {
				return jwt.sign(user, secretKey, genericConstants.TOKEN_OPTIONS);
			} catch(ex) {
				console.log(ex);
			}
		},
		verifyToken: function(token) {
			if(!token) {
				return false;
			}
			try {
				jwt.verify(data.token, secretKey);
			} catch(ex) {
				return false;
			}
			return true;
		},
		decodeToken: function(token) {
			return jwt.decode(token);
		}
	};
};
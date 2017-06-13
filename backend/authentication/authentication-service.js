module.exports = function(application, authenticationConstants, genericConstants, tokenHandler, authMongoHandler , personalityMongoHandler, iqMongoHandler, gkMongoHandler, genericTools, personalityTools) {
	var authenticationTools 	 =  require('./authentication-tools')(authenticationConstants),
		schedule = require('node-schedule'),
		statistics = {};

	var gatherStatistics = function() {
			authMongoHandler
		  .gatherPersonalityStatistics()
		  .then(function(rows) {
		  	statistics.personalityStatistics = rows[0];
		  })
		  .catch(function(error) {
		  	console.log('Error while gathering personality statistics!', error.message);
		  })
		    authMongoHandler
		  .gatherGeneralKnowledgeStatistics()
		  .then(function(rows) {
		 	statistics.generalKnowledgeStatistics = rows[0];
		  })
		  .catch(function(error) {
			console.log('Error while gathering general knowledge statistics!', error.message);
		  });

		  	authMongoHandler
		  .gatherIQStatistics()
		  .then(function(rows) {
		  	statistics.iqStatistics = rows[0];
		  })
		  .catch(function(error) {
		  	console.log('Error while gathering IQ statistics!', error.message);
		  });
	}, updateRemainingQuestions = function() {
		 authMongoHandler
		.updateRemainingQuestionsAndTrials();
	};

	schedule.scheduleJob(genericConstants.CRON_8_AM, function(){
		updateRemainingQuestions();
	});
	
	updateRemainingQuestions();
	var constantValues = genericConstants.GET_VALUES;

	return {
		getStatistics: function(res) {
			res.status(genericConstants.OK).json(statistics);
		},
		verifyToken: function(token) {
			return tokenHandler.verifyToken(token);
		},
		checkEmailExistence: function(email){
			return authMongoHandler
			.checkEmailExistence(email);
		},
		checkUsernameExistence: function(username) {
		    return authMongoHandler
			.checkUsernameExistence(username);
		},
		resendEmail: function(email, res) {
			return authMongoHandler
		    .getIdFromEmail(email)
		    .then(function(rows) {
				if(rows.length > 0) {
					var message = 
					authenticationConstants.EMAIL_TEMPLATE.replace('$hash', genericTools.encrypt(rows[0].user_id.toString()));
					authenticationTools.sendActivationLink(email, message);
				} else {
					res.status(genericConstants.UNAUTHORIZED).json({
						message: authenticationConstants.BAD_CREDENTIALS.message
					});
				}
			});
		},
		activateAccount: function(hash, res) {
			var userId = genericTools.decrypt(hash);
			return authMongoHandler
					.getAccountStatus(userId)
					.then(function(data) {
						if(!data) {
							res.status(genericConstants.INTERNAL_ERROR).json({
								message: error.message,
								trace: 'A-SCE-AA'
							});
						}
						if(data.accountStatus === 'ACTIVE') {
							res.status(genericConstants.UNAUTHORIZED).json({
								message: authenticationConstants.ACCOUNT_ALREADY_ACTIVE.message
							});
						} else {
							authMongoHandler
						    .activateAccount(userId)
						    .then(function() {
						    	res.status(genericConstants.OK).json({});
							})
							.catch(function(error) {
								res.status(genericConstants.INTERNAL_ERROR).json({
									message: error.message,
									trace: 'A-SCE-AA'
								});
							});
						}
					});
		},
		getProfileQuestions: function(hash, res) {
			 var userId = genericTools.decrypt(hash);
			 return personalityMongoHandler
			.getNextQuestion(userId)
			.then(function(personality) {
				 iqMongoHandler
				.getRandomQuestion(0)
				.then(function(iq) {
					 gkMongoHandler
					.getRandomQuestion()
					.then(function(gk) {
						  delete gk.correctAnswerID;
						  delete iq.correctAnswerID;
						  res.status(genericConstants.OK).json({
							personalityQuestion: personality.personalityQuestion,
							iqQuestion: iq,
							gkQuestion: gk
						  });
					});
				});
			});
		},
		loginUser: function(header, res) {
			var credentials = authenticationTools.getCredentials(header);
			return authMongoHandler
				.getUserDataByEmail(credentials[0])
				.then(function(data) {
					if(!data) {
						return res.status(genericConstants.UNAUTHORIZED).json({
							message: authenticationConstants.BAD_CREDENTIALS.message
						});
					}
					if(data.accountStatus === 'INACTIVE') {
						return res.status(genericConstants.UNAUTHORIZED).json({
							message: authenticationConstants.INACTIVE_ACCOUNT.message
						});
					} else {
						if(!data.username) {
							return res.status(genericConstants.UNAUTHORIZED).json({
								message: authenticationConstants.INCOMPLETE_PROFILE.message
							});
						} 
					}

					if(!authenticationTools.checkPasswords(credentials[1], data.password)) {
						return res.status(genericConstants.UNAUTHORIZED).json({
							message: authenticationConstants.BAD_CREDENTIALS.message
						});
					}
					
					var user = {};
						var splitPersonality = data.personality.currentPersonalityRaw.split('.');

						user.ky = data._id;
						user.f = data.facebook;
						user.em = data.email;
						user.usr = data.username;
						user.bd = data.birthdate;
						user.g = data.gender;
						user.iqR = data.intelligence.remainingDailyIQQuestions;
						user.gkR = data.generalKnowledge.remainingDailyGKQuestions;
						if(data.membership && data.membership.membershipExpirationDate) {
							user.m = Date.parse(data.membership.membershipExpirationDate);
						}
						user.mR = data.match.remainingDailyMatchTrials;
						user.iq = data.intelligence.currentIQScore;
						user.gk = data.generalKnowledge.currentGKScore;
						user.p = {
							t1: splitPersonality[0],
							t2: splitPersonality[1],
							t3: splitPersonality[2],
							t4: splitPersonality[3]
						};

						user.pr = data.personality.currentPersonality;

					 authMongoHandler
					.updateLastLogin(data.username)
					.then(function() {
						res.writeHead(genericConstants.OK, {'x-auth-token': tokenHandler.generateToken(user)});
						res.end();
					});
				})
				.catch(function(error) {
					console.log(error);
				});
		},
		registerUser: function(header, sendEmail, res) {
			var credentials = authenticationTools.getCredentials(header),
			data = {
				email: credentials[0],
				password: authenticationTools.hashPassword(credentials[1])
			};
			return authMongoHandler
			.checkEmailExistence(data.email)
			.then(function(result) {
				if(result && result.email) {
		   			return res.status(genericConstants.UNAUTHORIZED).json({
		   				message : authenticationConstants.EMAIL_IN_USE.message
			   		});
				}
				authMongoHandler
				.registerUser(data, !sendEmail)
				.then(function(data) {
					 authMongoHandler
					.getEmailFromId(data.insertedId)
					.then(function(result) {
						var encryptedId = genericTools.encrypt(data.insertedId.toString()),
							message = 
								authenticationConstants.EMAIL_TEMPLATE.replace('$hash', encryptedId);
						if(sendEmail) {
							authenticationTools.sendActivationLink(result.email, message);
							res.status(genericConstants.OK).json({});
						} else {
							res.status(genericConstants.OK).json({
								hash: encryptedId
							});
						}
					})
					.catch(function(error) {
						return res.status(genericConstants.INTERNAL_ERROR).json({
							message: error.message,
							trace: 'A-SCE-R'
						});
					});
				});
			});
		},
		updateUserProfile: function(user, info, res) {
			info.birthdate = new Date(Date.parse(info.birthdate)).toISOString();
			return authMongoHandler
			.updateUserProfile(user.ky, info)
			.then(function() {
				genericConstants.MONGO_UPDATE_PROFILE_QUERY.$set = {};
				console.log(info.birthdate);
				user.g = info.gender;
				user.bd = info.birthdate;
				res.writeHead(genericConstants.OK, {'x-auth-token': tokenHandler.generateToken(user)});
				res.end();
			});
		},
		setUserProfile: function(data, res) {

				var userId = genericTools.decrypt(data.hash);
				return authMongoHandler.setUserBasicInfo(userId, data.basicInfo).then(function(basicInfo) {
					var user = basicInfo.value;
					var updatedPersonality = personalityTools.updatePersonality(user.personality.currentPersonalityRaw, 
								             parseInt(data.personalityAnswer.negativelyAffectedType), data.personalityAnswer.answer);
					var formattedPersonality = personalityTools.formatPersonality(updatedPersonality);
		            var	reducedPersonality = personalityTools.reducePersonality(formattedPersonality);
		            var correctIQ = false, correctGK = false;


		            var splitPersonality = updatedPersonality.split('.');

		            var forToken = {
						ky: user._id,
						f: user.facebook,
						iqR: constantValues.IQ_MAX_QUESTIONS_FOR_MEMBERS,
						gkR: constantValues.GK_MAX_QUESTIONS_FOR_MEMBERS,
						mR: constantValues.MATCH_MAX_TRIALS_FOR_MEMBERS,
						usr: user.username,
						em: user.email,
						bd: user.birthdate,
						g: user.gender,
						p: {
							t1: splitPersonality[0],
							t2: splitPersonality[1],
							t3: splitPersonality[2],
							t4: splitPersonality[3]
						},
						pr: reducedPersonality
					};

	             	iqMongoHandler
					.getQuestionById(data.iqAnswer.questionId)
					.then(function(iqObj) {
						if(data.iqAnswer.answer === iqObj.correctAnswerID) {
							correctIQ = true;
						}

						gkMongoHandler
					   .getQuestionById(data.gkAnswer.questionId)
					   .then(function(gkObj) {
							 if(data.gkAnswer.answer === gkObj.correctAnswerID) {
								correctGK = true;
							}
							authMongoHandler.updateProfileAnswers(user._id,
						   	updatedPersonality, reducedPersonality, correctIQ, 
						   	correctGK, user.intelligence, user.generalKnowledge).then(function(userUpdated) {
						   		forToken.iq = userUpdated.value.intelligence.currentIQScore;
						   		forToken.gk = userUpdated.value.generalKnowledge.currentGKScore;
						   		var expDate = new Date();
								expDate.setMonth(expDate.getMonth() + genericConstants.SUBSCRIPTION_TYPE['TWO_MONTHS']);
								var expDateISO = expDate.toISOString();
								authMongoHandler
								.updateMembership(user._id, expDateISO)
								.then(function() {
									forToken.m = Date.parse(expDateISO);
									res.writeHead(genericConstants.OK, {'x-auth-token': tokenHandler.generateToken(forToken)});
									res.end();
								})
								.catch(function(err) {
									console.log(err);
								});
						   	}).catch(function(err) {
						   		console.log(err);
						   	});
						}).catch(function(err) {
							console.log(err);
						});
					});
				});
		},
		getHash: function(email, res) {
			return authMongoHandler
			.getIdFromEmail(email)
			.then(function(data) {
				if(!data) {
					return res.status(genericConstants.UNAUTHORIZED).json({
						message: authenticationConstants.BAD_CREDENTIALS.message
					});
				}

				res.status(genericConstants.OK).json({
					hash: genericTools.encrypt(data._id.toString())
				});
			});
		},
		checkHash: function(hash, res) {
			var userId;
			try {
			 userId = genericTools.decrypt(hash);
			} catch(e) {
				return res.status(genericConstants.UNAUTHORIZED).json({
					message: genericConstants.BAD_DATA.message
				});
			}

			return authMongoHandler
			.checkProfileCompletionById(userId)
			.then(function(data) {
				if(!data || (data && data.username)) {
					return res.status(genericConstants.UNAUTHORIZED).json({
						message: genericConstants.BAD_DATA.message
					});
				} 

				res.status(genericConstants.OK).json({});
			});
		},
		updateMembership: function(user, type) {
			var expDate = new Date();
			expDate.setMonth(expDate.getMonth() + genericConstants.SUBSCRIPTION_TYPE[type]);
			var expDateISO = expDate.toISOString();
			authMongoHandler
			.updateMembership(user.ky, expDateISO)
			.then(function() {
				user.m = Date.parse(expDateISO);
				res.writeHead(genericConstants.OK, {'x-auth-token': tokenHandler.generateToken(user)});
				res.end();
			})
			.catch(function(err) {
				console.log(err);
			});
		}
	};
};
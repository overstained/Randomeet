angular.module('chatModule').service('signalingService', ['$http', '$localStorage', 'chatConstant',  function($http, $localStorage, chatConstant) {
this.getSignalingServer = function() {
			var self = this,
				user = {},
				iosocket = null,
				candidates = [],
				localStream = null,
				localDevice = new RTCPeerConnection(chatConstant.ICEConfig, chatConstant.ICEOptions),
				activeDatachannel = null,
				remoteOfferSet = false,
				remoteAnswerSet = false,

				createLocalOffer = function() {
					setupLocalDatachannel();
					localDevice.createOffer(function(description) {
						localDevice.setLocalDescription(description);
						iosocket.send({
							roomID: user.roomID,
							remoteOffer: JSON.stringify(description)
						});
					}, function(error) {
						console.log(error);
					});
				},
				
				handleRemoteOffer = function(remoteOffer) {
					localDevice.setRemoteDescription(remoteOffer);
					remoteOfferSet = true;
					
					localDevice.createAnswer(function(description) {
						localDevice.setLocalDescription(description);
						iosocket.send({
							roomID: user.roomID, 
							remoteAnswer: JSON.stringify(description)
						});
					}, function(error) {
						console.log(error);
					});
				},

				handleRemoteAnswer = function(remoteAnswer) {
					localDevice.setRemoteDescription(remoteAnswer);
					remoteAnswerSet = true;
				},

				localDeviceOnICE = function(event) {
					if(event.candidate != null) {
						iosocket.send({
							roomID: user.roomID, 
							offercandidate: JSON.stringify(event.candidate)
						});
					}
				},

				localDeviceOnTrack = function(event) {
					var stream = event.streams[0];
					if(stream) {
						if(self.callback) {
							self.callback(stream);
						}
						self.callback = null;
					}
				},

				messageHandler = function(data) {
					if(data.message) {
						self.mesCallback(data);
					}
				}

				setupLocalDatachannel = function() {
					try {
						activeDatachannel = localDevice.createDataChannel(user.roomID, {reliable:true});

						activeDatachannel.onopen = function(event) {
							if(self.callback) {
								self.callback(self.remoteUser);
							}
						}

						activeDatachannel.onmessage = function(event) {
							self.mesCallback(event.data);
						}
					} catch(error) {
						console.log(error);
					}
				},

				remoteDeviceOnDatachannelHandler = function(event) {
		      		activeDatachannel = event.channel || event;

		      		activeDatachannel.onopen = function (event) {
		      			if(self.callback) {
		      				self.callback(self.remoteUser);
		      			}
		      			self.callback = null;
		      			iosocket.send({roomID:user.roomID, handshakeDone: true});
		      		};

		      		activeDatachannel.onmessage = function (event) {
		      			self.mesCallback(event.data);
		      		};
		   		},

				setUp = function() {
					iosocket.on('remoteOffer', function(data) {
			              handleRemoteOffer(new RTCSessionDescription(JSON.parse(data.remoteOffer)));
			        });

			        iosocket.on('remoteAnswer', function(data) {
			              handleRemoteAnswer(new RTCSessionDescription(JSON.parse(data.remoteAnswer)));
			        });

			        var lastIceOfferCandidateCall = null,
		          	 	offerTimer = setInterval(function() {
		            		if(lastIceOfferCandidateCall != null) {
		              			if(new Date() - lastIceOfferCandidateCall > 500) {
		               				if(remoteAnswerSet 
		               				&& candidates != null) {
		                				for(var i=0;i<candidates.length;i++) {
		                 					localDevice.addIceCandidate(candidates[i]);
		                				}
		                                candidates = null;
		               				} else if(remoteAnswerSet 
		               					   && candidates == null) {            
		                			    clearInterval(offerTimer);
		                            }
		                        }
		                    }
		                },100),

		                lastIceAnswerCandidateCall = null,
		          		answerTimer = setInterval(function() {
		            		if(lastIceAnswerCandidateCall != null) {
		              			if(new Date() - lastIceAnswerCandidateCall > 500) {
		                			if(remoteOfferSet 
		                			&& candidates != null) {
		                  				for(var i=0;i<candidates.length;i++) {
		                   					localDevice.addIceCandidate(candidates[i]);
		              					}
		                  				candidates = null;
		                			} else if(remoteOfferSet 
		                				   && candidates == null) {            
		                  				clearInterval(answerTimer);
		                			}
		              			}
		            		}
		          		},100);

		          		iosocket.on('iceoffercandidate', function(data) {
		              		lastIceAnswerCandidateCall = new Date();
		              		if(data.offercandidate) {
		                		if(remoteAnswerSet) {
		                  			if(candidates != null) { 
		                    			for(var i=0;i<candidates.length;i++) {
		                      				localDevice.addIceCandidate(candidates[i]);
		                    			}
		                   			 	localDevice.addIceCandidate(new RTCIceCandidate(JSON.parse(data.offercandidate)));
		                    			candidates = null;
		                  			}
		                		} else {
		                   			if(candidates != null) { 
		                     			candidates.push(new RTCIceCandidate(JSON.parse(data.offercandidate)));
		               				}
		                		}
		              		}
		          		});

		          		iosocket.on('iceanswercandidate', function(data) {
		              		lastIceOfferCandidateCall = new Date();
		          			if(data.answercandidate) {
		                		if(remoteAnswerSet) {
		                  			if(candidates != null) { 
		                   				for(var i=0;i<candidates.length;i++) {
		                      				localDevice.addIceCandidate(candidates[i]);
		                    			}
		                    			localDevice.addIceCandidate(new RTCIceCandidate(JSON.parse(data.answercandidate)));
		                    			candidates = null;
		                  			}
		                		} else {
		                   			if(candidates != null) { 
		                    			candidates.push(new RTCIceCandidate(JSON.parse(data.answercandidate)));
		                   			}
		                		}
		              		} 
		          		});
				},

				signalingStateChangeHandler = function(state) {
					console.info('Signaling state change: ', state);
				},

				ICEConnectionStateChangeHandler = function(state) {
					console.info('ICE connection state change: ', state);
				},

				ICEGatteringStateChangeHandler = function(state) {
					console.info('ICE gattering state change: ', state);
				},

				identityResultHandler = function(event) {
					console.log('Identity result: ', event);
				},

				idpAsserstionErrorHandler = function(error) {
					console.log('Identity assertion error: ', error);
				},

				idpValidationErrorHandler = function(error) {
					console.log('Identity validation error: ', error);
				},

				negotiationNeededHandler = function(event) {
					console.log('Negotiation needed: ', event);
				},

				peerIdentityHandler = function(event) {
					console.log('Peer identity: ', event);
				},

				removeStreamHandler = function(event) {
					console.log('Removed stream: ', event);
				};



			localDevice.onicecandidate = localDeviceOnICE;
			localDevice.onsignalingstatechange = signalingStateChangeHandler;
			localDevice.oniceconnectionstatechange = ICEConnectionStateChangeHandler;
			localDevice.onicegatteringstatechange = ICEGatteringStateChangeHandler;
			localDevice.onidentityresult = identityResultHandler;
			localDevice.onidpassertionerror = idpAsserstionErrorHandler;
			localDevice.onidpvalidationerror = idpValidationErrorHandler;
			localDevice.onnegotiationneeded = negotiationNeededHandler;
			localDevice.onpeeridentity = peerIdentityHandler;
			localDevice.onremovestream = removeStreamHandler;
			localDevice.ontrack = localDeviceOnTrack;
			localDevice.ondatachannel = remoteDeviceOnDatachannelHandler;

			

		    return {
		    	createConnection: function(localUser, callback) {
		    		self.callback = callback;
		    		iosocket = io.connect(chatConstant.signalingServerUrl, {
						query: {
							usr: localUser.usr,
							iq: localUser.iq,
							gk:  localUser.gk,
							p: localUser.p,
							pr: localUser.pr,
							a: localUser.a,
							g: localUser.g
						}
					});

		    		iosocket.on('connect', function() {
						setUp();
					});

					iosocket.on('owner', function(data){
						self.remoteUser = data.remote;
				        if(data.roomMaster === true) {
							 user.master = true;        	
				             createLocalOffer();
				        }
					});

					iosocket.on('joinedRoom', function(data) {
				        user.roomID = data.roomID;
				    });
		    	},
		    	disconnectPeers: function() {
		    		remoteAnswerSet = false;
		    		remoteOfferSet = false;
		    		candidates = [];
		    		if(activeDatachannel) {
		    			activeDatachannel.close();
		    		}
		    		localDevice.close();
		    		activeDatachannel = null;
		    		localDevice = new RTCPeerConnection(chatConstant.ICEConfig, chatConstant.ICEOptions);

					localDevice.onicecandidate = localDeviceOnICE;
					localDevice.onsignalingstatechange = signalingStateChangeHandler;
					localDevice.oniceconnectionstatechange = ICEConnectionStateChangeHandler;
					localDevice.onicegatteringstatechange = ICEGatteringStateChangeHandler;
					localDevice.onidentityresult = identityResultHandler;
					localDevice.onidpassertionerror = idpAsserstionErrorHandler;
					localDevice.onidpvalidationerror = idpValidationErrorHandler;
					localDevice.onnegotiationneeded = negotiationNeededHandler;
					localDevice.onpeeridentity = peerIdentityHandler;
					localDevice.onremovestream = removeStreamHandler;
					localDevice.ontrack = localDeviceOnTrack;
					localDevice.ondatachannel = remoteDeviceOnDatachannelHandler;

		    	},
		    	reconnectForMedia: function(cb) {
		    		self.callback = cb;
		    		
		    		iosocket = io.connect(chatConstant.signalingServerUrl, {
						query: {
							roomID: user.roomID
						}
					});

					iosocket.on('connect', function() {
						setUp();
					});

					iosocket.on('owner', function(data){
						self.remoteUser = data.remote;
				        if(data.roomMaster === true) {
							 user.master = true;        	
				             createLocalOffer();
				        }
					});
		    	},
		    	addMediaStream: function(stream) {
		    		localStream = stream;
		    		var audioTrack = stream.getAudioTracks()[0];
		    		var videoTrack = stream.getVideoTracks()[0];
					localDevice.addStream(stream);
		    	},
		    	send: function(message) {
		    		if(activeDatachannel && activeDatachannel.readyState === 'open') {
		    			activeDatachannel.send(message);
		    		}
		    	},
		    	onMessage: function(callback) {
		    		self.mesCallback = callback;
		    	},
		    	activeChannel: function() {
		    		return activeDatachannel != null &&  activeDatachannel.readyState === 'open';
		    	},
		    	stopMediaStream: function() {
		    		if(localStream) {
			    		if(localStream.getVideoTracks().length !== 0) {
			    			localStream.getVideoTracks()[0].stop();
			    		}
			    		if(localStream.getAudioTracks().length !== 0) {
			    			localStream.getAudioTracks()[0].stop();
			    		}
			    		localDevice.removeStream(getRemoteStreams()[0]);
			    		localStream = null;
		    		}
		    	},
		    	disconnectSocket: function() {
		    		if(iosocket) {
		    			iosocket.disconnect();
		    		}
		    	}
		    };
	};


}]);
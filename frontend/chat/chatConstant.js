angular.module('chatModule').constant('chatConstant', {
	'signalingServerUrl' : 'https://randomeet-signaling.herokuapp.com/',
	'ICEConfig': {
		iceServers: [{
				'urls':'stun:178.62.127.9:80',
				'username': '',
				'credential': ''
			},
      {
           'urls': 'turn:178.62.127.9:80?transport=udp',
           'credential': '11235813',
           'username': 'vradu'
     	},
    	{
           'urls': 'turn:178.62.127.9:80?transport=tcp',
           'credential': '11235813',
           'username': 'vradu'
     	}]
     },
	'ICEOptions': { 
		optional: [{ 'DtlsSrtpKeyAgreement': true }] 
	}
});
angular.module('chatModule').controller('fullWebcamController', ['$scope', '$mdDialog', 'localViewStream', 'remoteViewStream', '$timeout',
	function($scope, $mdDialog, localViewStream, remoteViewStream, $timeout) {
		console.log(localViewStream, remoteViewStream);
		$timeout(function() {
			try{
				var localVideo = $('#full-local-video')[0];
				localVideo.srcObject = localViewStream;
				localVideo.play();

				var remoteVideo = $('#full-remote-video')[0];
				remoteVideo.srcObject = remoteViewStream;
				remoteVideo.play();
			} catch(ex) {
				  	console.log(ex);
		  	}
		}, 0);
}]);
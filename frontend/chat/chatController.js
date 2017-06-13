angular.module('chatModule').controller('chatController', ['$scope', '$http', '$state', 'tokenService', 
  'signalingService', '$rootScope', 'personalityService', '$mdDialog', 'personalityConstant', 'iqService', '$sce', '$interval',
  'loginService', 'gkService', '$window', 'FileSaver', 'Blob', '$timeout',
function($scope, $http, $state, tokenService, signalingService, $rootScope, personalityService, $mdDialog, 
  personalityConstant, iqService, $sce, $interval, loginService, gkService, $window, FileSaver, Blob, $timeout) {
  
  if(!tokenService.checkToken()) {
    $state.go('authentication');
  } else {
    $rootScope.localUser = tokenService.decodeToken();
    $rootScope.signalingServer = signalingService.getSignalingServer();
  }


  $scope.chat = {};
  $scope.matchState = 'IDLE';
  $scope.messages = [];

  navigator.getUserMedia = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia ||
                          navigator.oGetUserMedia;

  var videoError = function(e) {
      console.log(e);
  };

  $scope.videoState = 'OFF';

  var localViewStream = null;
  var remoteViewStream = null;

  

  $rootScope.userUpdate = $interval(function() {
    $rootScope.localUser = tokenService.decodeToken();
  }, 500);

  $scope.showMyCam = function() {
    $scope.videoState = 'LOADING_LOCAL_VIEW';
    if(navigator.getUserMedia) {
      navigator.getUserMedia({video: true, audio:true}, function(stream) {
          localViewStream = stream;
          var video = $('#local-web')[0];
          console.log(video);
          video.srcObject = stream; 
          video.play();
          $scope.videoState = 'LOCAL_VIEW';
          console.log($scope.videoState);
      }, videoError);
    }
  };

  var stopStream = function(stream) {
     if(stream) {
      if(stream.getVideoTracks().length !== 0) {
        stream.getVideoTracks()[0].stop();
      }
      if(stream.getAudioTracks().length !== 0) {
        stream.getAudioTracks()[0].stop();
      }
    }
  };

  $scope.stopMyCam = function() {
    if(localViewStream) {
      if(localViewStream.getVideoTracks().length !== 0) {
        localViewStream.getVideoTracks()[0].stop();
      }
      if(localViewStream.getAudioTracks().length !== 0) {
        localViewStream.getAudioTracks()[0].stop();
      }
      localStream = null;
      $scope.videoState = 'OFF';
    }
  };

  $scope.formatBirthdate = function(date) {
    return moment(date).format('DD/MM/YYYY');
  };

  $scope.formatGender = function(gender) {
    return gender === 0 ? 'Male': 'Female';
  };

  $scope.showProfileDialog = function(e) {
    $mdDialog.show({
      controller: 'profileControllerChat',
      templateUrl: '/chat/templates/dialog/dialog.html',
      parent: angular.element(document.body),
      targetEvent: e,
      clickOutsideToClose:true
    });
  };

  $scope.formatIQ = function(iq) {
    return Math.round(iq);
  };

  $scope.formatGKQ = function(gkq) {
    return Math.round(gkq);
  };

  $scope.acceptMedia = function() {
    $rootScope.signalingServer.send(JSON.stringify({
      media: 'ACCEPT'
    }));
    var videos = document.querySelectorAll('video');
    console.log('no of videos', videos.length);
    if (navigator.getUserMedia) {
          navigator.getUserMedia({video: true, audio:true}, function(stream) {
              localViewStream = stream;
              console.log('local stream', stream);
              $scope.videoState = 'LOADING_REMOTE_STREAM';
              $('#answer-web').html('You have accepted webcam exchange');
              $('#answer-web').removeAttr("id");
              var video = videos[0];
              $rootScope.signalingServer.disconnectPeers();
              $rootScope.signalingServer.addMediaStream(stream);
              $rootScope.signalingServer.reconnectForMedia(function(remoteStream){
                if(stream.getAudioTracks().length !== 0) {
                  stream.getAudioTracks()[0].stop();
                }
                video.srcObject = stream;
                remoteViewStream = remoteStream;
                var videoRemote = videos[1];
                console.log('remote stream', remoteStream);
                videoRemote.srcObject = remoteStream;
                $scope.videoState = 'REMOTE_STREAM';
                video.play();
                videoRemote.play();
                $scope.$apply();
              });
          }, videoError);
      }
  };

  $scope.declineMedia = function() {
    $('#answer-web').html('You have declined webcam exchange');
    $('#answer-web').removeAttr("id");
    $rootScope.signalingServer.send(JSON.stringify({
      media: 'DECLINE'
    }));
  };

  $scope.cancelRequest = function() {
    $('#request-web').html('Webcam exchange request has been canceled');
    $('#request-web').removeAttr("id");
    $rootScope.signalingServer.send(JSON.stringify({
      media: 'CANCEL'
    }));
  };

  $scope.requestMedia = function() {
    var message = {
      type: 'SYSTEM',
      text: '<span style="color:blue" id="request-web"> You have requested user media <a ng-click="cancelRequest()">Cancel</a></span>'
    };
    $scope.messages.push(message);
    $rootScope.signalingServer.send(JSON.stringify({
      media: 'REQUEST'
    }));
  };


  $scope.logout = function() {
      $rootScope.signalingServer.send(JSON.stringify({
        media: 'STOP_CONVERSATION'
      }));
      $scope.stopMyCam();
      $rootScope.signalingServer.disconnectSocket();
      $rootScope.signalingServer.stopMediaStream();
      $rootScope.signalingServer.disconnectPeers();
      tokenService.deleteToken();
      $mdDialog.hide();
      $interval.cancel($rootScope.userUpdate);
      $state.go('authentication');
  };



  $scope.fullScreenWebExchange = function(e) {
    var videos = document.querySelectorAll('video');
    videos[0].pause();
    videos[1].pause();
    videos[0].srcObject = null;
    videos[1].srcObject = null;
    $mdDialog.show({
        controller: 'fullWebcamController',
        templateUrl: '/chat/templates/dialog/fullScreenWebcam.html',
        parent: angular.element(document.body),
        targetEvent: e,
        clickOutsideToClose:true,
        locals: {
           localViewStream: localViewStream,
           remoteViewStream: remoteViewStream
        },
        onRemoving: function (event, removePromise) {
          videos[0].srcObject = localViewStream;
          videos[1].srcObject = remoteViewStream;
          videos[0].play();
          videos[1].play();
        }
      });
    };

  $scope.topLeftStyle = function(index, type) {
    var style = {};
    if(type === 'SYSTEM') {
      return style;
    }

    var borderRadius = '25px';
    if(type === 'USER_LOCAL') {
      style['float'] = 'right';
      style['text-align'] = 'right';
      style['border-top-left-radius'] = borderRadius;
      style['border-bottom-left-radius'] = borderRadius;
      style['background-color'] = 'blue';
    } else {
      style['text-align'] = 'left';
      style['border-top-right-radius'] = borderRadius;
      style['border-bottom-right-radius'] = borderRadius;
      style['background-color'] = 'green';
    }

    if($scope.messages[index-1]) {
      if($scope.messages[index-1].type !== type) {
        if(type === 'USER_LOCAL') {
          style['border-top-right-radius'] = borderRadius;
        } else {
          style['border-top-left-radius'] = borderRadius;
        }
      }
    } else {
      if(type === 'USER_LOCAL') {
        style['border-top-right-radius'] = borderRadius;
      } else {
        style['border-top-left-radius'] = borderRadius;
      }
    }

    if($scope.messages[index+1]) {
      if($scope.messages[index+1].type !== type) {
        if(type === 'USER_LOCAL') {
          style['border-bottom-right-radius'] = borderRadius;
        } else {
          style['border-bottom-left-radius'] = borderRadius;
        }
      }
    } else {
      if(type === 'USER_LOCAL') {
        style['border-bottom-right-radius'] = borderRadius;
      } else {
        style['border-bottom-left-radius'] = borderRadius;
      }
    }

    return style;
  }

  var handleRemoteUserTextMessage = function(data) {
    var message = {
          usr: $scope.remoteUser.usr,
          type: 'USER_REMOTE',
          text: data.message,
          index: $scope.messages.length,
          date: new Date()
    };
    $scope.messages.push(message);
    $scope.$apply();
  };

  var handleRemoteUserMediaRequest = function() {
    var message= {
       type: 'SYSTEM',
       text: '<span style="color:blue;" id="answer-web">The other user wants to exchange webcams <a ng-click="acceptMedia()">Accept</a> <a ng-click="declineMedia()"> Decline</a></span>'
     };
     $scope.messages.push(message);
     $scope.$apply();
  };

  var handleRemoteUserMediaAcceptance = function() {
     if (navigator.getUserMedia) {
        navigator.getUserMedia({video: true, audio:true}, function(stream) {
            localViewStream = stream;
            $scope.videoState = 'LOADING_REMOTE_STREAM';
            $('#request-web').html('The other user accepted webcam exchange');
            $('#request-web').removeAttr("id");
            var video = videos[0];

            $rootScope.signalingServer.disconnectPeers();
            $rootScope.signalingServer.addMediaStream(stream);
            $rootScope.signalingServer.reconnectForMedia(function(remoteStream){
              if(stream.getAudioTracks().length !== 0) {
                stream.getAudioTracks()[0].stop();
              }
              video.srcObject = stream;
              remoteViewStream = remoteStream;
              $scope.videoState = 'REMOTE_STREAM';
              var videoRemote = videos[1];
              videoRemote.srcObject = remoteStream;
              video.play();
              videoRemote.play();
              $scope.$apply();
            });
        }, videoError);
    }
    $scope.$apply();
  };

  var handleRemoteUserMediaDecline = function() {
    $('#request-web').html('The other user declined the webcam exchange');
    $('#request-web').removeAttr("id");
    $scope.$apply();
  };

  var handleRemoteUserRequestCancel = function() {
    $('#answer-web').html('The other user canceled the webcam exchange request');
    $('#answer-web').removeAttr("id");
    $scope.disableWebRequest = false;
    $scope.$apply();
  };

  var handleRemoteUserDisconnect = function() {
    $rootScope.signalingServer.stopMediaStream();
    $rootScope.signalingServer.disconnectPeers();
    $scope.videoState = 'OFF';
    $scope.matchState = 'IDLE';
    var message= {
     type: 'SYSTEM',
     text: '<span style="color:blue;" id="left-conversation"> The other user left the conversation</span>'
    };
    $scope.messages.push(message);
    $scope.$apply();
  };

  var handleRemoteUserMediaStop = function() {
    $rootScope.signalingServer.stopMediaStream();
    $scope.videoState = 'OFF';
    var message= {
     type: 'SYSTEM',
     text: '<span style="color:blue;" id="left-conversation"> The other user canceled web exchange.</span>'
    };
    $scope.messages.push(message);
    $scope.$apply();
  };

  var handleRemoteUserTypingBegin = function() {
    $scope.userIsTyping = true;
  };

  var handleRemoteUserTypingEnd = function() {
    $scope.userIsTyping = false;
  };

  var remoteHandlers = {
    REQUEST: handleRemoteUserMediaRequest,
    ACCEPT: handleRemoteUserMediaAcceptance,
    DECLINE: handleRemoteUserMediaDecline,
    CANCEL: handleRemoteUserRequestCancel,
    STOP_CONVERSATION: handleRemoteUserDisconnect,
    STOP_WEB: handleRemoteUserMediaStop,
    STARTED_TYPING: handleRemoteUserTypingBegin,
    STOPPED_TYPING: handleRemoteUserTypingEnd
  };

  $rootScope.signalingServer.onMessage(function(data) {
    data = JSON.parse(data);
    if(!data.media) {
      $scope.userIsTyping = false;
      handleRemoteUserTextMessage(data);
    } else {
      remoteHandlers[data.media]();
    }
  });

  var lastCharTypedStamp = null;
  var sendStartTyping = true;
  $scope.userIsTyping = false;

  var watchChatInput = function() {
      $scope.chatInputWatcher = $interval(function() {
         if(lastCharTypedStamp) {
          console.log(Date.now()-lastCharTypedStamp);
            if(Date.now()-lastCharTypedStamp > 1000) {
              $rootScope.signalingServer.send(JSON.stringify({
                media: 'STOPPED_TYPING'
              }));
              sendStartTyping = true;
              lastCharTypedStamp = null;
            }
          }
      }, 500);
  };

  $scope.lastCharTyped = function() {
    if(sendStartTyping) {
      $rootScope.signalingServer.send(JSON.stringify({
        media: 'STARTED_TYPING'
      }));
      watchChatInput();
      sendStartTyping = false;
    }
    lastCharTypedStamp = Date.now();
  };

  $scope.sendMessage = function($event) {
    if(!$rootScope.signalingServer.activeChannel()) {
      return;
    }

    if(($event && $event.keyCode === 13)
      || !$event) {
        $interval.cancel($scope.chatInputWatcher);
        sendStartTyping = true;
        lastCharTypedStamp = null;
        var message = {
          usr: $rootScope.localUser.usr,
          text: $scope.chat.message,
          index: $scope.messages.length,
          date: new Date()
        };
        $rootScope.signalingServer.send(JSON.stringify({ message: $scope.chat.message}));
        message.type = 'USER_LOCAL';
        $scope.messages.push(message);
        $scope.chat.message = '';
    }
  };

  $scope.shouldSaveConversation = function() {
    if($scope.matchState !== 'MATCHED') {
      return false;
    }
    for(var i=0;i<$scope.messages.length;i++) {
      if($scope.messages[i].usr) {
        return true;
      }
    }
    return false;
  };

  $scope.saveConversation = function() {
    var toSave = [];
    for(var i=0;i<$scope.messages.length;i++) {
      var m = $scope.messages[i];
      if(!m.usr) {
        continue;
      }
      toSave.push('[' + moment(m.date).format('DD/MM/YYYY hh:mm:ss') + ']' + '[' + m.usr + ']' + ' ' + m.text + '\r\n');
    }
    var data = new Blob(toSave, { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(data, Date.now() + '.txt');
  };

  var clearChat = function() {
    $scope.messages = [];
  };

  $scope.match = function() {
    clearChat();
    $scope.matchState = 'LOOKING_FOR_MATCH';
    $rootScope.signalingServer.createConnection($rootScope.localUser,
      function(remoteUser) {
        $scope.matchState = 'MATCHED';
        $scope.remoteUser = remoteUser;
        console.log(remoteUser);
        $scope.$apply();
    });
  };

  $scope.stopConversation = function() {
    $rootScope.signalingServer.send(JSON.stringify({
      media: 'STOP_CONVERSATION'
    }));
    $rootScope.signalingServer.stopMediaStream();
    $rootScope.signalingServer.disconnectPeers();
    $scope.videoState = 'OFF';
    $scope.matchState = 'IDLE';
  };

  $scope.stopMedia = function() {
    $rootScope.signalingServer.send(JSON.stringify({
      media: 'STOP_WEB'
    }));
    $rootScope.signalingServer.stopMediaStream();
    $scope.videoState = 'OFF';
    var message= {
     type: 'SYSTEM',
     text: '<span style="color:blue;" id="left-conversation"> You have canceled web exchange.</span>'
    };
    $scope.messages.push(message);  
  };

  $rootScope.$on('logoutEvent', function (event) {
    $scope.logout();
  });

  $scope.$on("$destroy", function() {
      $scope.stopConversation();
  });

  var windowElement = angular.element($window);
  windowElement.on('beforeunload', function (event) {
      $scope.stopConversation();
  });

}]);
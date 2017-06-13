angular.module('loginModule').factory('facebookService', [ 'loginService', '$state', '$localStorage', 'tokenService', function(loginService, $state, $localStorage, tokenService) {

    var activateAccount = function(hash) {
         loginService
        .activateAccount(hash)
        .then(function() {
            $state.go('completeProfile', {userHash:hash});
            delete $localStorage.hash;
        }, function(err) {
        });
    };
    return {
        loginOrRegisterFacebook: function(cb) {
            FB.login(function(response){
              if(response.authResponse)
              {
                  FB.api('/me?fields=email', function(responseFromFB){      
                        var user = {
                            email: responseFromFB.email,
                            password: responseFromFB.id
                        };                                                     
                         loginService
                        .authenticate(user)
                        .then(function(obj) {
                            if(obj.headers('x-auth-token')) {
                              $localStorage.token = obj.headers('x-auth-token');
                              $state.go('chat');
                            }
                        }, function(err) {
                           if(err.data.message === 'BAD_CREDENTIALS') {
                                   loginService
                                  .register(user, false)
                                  .then(function(obj) {
                                      $localStorage.hash = obj.data.hash;
                                      activateAccount(obj.data.hash);
                                  }, function(err) {
                                      switch(err.data.message) {
                                        case 'EMAIL_IN_USE':
                                          cb({message:'EMAIL_IN_USE'});
                                        break;
                                      }
                                  });
                           } else if(err.data.message === 'INCOMPLETE_PROFILE') {
                                   loginService
                                  .getHash(user.email)
                                  .then(function(obj) {
                                    console.log(obj.data.hash);
                                      $state.go('completeProfile', {userHash: obj.data.hash});
                                   }, function(err) {});
                           } else if(err.data.message === 'INACTIVE_ACCOUNT') {
                              if($localStorage.hash) {
                                 activateAccount($localStorage.hash);
                              } else {
                                  loginService
                                 .getHash(user.email)
                                 .then(function(obj) {
                                    activateAccount(obj.data.hash);
                                 }, function(err) {});
                              }
                           }
                        });
                  });
              }
              else
              {
                  console.log('The login failed because they were already logged in');
              }
            }, {scope:'email'});
        }
    }
}]);
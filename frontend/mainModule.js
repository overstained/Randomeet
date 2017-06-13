angular
.module('mainModule', ['ui.router', 'ngStorage', 'loginModule', 'chatModule', 'base64', 'ngAnimate',
	'mgo-angular-wizard', 'ui.bootstrap', 'angular-jwt', 'ngSanitize', 'ngMaterial', 'ngMessages', 'angularRangeSlider',
	'perfect_scrollbar', 'ngFileSaver'])
.config(['$stateProvider', '$urlRouterProvider', '$mdIconProvider', '$mdThemingProvider', '$locationProvider', '$httpProvider', '$sceProvider',
	function ($stateProvider, $urlRouterProvider, $mdIconProvider, $mdThemingProvider, $locationProvider, $httpProvider, $sceProvider) {
	
	 $httpProvider.interceptors.push('dataInterceptor');

	 $sceProvider.enabled(false);

	$mdIconProvider
       .iconSet('social', 'https://randomeet-assets.herokuapp.com/icon-sets/social-icons.svg', 24)
       .iconSet('action', 'https://randomeet-assets.herokuapp.com/icon-sets/action-icons.svg', 24)
       .iconSet('communication', 'https://randomeet-assets.herokuapp.com/icon-sets/communication-icons.svg', 24)
       .iconSet('navigation', 'https://randomeet-assets.herokuapp.com/icon-sets/navigation-icons.svg', 24)
       .iconSet('av', 'https://randomeet-assets.herokuapp.com/icon-sets/av-icons.svg', 24)
       .iconSet('content', 'https://randomeet-assets.herokuapp.com/icon-sets/content-icons.svg', 24)
       .defaultIconSet('https://randomeet-assets.herokuapp.com/icon-sets/core-icons.svg', 24);

    $mdThemingProvider.theme('dark-grey').backgroundPalette('grey').dark();
    $mdThemingProvider.theme('blue-grey').backgroundPalette('blue-grey');
    $mdThemingProvider.theme('light-green').backgroundPalette('light-green');
    $mdThemingProvider.theme('blue').backgroundPalette('blue');
    $mdThemingProvider.theme('red').backgroundPalette('red');
    $mdThemingProvider.theme('amber').backgroundPalette('amber');

    $stateProvider
    .state('root', {
		templateUrl : 'authentication/templates/main.html'
	})
	.state('authentication', {
		url: '/',
		parent: 'root',
		templateUrl: 'authentication/templates/loginOrRegister.html',
		controller: 'loginController'
	})
	.state('login', {
		url: '/login/',
		parent: 'root',
		templateUrl: 'authentication/templates/login.html',
		controller: 'loginController'
	})
	.state('registration', {
		url: '/register/',
		parent: 'root',
		templateUrl: 'authentication/templates/registration.html',
		controller: 'loginController'
	})
	.state('mailSent', {
		url: '/mail/',
		parent: 'root',
		templateUrl: 'authentication/templates/mail.html',
		controller: 'loginController'
	})
	.state('completeProfile', {
		url: '/complete/:userHash',
		parent: 'root',
		templateUrl: 'profile/templates/profile.html',
		controller: 'profileController'
	})
	.state('chat', {
		url: '/chat/',
		templateUrl: '/chat/templates/chat.html',
		controller: 'chatController'
	});

	$locationProvider.html5Mode({
        enabled: true,
        rewriteLinks: false
    }).hashPrefix('*');

}]);
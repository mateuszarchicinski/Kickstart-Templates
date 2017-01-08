(function () {

    'use strict';

    myApp.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $locationProvider) {

        $stateProvider.state('default', {
            url: '/',
            templateUrl: 'views/default.html',
            controller: 'defaultController'
        });

        $urlRouterProvider.otherwise('/');

        $locationProvider.html5Mode(true);

    }]);

})();
(function () {

    'use strict';


    app.config(['$stateProvider', '$windowProvider', '$urlRouterProvider', '$locationProvider', function ($stateProvider, $windowProvider, $urlRouterProvider, $locationProvider) {

        $stateProvider.state('default', {
            url: '/',
            templateUrl: function() {
                var value = $windowProvider.$get().location.pathname.split('/')[1],
                    lang = value ? value : angular.element('html').attr('lang');
                
                return 'views/' + lang + '/default.html';
            },
            controller: 'defaultController'
        });

        $urlRouterProvider.otherwise('/');

        $locationProvider.html5Mode(true);

    }]);

})();
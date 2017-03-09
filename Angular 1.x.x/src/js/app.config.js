(function () {

    'use strict';


    app.config(['$windowProvider', 'LANGUAGES', '$stateProvider', '$urlRouterProvider', '$locationProvider', function ($windowProvider, LANGUAGES, $stateProvider, $urlRouterProvider, $locationProvider) {

        var value = $windowProvider.$get().location.pathname.split('/')[1],
            langValue = value ? value : angular.element('html').attr('lang'),
            baseUrl = langValue ? '/' + langValue + '/' : '/' + LANGUAGES[0] + '/';
        
        var getTemplateUrl = function (nameFile) {
            return 'views/' + langValue + '/' + nameFile + '.html';
        };
        
        $stateProvider.state('readme', {
            url: baseUrl + 'readme',
            templateUrl: getTemplateUrl('readme'),
            controller: 'readmeController'
        }).state('notfound', {
            url: baseUrl + 'notfound',
            templateUrl: getTemplateUrl('notfound'),
            controller: 'notfoundController'
        });
        
        $urlRouterProvider.otherwise(baseUrl + 'notfound');
        
        $locationProvider.html5Mode(true);

    }])
    .constant('LANGUAGES', ['pl', 'en']);

})();
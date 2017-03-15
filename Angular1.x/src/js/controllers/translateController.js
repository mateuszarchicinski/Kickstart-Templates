(function () {

    'use strict';


    app.controller('translateController', ['$scope', '$location', '$window', 'APP_CONFIG', '$log', function ($scope, $location, $window, APP_CONFIG, $log) {
        
        this.awesomeThings = [
            'AngularJS',
            'HTML5',
            'CSS3',
            'ES6'
        ];
        
        $log.info('translateController: ', 'JS running....');
        
        
        var getUrlParams = function () {
            var self = {},
                value = $location.url(),
                langValue = value.split('/')[1];
            
            self.language = APP_CONFIG.languages.indexOf(langValue) === -1 ? APP_CONFIG.languages[0] : langValue;
            
            self.path = value.substring(langValue.length + 1);
            
            return self;
        };
        
        
        $scope.language = getUrlParams().language;
        
        $scope.translate = function (langCode) {            
            $window.location.href = APP_CONFIG.host + langCode + getUrlParams().path;
        };
        
    }]);

})();
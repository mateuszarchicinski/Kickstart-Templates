(function () {

    'use strict';


    app.controller('translateController', ['$scope', '$location', '$window', 'config', '$log', function ($scope, $location, $window, config, $log) {
        
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
            
            self.language = !langValue ? config.languages[0] : langValue;
            
            self.path = value.substring(langValue.length + 1);
            
            return self;
        };
        
        
        $scope.language = getUrlParams().language;
        
        $scope.translate = function (langCode) {            
            $window.location.href = config.hostName + langCode + getUrlParams().path;
        };
        
    }]);

})();
(function () {

    'use strict';


    app.controller('translateController', ['$scope', '$window', '$log', function ($scope, $window, $log) {

        this.awesomeThings = [
            'AngularJS',
            'HTML5',
            'CSS3',
            'ES6'
        ];

        $log.info('translateController: ', 'JS running....');
        
        $scope.translate = function (langCode) {
            $window.location.href = 'http://localhost:4000/' + langCode;
            //console.log($window.location.href);
        };

    }]);

})();
(function () {

    'use strict';


    app.controller('defaultController', ['$log', function ($log) {

        this.awesomeThings = [
            'AngularJS',
            'HTML5',
            'CSS3',
            'ES6'
        ];

        $log.info('JS running....');
        
    }]);

})();
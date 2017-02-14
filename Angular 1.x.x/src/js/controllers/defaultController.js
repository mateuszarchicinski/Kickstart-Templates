(function () {

    'use strict';


    app.controller('defaultController', ['$log', '$anchorScroll', '$location', '$scope', function ($log) {

        this.awesomeThings = [
            'AngularJS',
            'HTML5',
            'CSS3',
            'ES6'
        ];

        $log.info('JS running....');

    }]);

})();
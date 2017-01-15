describe('controller: defaultController', function () {
    'use strict';

    beforeEach(module('app'));
    var defaultController;


    beforeEach(inject(function ($controller) {

        defaultController = $controller('defaultController', {});

    }));


    it('should attach a list of awesomeThings to the scope', function () {

        expect(defaultController.awesomeThings.length).toBe(4);

    });

});
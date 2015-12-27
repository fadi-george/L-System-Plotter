'use strict';

angular.module('lSystemApp', ['ngMaterial']).controller('MainCtrl', function($scope ) {

  $scope.numRules = ['1.','2.'];
  $scope.addRule = function(){
    var len = $scope.numRules.length;
    $scope.numRules.push(len+1+'.');
  };

});

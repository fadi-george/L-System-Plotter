'use strict';
var app = angular.module('lSystemApp', ['ngMaterial','ngAnimate','ngCookies','ngResource','ngRoute','ngSanitize','ui.bootstrap']);

app.controller('MainCtrl', function($scope , $timeout ,  $mdSidenav ) {

  // ------- Variables -----------------------------------------------

  $scope.axiom = '';
  $scope.gRules = [{'in':'','out':''}];

  // Save in case of Refresh
  if( localStorage.axiom ){
    $scope.axiom = localStorage.axiom;
  }
  if( localStorage.gRules ){
    var arr = JSON.parse( localStorage.gRules );
    $scope.gRules = arr;
  }
  $scope.updateAxiom = function(){
    localStorage.axiom = $scope.axiom;
  };
  $scope.updateRules = function(){
    var str = angular.toJson($scope.gRules);
    $scope.validateRules();
    localStorage.gRules = str;
  };



  // ------- Add Rule / Delete Rule -----------------------------------------------

  $scope.addRule = function(){
    ($scope.gRules).push({'in':'','out':''});
    $scope.updateRules();
  };
  $scope.deleteRule = function( idx ){
    $scope.gRules.splice(idx,1);
    $scope.updateRules();
  };


  // ------- Initialization of Canvas Dimensions -------------------------------

  angular.element(document).ready(function () {

    $timeout( function(){
      var w = angular.element( document.querySelector( '#canvasWrapper' ) )[0].clientWidth;
      var h = angular.element( document.querySelector( '#canvasWrapper' ) )[0].clientHeight;
      var c = angular.element( document.querySelector( '#graphCanvas' ) )[0];
      c.width = w;
      c.height = h;
    } , 50);

  });



  // ------- Helper Functions -----------------------------------------------

  $scope.toggleLeft = function() {
    $mdSidenav('left').toggle();
  };
  $scope.validateRules = function(){
    let seen = new Set();
    let pos = 0;
    var hasDuplicates = $scope.gRules.some(function(currentObject) {
        pos++;
        return seen.size === seen.add(currentObject.in).size;
    });
    console.log(pos,hasDuplicates,seen);
    if( hasDuplicates ){

    }

  };


  // ------ Update Canvas on Run -----------------------------------------------
  $scope.drawLSystem = function(){
    var c = angular.element( document.querySelector( '#graphCanvas' ) );
    var ctx = c.getContext('2d');
  };

}).directive('resizecanvas', function($window) {
    return function(scope, element, attr) {
        var w = angular.element($window);
        w.on('resize', function() {
            var w = angular.element( document.querySelector( '#canvasWrapper' ) )[0].clientWidth;
            var h = angular.element( document.querySelector( '#canvasWrapper' ) )[0].clientHeight;

            element.width = w;
            element.height = h;
            scope.$apply();
        });
    };
});

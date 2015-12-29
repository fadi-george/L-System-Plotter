'use strict';
var app = angular.module('lSystemApp', ['ngMaterial','ngAnimate','ngCookies','ngResource','ngRoute','ngSanitize','ui.bootstrap']);

app.controller('MainCtrl', function($scope , $timeout ,  $mdSidenav ) {


  // Variables
  $scope.numRules = ['1.','2.'];

  $scope.axiom ='';

  // Add rule
  $scope.addRule = function(){
    var len = $scope.numRules.length;
    $scope.numRules.push(len+1+'.');
  };


  // Initialization of Canvas Dimensions
  angular.element(document).ready(function () {

    $timeout( function(){
      var w = angular.element( document.querySelector( '#canvasWrapper' ) )[0].clientWidth;
      var h = angular.element( document.querySelector( '#canvasWrapper' ) )[0].clientHeight;
      var c = angular.element( document.querySelector( '#graphCanvas' ) )[0];
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      c.width = w;
      c.height = h;
    } , 50);

  });


  /*** HELPER FUNCTIONS ****/
  $scope.toggleLeft = function() {
    $mdSidenav('left').toggle();
  };
  $scope.isNavOpen = function(){
    return $mdSidenav('left').isOpen();
  };
}).directive('resizecanvas', function($window) {
    return function(scope, element, attr) {
        var w = angular.element($window);
        w.on('resize', function() {
            var w = angular.element( document.querySelector( '#canvasWrapper' ) )[0].clientWidth;
            var h = angular.element( document.querySelector( '#canvasWrapper' ) )[0].clientHeight;

            var changes = {
                width: w + 'px',
                height: h + 'px',
            };
            element.width = w;
            element.height = h;
            element.css(changes);
            scope.$apply();
        });
    };
});

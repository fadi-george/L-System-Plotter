'use strict';
var app = angular.module('lSystemApp', ['ngMaterial','ngAnimate','ngCookies','ngResource','ngRoute','ngSanitize','ui.bootstrap']);

app.controller('MainCtrl', function($scope , $timeout ,  $mdSidenav , $window ) {

  // ------- Variables -----------------------------------------------

  $scope.axiom = '';
  $scope.gRules = [{'in':'','out':''}];
  $scope.canvasChange = [];

  var browserWindow = angular.element($window);
  var canvas = angular.element( document.querySelector( '#graphCanvas' ) )[0];

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



  // ------- Helper Functions -----------------------------------------------

  $scope.toggleLeft = function() {      // Toggle Left Side Nav
    $mdSidenav('left').toggle();
  };

  $scope.validateRules = function(){    // Check for duplicate keys for rules
    let seen = new Set();
    let pos = 0;
    var hasDuplicates = $scope.gRules.some(function(currentObject) {
        pos++;
        return seen.size === seen.add(currentObject.in).size;
    });
    if( hasDuplicates ){
        pos--;
    }

  };
  $scope.adjustCanvas = function(){
    var w = angular.element( document.querySelector( '#graphCard' ) )[0].clientWidth;
    var h = angular.element( document.querySelector( '#graphCard' ) )[0].clientHeight;
    canvas.width = w - 16;
    canvas.height = h - 16;
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
  $scope.$watch(
    function () {
      return $window.innerWidth;
    },
    function (value) {
      $scope.adjustCanvas();
      console.log('teste');
    },
    true
  );
  browserWindow.bind('resize', function(){
    $scope.$apply();
  });




  // ------ Update Canvas on Run -----------------------------------------------
  $scope.drawLSystem = function(){
    var ctx = canvas.getContext('2d');
  };



  // ------ Maxmize or Minimize Screen Space -----------------------------------
  $scope.fillScreen = function(){
    $scope.canvasChange.push('cardMaximize');
  };
  $scope.shrinkScreen = function(){
    $scope.canvasChange.pop();
  };


  // ------ When the Page Loads  -----------------------------------------------
  angular.element(document).ready(function () {
      $timeout(function(){
        $scope.adjustCanvas();
      },100);
  });
});

'use strict';
var app = angular.module('lSystemApp', ['ngMaterial','ngAnimate','ngCookies','ngResource','ngRoute','ngSanitize','ui.bootstrap']);

app.controller('MainCtrl', function($scope , $timeout ,  $mdSidenav , $window ) {

  // ------- Variables -----------------------------------------------

  $scope.axiom = '';
  $scope.gRules = [{'in':'','out':''}];
  $scope.steps = 1;                           // iteration steps
  $scope.angle = 90;                          // drawing angle
  $scope.unit = 20;                           // line distance
  $scope.canvasChange = [];
  $scope.isBusyDrawing = false;

  var browserWindow = angular.element($window);
  var canvas = angular.element( document.querySelector( '#graphCanvas' ) )[0];

  // Save in case of Refresh
  if( localStorage.axiom ){
    $scope.axiom = localStorage.axiom;
  }
  if( localStorage.steps ){
    $scope.steps = localStorage.steps;
  }
  if( localStorage.angle ){
    $scope.angle = localStorage.angle;
  }
  if( localStorage.gRules ){
    var arr = JSON.parse( localStorage.gRules );
    $scope.gRules = arr;
  }

  $scope.updateAxiom = function(){
    localStorage.axiom = $scope.axiom;
  };
  $scope.updateSteps= function(){
    localStorage.steps = $scope.steps;
  };
  $scope.updateAngle = function(){
    localStorage.angle = $scope.angle;
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

  // Take axiom and perform replacement operations for each rule
  function iterateString(){
    var newStr = $scope.axiom;
    // Iterate on number of steps
    for (var i = 0; i < $scope.steps; i++) {
      for (var idx in $scope.gRules) {
        var rule = $scope.gRules[idx];
        if(rule.in){                                  // Avoid Empty Strings
          newStr = newStr.replace( new RegExp(rule.in,'g') ,rule.out);
        }
      }
    }
    return newStr;
  }


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
    },
    true
  );
  browserWindow.bind('resize', function(){
    $scope.$apply();
  });



  // ------ Maxmize or Minimize Screen Space -----------------------------------
  $scope.fillScreen = function(){
    $scope.canvasChange.push('cardMaximize');
    localStorage.isExpanded = 'true';
    $timeout( $scope.adjustCanvas , 15 );
  };
  $scope.shrinkScreen = function(){
    $scope.canvasChange.pop();
    localStorage.isExpanded = 'false';
    $timeout( $scope.adjustCanvas , 15 );
  };
  if( JSON.parse(localStorage.isExpanded) ){
    $scope.fillScreen();
  }


  // ------ Update Canvas on Run -----------------------------------------------
  $scope.drawLSystem = function(){
    // Get canvas context and end string
    $scope.isBusyDrawing = true;
    var ctx = canvas.getContext('2d') , str = iterateString();

    // Clean Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Convert Angle to Radians and get line drawing length
    var ch , angleRef = $scope.angle*(Math.PI / 180) , r = $scope.unit;
    var x = canvas.width >> 1 , y = canvas.height >> 1 , angle = 0;

    for (var i = 0; i < str.length; i++) {
      ch = str[i];
      ctx.beginPath();

      if( ch === 'F' ){           // Forward Segment
        ctx.moveTo( x , y );
        console.log(x , y );
        x = x + r*Math.cos(angle);
        y = y + r*Math.sin(angle);
        console.log(x , y );
        ctx.lineTo( x , y );
        ctx.stroke();

      }else if( ch === '+' ){     // Update Angle
        angle += angleRef;

      }else if( ch === '-' ){
        angle -= angleRef;

      }else{

      }
    }

    $scope.isBusyDrawing = false;
  };



  // ------ When the Page Loads  -----------------------------------------------
  angular.element(document).ready(function () {
      $timeout(function(){
        $scope.adjustCanvas();
      },100);
  });
});

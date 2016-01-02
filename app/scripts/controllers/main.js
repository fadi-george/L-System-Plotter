'use strict';
var app = angular.module('lSystemApp', ['ngMaterial','ngAnimate','ngCookies','ngResource','ngRoute','ngSanitize','ui.bootstrap']);

app.controller('MainCtrl', function($scope , $timeout ,  $mdSidenav , $window ) {

  // ------- Variables -----------------------------------------------

  $scope.axiom = '';
  $scope.gRules = [{'in':'','out':''}];
  $scope.steps = 1;                           // iteration steps
  $scope.angle = '90';                        // drawing angle
  $scope.unit = 20;                           // line distance
  $scope.canvasChange = [];
  $scope.isBusyDrawing = false;
  $scope.lString = '';

  var browserWindow = angular.element($window);
  var canvas = angular.element( document.querySelector( '#graphCanvas' ) )[0];
  var xmin = canvas.width, xmax = 0, ymin = canvas.height, ymax = 0 , ready = false;

  // Save in case of Refresh
  if( localStorage.axiom ){
    $scope.axiom = localStorage.axiom;
  }
  if( localStorage.steps ){
    $scope.steps = parseInt(localStorage.steps);
  }
  if( localStorage.angle ){
    $scope.angle = localStorage.angle;
  }
  if( localStorage.imgData ){
    var img = new Image();
    img.src = localStorage.imgData;
    $timeout( function(){
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } , 100);
  }
  if( localStorage.gRules ){
    var arr = JSON.parse( localStorage.gRules );
    $scope.gRules = arr;
  }

  $scope.updateAxiom = function(){
    localStorage.axiom = $scope.axiom;
    $scope.lString = '';
  };
  $scope.updateSteps= function(){
    localStorage.steps = $scope.steps;
    $scope.lString = '';
  };
  $scope.updateAngle = function(){
    localStorage.angle = $scope.angle;
    $scope.lString = '';
  };
  $scope.updateRules = function(){
    var str = angular.toJson($scope.gRules);
    $scope.validateRules();
    $scope.lString = '';
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

  // Take axiom and perform replacement operations for each rule
  function iterateString(){
    var newStr , cnt , ch , prev = $scope.axiom;
    // Iterate on number of steps
    for (var i = 0; i < $scope.steps; i++) {

      newStr = '';
      for(var j = 0; j < prev.length; j++ ){

        ch = prev[j];
        cnt = 1;
        for (var idx in $scope.gRules) {
          var rule = $scope.gRules[idx];
          if( rule.in === ch ){
            newStr += rule.out;
            cnt = 0;
          }
        }
        if(cnt){
          newStr+= ch;
        }
      }

      prev = newStr;
      if( prev.length > 120000000 ){
        return 'longString';
      }
    }
    return newStr;
  }

  //
  // function getClosingBracket( ch ){
  //   if( ch ===)
  // };

  // Redraw if resolution of canvas changed
  $scope.adjustCanvas = function(){
    var w = angular.element( document.querySelector( '#graphCard' ) )[0].clientWidth;
    var h = angular.element( document.querySelector( '#graphCard' ) )[0].clientHeight;
    canvas.width = w - 16;
    canvas.height = h - 16;
    $scope.drawLSystem();
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
    },
    function () {
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
  if( localStorage.isExpanded && JSON.parse(localStorage.isExpanded) ){
    $scope.fillScreen();
  }


  // ------ Update Canvas on Run -----------------------------------------------

  function getBoundary( str ){
    var ch , r = $scope.unit , x = 0 , y = 0;
    xmin = 0; ymin = 0; xmax = 0; ymax = 0;
    var angleRef = $scope.angle*(Math.PI / 180) , angle = 0;
    for (var i = 0; i < str.length; i++) {
      ch = str[i];

      if( ch === 'F' ){           // Forward Segment
        x = x + r*Math.cos(angle);
        y = y + r*Math.sin(angle);
        xmin = Math.min(x,xmin);
        xmax = Math.max(x,xmax);
        ymin = Math.min(y,ymin);
        ymax = Math.max(y,ymax);

      }else if( ch === '+' ){     // Update Angle
        angle += angleRef;

      }else if( ch === '-' ){
        angle -= angleRef;

      }else if( ch === '[' ){     // Recursive Call

      }else{

      }
    }
  }

  function drawString( str , xStart , yStart , scaleFactor , rotation ){
    var ctx = canvas.getContext('2d');
    ctx.translate( xStart , yStart );
    ctx.scale( scaleFactor , scaleFactor);
    ctx.translate( -xStart , -yStart );

    ctx.lineWidth=10;

    var ch , angleRef = $scope.angle*(Math.PI / 180) , r = $scope.unit;
    var x = xStart , y = yStart, angle = 0;

    for (var i = 0; i < str.length; i++) {
      ch = str[i];
      ctx.beginPath();

      if( ch === 'F' ){           // Forward Segment
        ctx.moveTo( x , y );
        x = x + r*Math.cos(angle);
        y = y + r*Math.sin(angle);
        ctx.lineTo( x , y );
        ctx.lineCap = 'round';
        ctx.stroke();

      }else if( ch === '+' ){     // Update Angle
        angle += angleRef;

      }else if( ch === '-' ){
        angle -= angleRef;

      }else if( ch === '[' ){     // Recursive Call

      }else{

      }
    }
  }

  function fitToCanvas( xmin , xmax , ymin , ymax , str ){
    var ctx = canvas.getContext('2d');
    var xdis = xmax - xmin;
    var ydis = ymax - ymin;
    var w = canvas.width*0.7, h = canvas.height*0.7 , zoom , rotation = 0;

    if( w/xdis > h/ydis ){
      zoom = h/ydis ;
    }else{
      zoom = w/xdis;
    }
    if( ydis > xdis ){
      rotation = Math.PI;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawString( str , canvas.width/2 - (xmin + xdis/2)*zoom , canvas.height/2 - (ymin + ydis/2)*zoom , zoom , rotation );
  }

  $scope.drawLSystem = function( ){
    // Get canvas context and end string
    $scope.isBusyDrawing = true;

    var ctx = canvas.getContext('2d') , str;

    if( $scope.lString  ){
      str = $scope.lString;
    }else{
      str = iterateString();
      $scope.lString = str;
    }
    if( str === 'longString' || str === '' || !ready ){
      $scope.isBusyDrawing = false;
      return;
    }

    console.log(str);
    // Reset Transform
    ctx.setTransform(1,0,0,1,0,0);

    // Clean Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    getBoundary( str );

    fitToCanvas( xmin , xmax , ymin , ymax , str );
    localStorage.imgData = canvas.toDataURL();
    $scope.isBusyDrawing = false;
  };



  // ------ Graph Tools  -----------------------------------------------






  // ------ When the Page Loads  -----------------------------------------------
  angular.element(document).ready(function () {
      $timeout(function(){
        $scope.adjustCanvas();
        ready = true;
      },100);
  });
});

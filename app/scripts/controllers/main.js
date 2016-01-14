'use strict';
var app = angular.module('lSystemApp', ['ngMaterial','ngAnimate','ngCookies','ngResource','ngRoute','ngSanitize','ui.bootstrap']);

app.controller('MainCtrl', function( $scope , $timeout ,  $mdSidenav , $mdToast , $window ) {

  // ------- Variables -----------------------------------------------

  $scope.axiom = '';                          // axiom
  $scope.gRules = [{'in':'','out':''}];       // replacement rules
  $scope.steps = 1;                           // iteration steps
  $scope.angle = '90';                        // drawing angle
  $scope.unit = 20;                           // line distance
  $scope.canvasChange = [];                   // for shrinking and expanding canvas
  $scope.isBusyDrawing = false;               // don't draw till page loads
  $scope.lString = '';                        // keep string till new inputs
  $scope.mouseDown = false;                   // keep track of mouse

  $scope.canvasMode = 0;                      // canvas options (zooming / panning)
  /* 0 for nothing selected,
     1 for panning ,
     2 for zooming in,
     3 for zooming out
 */

  var browserWindow = angular.element($window),
      canvas = angular.element( document.querySelector( '#graphCanvas' ) )[0],
      canvasElement = angular.element( document.querySelector( '#graphCanvas' ) );

  var xmin = canvas.width, xmax = 0, ymin = canvas.height, ymax = 0 ,
      ctx = canvas.getContext('2d') , ready = false,
      clickStartX , clickStartY , newX , newY , dx , dy ,
      panStartX , panStartY , midX , midY ,
      scaleFactor = 1 , rotation , rotationCount = 0 , zoomCount = 0;

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

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      $scope.drawLSystem();
    } , 350);
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
    var newStr , cnt , ch , prev = $scope.axiom ,
        timeStart = window.performance.now() , warnFlag = true;

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
      if( prev.length > 10000000 ){
        return 'longString';
      }
    }
    return newStr;
  }

  // Find first matching end bracket/paranthesis
  function getClosingBracket( idx , str , endCh ){
    var ch = str[idx] , nest = 0;

    for( var i = idx+1; i < str.length ; i++ ){
      if( str[i] === ch ){                          //  starting },], or )
        nest++;                                     //  avoid nest traps
      }
      if( str[i] === endCh ){              // Found matching closing },],)
        if( nest === 0 ){
          return i;
        }else{
          nest--;
        }
      }
    }
  }

  // Redraw if resolution of canvas changed
  $scope.adjustCanvas = function(){
    var w = angular.element( document.querySelector( '#graphCard' ) )[0].clientWidth;
    var h = angular.element( document.querySelector( '#graphCard' ) )[0].clientHeight;
    canvas.width = w - 16;
    canvas.height = h - 16;
    if( canvas.width < 0 ){
      $scope.adjustCanvas();
    }else{
      $scope.drawLSystem();
    }
  };

  // Clear Canvas
  $scope.canvasClear = function(){
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
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

  function getBoundary( str  , xStart , yStart , angleIn ){

    var ch , r = $scope.unit , x = xStart , y = yStart,
        angleRef = $scope.angle*(Math.PI / 180) ,
       angle = angleIn , minX , minY , maxX , maxY;                  // Local Displacment Changes

    for (var i = 0; i < str.length; i++) {
      ch = str[i];

      if( ch === 'F' || ch === 'G' ){                  // Move Forward
        x = x + (r*Math.cos(angle));
        y = y + (r*Math.sin(angle));
        xmin = Math.min(x,xmin);
        xmax = Math.max(x,xmax);
        ymin = Math.min(y,ymin);
        ymax = Math.max(y,ymax);

      }else if( ch === '+' ){              // Update Angle
        angle += angleRef;

      }else if( ch === '-' ){
        angle -= angleRef;

      }else if( ch === '[' ){                 // Recursive Call
        var k = getClosingBracket( i , str , ']' );
        getBoundary( str.substring(i+1, k) , x , y , angle );
        i = k;

      }else{

      }
    }
  }

  function drawString( str , xStart , yStart , startingAngle ){

    ctx.lineWidth = 2;
    var ch , angleRef = $scope.angle*(Math.PI / 180) , r = $scope.unit;
    var x = xStart , y = yStart, angle = startingAngle;

    for (var i = 0; i < str.length; i++) {
      ch = str[i];
      ctx.beginPath();

      if( ch === 'F' ){                    // Forward Segment
        ctx.moveTo( x , y );
        x = x + r*Math.cos(angle);
        y = y + r*Math.sin(angle);
        ctx.lineTo( x , y );
        ctx.lineCap = 'round';
        ctx.stroke();

      }else if( ch === 'G' ){              // Move Forward but Dont Draw
        x = x + r*Math.cos(angle);
        y = y + r*Math.sin(angle);

      }else if( ch === '+' ){              // Update Angle
        angle += angleRef;

      }else if( ch === '-' ){
        angle -= angleRef;

      }else if( ch === '[' ){                                  // Recursive Call
        var k = getClosingBracket( i , str , ']' );
        drawString( str.substring(i+1, k) , x , y , angle );
        i = k;

      }else{

      }
    }
  }

  function fitToCanvas( xmin , xmax , ymin , ymax , str ){
    var xdis = xmax - xmin,
        ydis = ymax - ymin,
        w = canvas.width*0.7, h = canvas.height*0.7;

    if( w/xdis > h/ydis ){
      scaleFactor = h/ydis ;
    }else{
      scaleFactor = w/xdis;
    }
    if( ydis > xdis ){
      rotation = -Math.PI/2;
    }else {
      rotation = 0;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var xStart = canvas.width/2 - (xmin + xdis/2)*scaleFactor ,
        yStart = canvas.height/2 - (ymin + ydis/2)*scaleFactor;

    panStartX = xStart;
    panStartY = yStart;

    // Center the piece and perform scaling
    ctx.translate( xStart , yStart );
        ctx.scale( scaleFactor , scaleFactor );
    ctx.translate( -xStart , -yStart );

    midX = xStart + (canvas.width/2 - xStart)/scaleFactor;
    midY = yStart + (canvas.height/2 - yStart)/scaleFactor;

    // Get to center of piece after scaling and perform rotation
    ctx.translate( midX , midY );
        ctx.rotate(rotation);
    ctx.translate( -midX  , -midY );
    console.log(xStart,yStart);
    drawString( str , xStart , yStart , 0 );
  }

  $scope.drawLSystem = function( ){
    // Get canvas context and end string
    if( !ready ){
      return;
    }
    $scope.isBusyDrawing = true;

    var str;
    scaleFactor = 1; rotation = 0; rotationCount = 0;

    if( $scope.lString  ){
      str = $scope.lString;
    }else{
      str = iterateString();
      $scope.lString = str;
    }
    if( str === 'longString'){
      $mdToast.show(
        $mdToast.simple()
          .textContent('String is too large to draw.')
          .position('top right')
          .action('OK')
          .hideDelay(10000)
          .parent(angular.element( document.querySelector( '#cardWrapper' ))[0])
      );

      $scope.isBusyDrawing = false;
      return;
    }

    // Reset Transform
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle='#FFFFFF';
    ctx.rect(0,0,canvas.width,canvas.height);

    // Clean Canvas
    xmin = 0; ymin = 0; xmax = 0; ymax = 0;
    getBoundary( str , 0 , 0 , 0 );

    fitToCanvas( xmin , xmax , ymin , ymax , str );
    localStorage.imgData = canvas.toDataURL();
    $scope.isBusyDrawing = false;
  };


  // ------ Graph Tools  -----------------------------------------------

  $scope.canvasMouseDown = function( $event ){
    clickStartX = $event.offsetX/scaleFactor;
    clickStartY = $event.offsetY/scaleFactor;
    $scope.mouseDown = true;
    var scale;

    if( $scope.canvasMode === 2 ){
      scale = 1.2;
      zoomCount++;

    }else if( $scope.canvasMode === 3 ){
      scale = 1/1.2;
      zoomCount--;
    }
    if(  $scope.canvasMode > 1 ){
      scaleFactor = scaleFactor*scale;
      clickStartX = ($event.offsetX - canvas.width/2);
      clickStartY = ($event.offsetY - canvas.height/2);
      // console.log(clickStartX  , clickStartY , midX , midY , panStartX , panStartY);
      newX = midX + clickStartX/scaleFactor;
      newY = midY + clickStartY/scaleFactor;

      ctx.translate(  newX ,  newY );
        ctx.scale(scale,scale);
      ctx.translate( -newX , -newY );

      $scope.canvasClear();
      drawString( $scope.lString , panStartX ,
                  panStartY , 0 );
    }
  };

  $scope.canvasMouseMove = function( $event ){


    if( $scope.mouseDown ){

      if( $scope.canvasMode === 1 ){

        newX = $event.offsetX/scaleFactor;
        newY = $event.offsetY/scaleFactor;

        dx = newX - clickStartX;
        dy = newY - clickStartY;

        // Adjust for rotation and account for negative angles
        var temp = dx;
        if( rotation < 0 ){
          dx = (dx*Math.cos(rotation))+(dy*Math.sin(rotation));
          dy = (dy*Math.cos(rotation))-(temp*Math.sin(rotation));
        }else{
          dx = (dx*Math.cos(-rotation))-(dy*Math.sin(-rotation));
          dy = (dy*Math.cos(-rotation))+(temp*Math.sin(-rotation));
        }

        $scope.canvasClear();
        drawString( $scope.lString , panStartX + dx , panStartY + dy, 0 );
      }

    }
  };

  // Mouse click/hold over
  $scope.canvasMouseUp = function( $event ){
     $scope.mouseDown = false;
     if( $scope.canvasMode === 1 ){
       panStartX = panStartX + dx;
       panStartY = panStartY + dy;
       midX = panStartX + (canvas.width/2 - panStartX)/scaleFactor;
       midY = panStartY + (canvas.height/2 - panStartY)/scaleFactor;
     }
     clickStartX = clickStartY = -1;
  };

  $scope.canvasMouseLeave = function(  ){
    //  $scope.canvasMode = 0;
  };

  // Rotate in 45 degree increments
  $scope.canvasRotate = function( dir ){
    var angle;
    if( dir === 'r' ){
      angle = Math.PI/4;
    }else{
      angle = -Math.PI/4;
    }
    rotation = rotation + angle;
    // newX = (panStartX*Math.cos(-rotation))-(panStartY*Math.sin(-rotation));
    // newY = (panStartY*Math.cos(-rotation))+(panStartX*Math.sin(-rotation));

    ctx.translate( midX , midY );
        ctx.rotate(angle);
    ctx.translate( -midX  , -midY );
    $scope.canvasClear();
    drawString( $scope.lString , panStartX, panStartY , 0 );
  };

  // Download Image of Canvas
  $scope.downloadImg = function(){
    var link = angular.element( document.querySelector( '#hiddenLink' ) )[0];
    console.log(link);
    link.href = canvas.toDataURL();
    link.click();
  };

  // ------ When the Page Loads  -----------------------------------------------
  angular.element(document).ready(function () {
      $timeout(function(){
        $scope.adjustCanvas();
        ready = true;
      },100);
  });
});

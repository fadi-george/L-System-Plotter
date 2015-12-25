
'use strict';

angular.module('lSystemApp', []).controller('MainCtrl', function($scope , $window) {


  var w = angular.element($window);
  console.log(w);
  // w.resize(function(){
  //     var h = w.innerHeight();
  //     var myEl = angular.element( document.querySelector( 'graphInput' ) );
  // });

});

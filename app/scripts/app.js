'use strict';

angular
  .module('lSystemApp', [])
  .config(function ($routeProvider) {
    $routeProvider
      .otherwise({
        redirectTo: '/'
      });
  });

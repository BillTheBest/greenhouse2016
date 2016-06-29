(function () {
  'use strict';

  angular.module('app', ['ionic', 'firebase', 'app.controllers', 'app.factories', 'app.services', 'app.directives'])

  .run(function ($ionicPlatform, $ionicConfig, $rootScope, $state, FirebaseService) {
    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }

      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });

    $ionicConfig.views.maxCache(0);

    $rootScope.logOut = function () {
      FirebaseService.logout();
      $rootScope.currentAccount = null;
      $state.transitionTo('auth');
    };
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    var resolveCurrentAccount = {
      currentAccount: function ($rootScope, FirebaseService) {
        return FirebaseService.getAuth().then(function (account) {
          $rootScope.currentAccount = account ? account : null;
        });
      }
    };

    $stateProvider
      .state('auth', {
        url: '/auth',
        templateUrl: 'views/auth.html',
        controller: 'AuthCtrl'
      })
      .state('dashboard', {
        url: '/dashboard',
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl',
        resolve: resolveCurrentAccount
      });

    $urlRouterProvider.otherwise('/auth');
  });
})();

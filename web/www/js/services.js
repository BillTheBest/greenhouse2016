(function () {
  'use strict';

  angular.module('app.services', [])

  .service('FirebaseService', function ($rootScope, $firebaseAuth, $firebaseObject, $firebaseArray) {
    var rootRef = new Firebase('yourfirebase');
    var firebaseAuth = $firebaseAuth(rootRef);
      
    // authentication
    this.authenticate = function (accountId) {
      accountId = parseInt(accountId).toString();

      return firebaseAuth.$authWithPassword({
        email: accountId,
        password: accountId
      });
    };

    this.getAuth = function () {
      return firebaseAuth.$waitForAuth();
    };

    this.logout = function () {
      firebaseAuth.$unauth();
    };
      
    this.addTemperature = function(temp) {
        temps.$add({
            temperature: temp,
            time: Firebase.ServerValue.TIMESTAMP});
    };
      
    this.getBrightnesses = function () {
        return $firebaseArray(rootRef.child('brightnesses').limitToLast(10));
    };
      
    this.getBrightnessesRef = function () {
      return rootRef.child('brightnesses');
    };

    this.getTemperatures = function () {
        return $firebaseArray(rootRef.child('temperatures').limitToLast(10));
    };
      
      
    this.getTemperaturesRef = function () {
      return rootRef.child('temperatures');
    };
      
    this.getMoistures = function () {
        return $firebaseArray(rootRef.child('moistures').limitToLast(10));
    };
      
      
    this.getMoisturesRef = function () {
        return rootRef.child('moistures');
    };
      
    this.getAlertsRef = function () {
      return rootRef.child('alarms');
    };
      
      
    this.getTemperatureAlert = function () {
        return $firebaseObject(rootRef.child('alarms').child('temperature'));
    };
                              
    this.updateAlertStatus = function(id, data) {
        return rootRef.child('alarms').child('temperature').update(data);
    };
      
    this.getMoistureAlert = function () {
        return $firebaseObject(rootRef.child('alarms').child('moisture'));
    };
      
    this.updateMoistureAlertStatus = function(id, data) {
        return rootRef.child('alarms').child('moisture').update(data);
    };
  });  
})();

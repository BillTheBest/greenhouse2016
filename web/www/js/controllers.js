(function () {
  'use strict';

  angular.module('app.controllers', [])

  .controller('AuthCtrl', function ($rootScope, $scope, $state, FirebaseService) {
    if ($rootScope.currentAccount) {
      $state.transitionTo('dashboard');
    }

    $scope.authForm = {};
    $scope.isAuthenticating = false;
    $scope.regex = /^[0-9]{5}$/;

    $scope.didInputAccountId = function () {
      $scope.isAuthenticating = true;

      FirebaseService.authenticate($scope.authForm.accountId)
        .then(function () {
          $state.transitionTo('dashboard');
        })
        .finally(function () {
          $scope.authForm.accountId = undefined;
          $scope.isAuthenticating = false;
        });
    };
  })

  .controller('DashboardCtrl', function ($rootScope, $scope, $state, FirebaseService, DataFactory) {
    if (!$rootScope.currentAccount) {
      $state.transitionTo('auth');
    }
      
      $scope.water = {};
      $scope.water.moisture = ["",""];
      $scope.water.alarm = false;

      $scope.temps = {}; 
      $scope.temps.currentTemperature = "";
      
      $scope.temps.lowtemp = "";
      $scope.temps.hightemp = "";
      $scope.temps.brightness = "";
      $scope.temps.alarm = false;
      $scope.temps.previousTemp = ["", ""];

      
      $scope.time = "";
            
      $scope.formData = {};
      $scope.formData.newTemp = "";
      
      $scope.message = "Temperature is below ";
      
      var tempsData = [];
      var brightnessData = [];
      var moisturesData = []; 
      var fireBaseTempAlarm  = {};
     
      var tempsFromFirebase = FirebaseService.getTemperatures();      
      var tempRef = FirebaseService.getTemperaturesRef();
      
      var brightnessesFromFirebase = FirebaseService.getBrightnesses();      
      var brightnessesRef = FirebaseService.getBrightnessesRef();
      
      var moisturesFromFirebase = FirebaseService.getMoistures();      
      var moisturesRef = FirebaseService.getMoisturesRef();
      
      var alertRef = FirebaseService.getAlertsRef();
      var tempsAlertFromfirebase = FirebaseService.getTemperatureAlert();
      var moistAlertFromFirebase = FirebaseService.getMoistureAlert();
      
      $scope.$watch('temps.currentTemperature', function(newValue, oldValue) {
      }, true);
      
      $scope.$watch('temps.hightemp', function(newValue, oldValue) {
          if ($scope.temps.hightemp != null && $scope.temps.hightemp > 0) {
              tempsAlertFromfirebase.hightemp = $scope.temps.hightemp;
              tempsAlertFromfirebase.$save();
          } 
      }, true);
      
      $scope.$watch('temps.lowtemp', function(newValue, oldValue) {
          if ($scope.temps.lowtemp > 0) {
              tempsAlertFromfirebase.lowtemp = $scope.temps.lowtemp;
              tempsAlertFromfirebase.$save();
          } 
      }, true);
      
      $scope.$watch('temps.alarm', function(newValue, oldValue) {
          if ($scope.temps.lowtemp > 0 && $scope.temps.hightemp > 0) {
              tempsAlertFromfirebase.alarm = newValue; 
              tempsAlertFromfirebase.$save();
          } 
      });
      
      $scope.$watch('water.alarm', function(newValue, oldValue) {
          if ($scope.water.lowlimit > 0) {
              moistAlertFromFirebase.alarm = newValue; 
              moistAlertFromFirebase.$save();
          } 
      });
      
      $scope.$watch('water.lowlimit', function(newValue, oldValue) {
          if ($scope.water.lowlimit > 0) {
              moistAlertFromFirebase.lowlimit = $scope.water.lowlimit;
              moistAlertFromFirebase.$save();
          } 
      }, true);
      
      alertRef.on('value', function(){
          tempsAlertFromfirebase.$loaded().then(function(){
              $scope.temps.alarm = tempsAlertFromfirebase.alarm; 
              $scope.temps.lowtemp = tempsAlertFromfirebase.lowtemp; 
              $scope.temps.hightemp = tempsAlertFromfirebase.hightemp;   
          }); 
          moistAlertFromFirebase.$loaded().then(function(){
              $scope.water.alarm = moistAlertFromFirebase.alarm;
              $scope.water.lowlimit = moistAlertFromFirebase.lowlimit;
          });
      });
      
      tempRef.on('value', function(){
          console.log("temp value");
          tempsFromFirebase.$loaded().then(function(){
              $scope.temperatures = tempsFromFirebase; 
              
              if (tempsData.length == 0) {
                  angular.forEach(tempsFromFirebase, function(value, key) {
                      tempsData.push({x:value.time, y:value.temperature});
                  });
              } else {
                  var latest = tempsFromFirebase[tempsFromFirebase.length-1];
                  tempsData.push({x:latest.time, y:latest.temperature});

              } 
              
              if (tempsData.length > 1) {
                $scope.temps.previousTemp = [tempsData[tempsData.length -2].y, tempsData[tempsData.length -1].y];
              }
              $scope.temps.currentTemperature = tempsData[tempsData.length -1].y;
              $scope.time = tempsData[tempsData.length -1].x;
//              updateChartData();
          });      
      });
      
      // quick and dirty adjustment for displayed zero light level depending on the sensor used. 
      var brightCutThreshold = 470;
      brightnessesRef.on('value', function(){
          
          var brightnessesFromFirebase = FirebaseService.getBrightnesses();      
          brightnessesFromFirebase.$loaded().then(function(){    
              console.log("loaded");
              if (brightnessData.length == 0) {   
                  angular.forEach(brightnessesFromFirebase, function(value, key) {       
                      
                      if (value.brightness < brightCutThreshold){
                          brightnessData.push({x:value.time, y:0});
                      } else {
                      brightnessData.push({x:value.time, y:Math.round((value.brightness-tempCutThreshold)/(1018-tempCutThreshold)*100)});    
                      }
                  });
              } else {
                  var latest = brightnessesFromFirebase[brightnessesFromFirebase.length-1];
                  if (latest.brightness < brightCutThreshold){
                      brightnessData.push({x:latest.time, y:0});
                  } else  {
                    brightnessData.push({x:latest.time, y:Math.round((latest.brightness-tempCutThreshold)/(1018-tempCutThreshold)*100)});    
                  }
//                  brightnessData.push({x:latest.time, y:Math.round(latest.brightness/1014*100)});
              }
              
              $scope.temps.brightness = brightnessData[brightnessData.length -1].y;
              console.log(brightnessData);
              
              if (brightnessData.length > 1) {
                    $scope.temps.previousBrightness = brightnessData[brightnessData.length -2].y
              }
              
              
//              updateChartData();
          });      
      });
      
      moisturesRef.on('value', function(){
          var moisturesFromFirebase = FirebaseService.getMoistures();      

          moisturesFromFirebase.$loaded().then(function(){
              if (moisturesData.length == 0) {
                  angular.forEach(moisturesFromFirebase, function(value, key) {
                      moisturesData.push({x:value.time, y:value.moisture});
                  });
              } else {
                  var latest = moisturesFromFirebase[moisturesFromFirebase.length-1];
                  moisturesData.push({x:latest.time, y:latest.moisture});
              }          
              $scope.water.moisture[0] = moisturesData[moisturesData.length -1].y;
              $scope.water.moisture[1] = moisturesData[moisturesData.length -2].y;
              
          });      
      });

      
      //
//      var updateChartData = function (){  
//          
//          return [{
//              values: tempsData,
//              key: 'Temperature',
//              color: '#f4d477',
//              strokeWidth: 3.5,     
//          }, {
//              values: brightnessData,
//              key: 'Brightness',
//              color: '#d33d52',
//              strokeWidth: 3.5,   
//          }, {
//              values: moisturesData,   
//              key: 'Moisture',
//              color: '#0000aa',
//              strokeWidth: 3.5,   
//            }];
//      };
//
//      var x = d3.time.scale()
//        .range([0, 300]);
//      
//      //D3 Part
//       $scope.options = {
//            chart: {
//                type: 'lineChart',
//                height: 250,
//                margin : {
//                    top: 20,
//                    right: 20,
//                    bottom: 40,
//                    left: 55
//                },
////                interactive: false,                
//                x: function(d){ return d.x; },
//                y: function(d){ return d.y; },
////                useInteractiveGuideline:true,
//                transitionDuration:350,  
//
//                dispatch: {
//                    stateChange: function(e){ console.log("stateChange"); },
//                    changeState: function(e){ console.log("changeState"); },
//                    tooltipShow: function(e){ console.log("tooltipShow"); },
//                    tooltipHide: function(e){ console.log("tooltipHide"); }
//                },
//                xAxis: {
//                    ticks: 5,
////                    scale: x, 
//                    tickFormat: function(d) { 
//                        return d3.time.format('%H:%M')(new Date(d))},   
//                    axisLabel: ''
//                },
//                yAxis: {
//                    axisLabel: '',
//                    tickFormat: function(d){
//                        return d3.format('.0f')(d);
//                    },
//                    axisLabelDistance: -10
//                },               
//                callback: function(chart){
//                }
//      
//    
//
//    },
//            title: {
//                enable: false,
//                text: 'Title for Line Chart'
//            },
//            subtitle: {
//                enable: false,
//                text: 'test',
//                css: {
//                    'text-align': 'center',
//                    'margin': '10px 13px 0px 7px'
//                }
//            },
//            caption: {
//                enable: false,
//                html: '<strong>Tämä on kuvaus</strong>',
//                css: {
//                    'text-align': 'justify',
//                    'margin': '10px 13px 0px 7px'
//                }
//            }
//        };
//
//      
//    $scope.data = updateChartData();
  });
})();

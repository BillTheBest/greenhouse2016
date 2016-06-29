
var Firebase = require('firebase');
var rootRef = new Firebase('https://greenmonitor.firebaseio.com/');
var five = require("johnny-five");  

var beanio = require("bean-io");
var boardIO = new beanio.Board();

rootRef.authWithPassword({
    email: 'emailforauthentiaction...',
    password: 'yourpassword.....'
    },function (error, authData) {
        if (error) {
        console.log('Login Failed!', error);
    } else {
        console.log('Authenticated successfully!');
        setupFirebaseListeners();
    }
});


var mailer = require('nodemailer');
var transporter = mailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'yourmail',
        pass: 'yourpasswd'
    },
    logger: false, // log to console
    debug: false // include SMTP traffic in the logs
    }, {
    // default message fields

    // sender info
    from: 'Greenhouse Monitor <sender@example.com>',
    headers: {
        //'X-Laziness-level': 1000 // just an example header, no need to use this
    }
});

console.log('SMTP Configured');

// Message object
var message = function(mailSubject, mailText )
{
    var mes =  {
        // Comma separated list of recipients
        to: '"Name" <email>',
        // Subject of the message
        subject: mailSubject, 
        // plaintext body
        text: mailText
    }
    return mes;
};

console.log('Sending Mail');

var processMail = function (subject, text) {
    transporter.sendMail(message(subject, text), function (error, info) {
        if (error) {
            console.log('Error occurred');
            console.log(error.message);
            return;
        }
        console.log('Message sent successfully!');
        console.log('Server responded with "%s"', info.response);
    });
}


var currentTemp = "";
var currentMoisture = "";
var activeTempAlarm = null;
      
var sendTemperatureToFirebase = function (key, value){
    rootRef.child(key).push({
            temperature: value,
            time: Firebase.ServerValue.TIMESTAMP});
};

var sendBrightnessToFirebase = function (key, value){
    rootRef.child(key).push({
            brightness: value,
            time: Firebase.ServerValue.TIMESTAMP});
};

var sendSoilMoistureToFirebase = function (key, value){
    rootRef.child(key).push({
            moisture: value,
            time: Firebase.ServerValue.TIMESTAMP});
};

var setupFirebaseListeners = function () {
    console.log("firebaseListener");
  this.updateAlarm = function (snapshot) {
                  
    var ref = snapshot.ref();
    var data = snapshot.val();
        activeTempAlarm = {
            ref: ref,
            data: data
        };
  
        activeMoistAlarm = {
            ref: ref,
            data: data
        };        
  };
  rootRef.child('alarms').on('value', this.updateAlarm); 
};

var authData = rootRef.getAuth();

if (authData) {
    console.log('Setting FireBase listeners');
    setupFirebaseListeners();
  }


var board = new five.Board({
  io: boardIO
});

var freq = 1000 * 60 * 60 * 1;  //ms * seconds per minute * minutes * hours

board.on('ready', function() {
  console.log('Arduino connected');
    
    soilSensor = new five.Sensor({
        // BEAN A0
        pin: "4",
        freq: freq 
    });
    
    photoresistor = new five.Sensor({
        // BEAN A1
        pin: "5",
        freq: freq 
    });
//    
    photoresistor.on("data", function() {
        console.log("light:" + this.value);
        boardIO.connectedBean.requestTemp();

        if (this.value) {
            sendBrightnessToFirebase("brightnesses", this.value);
        }       
    });
      
    soilSensor.on("data", function() {
        console.log("soil:" + this.value);
//        quick and dirty mapping to worn out sensor
        var moistureValue = Math.round(this.scaleTo([0, 100]) * 1,7);
        if (this.value) {
            sendSoilMoistureToFirebase("moistures", moistureValue);
        }
        
        if (typeof activeMoistAlarm != 'undefined' && activeMoistAlarm != null) {
            if (activeMoistAlarm.data.moisture.alarm == true && moistureValue > 0
                && activeMoistAlarm.data.moisture.lowlimit > moistureValue){
                    processMail("Greenhouse: Dry soil Alert", "Moisture of the soil "
                                + moistureValue + "% is below the threshold value "
                                + activeMoistAlarm.data.moisture.lowlimit +  "%." )
                    }
        }
    });
    
    boardIO.connectedBean.on("temp", function(temp, valid){
        var status = valid ? "valid" : "invalid";
        if (status == "valid") {
            if (typeof activeTempAlarm != 'undefined' && activeTempAlarm != null) {
                if (activeTempAlarm.data.temperature.alarm == true && activeTempAlarm.data.temperature.lowtemp > temp){
                    processMail("Greenhouse: Low Temperature Alert", "Temperature "
                                + temp + " °C is below the threshold "
                                + activeTempAlarm.data.temperature.lowtemp +  "°C." )
                }
            
            if (activeTempAlarm.data.temperature.alarm == true && activeTempAlarm.data.temperature.hightemp < temp){
                processMail("Greenhouse: High Temperature Alert", "Temperature "
                            + temp +" °C is over the threshold  "
                            + activeTempAlarm.data.temperature.hightemp +  "°C."  );        
                }
            }

            currentTemp = temp;
            sendTemperatureToFirebase("temperatures", temp);    
        }
    });   
});

console.log('Waiting for connection');



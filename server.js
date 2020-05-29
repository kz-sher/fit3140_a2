var http=require('http')
            , admin = require("firebase-admin")
            , fs = require('fs')
            , path =require('path')
            , express = require('express')
            , app = express()
            , MotionList = require('./public/helper.js')
            , socket=require('socket.io'); //adding the socket in order for client and server emit and receive observations

// Fetch the service account key JSON file contents
var serviceAccount = require("./serviceAccountKey.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
                        credential : admin.credential.cert(serviceAccount),
                        databaseURL: "https://fit3140-assignment2-680aa.firebaseio.com"  // IMPORTANT: repalce the url with yours
                    });

// Join path from server to public folder:
app.use(express.static(path.join(__dirname, 'public')));

// Creating the server:
var server=http.createServer(app).listen(1997, function() {
    console.log("Listening at: http://localhost:1997")
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db  = admin.database();
var ref;

//GET DATA FROM SENSOR
var MotionDecider; //create new object to use MotionList class
var isInitialDataLoaded = false;
var b = require('bonescript');
var led = "P8_13"; //location of my LED bulb
var state=0; //this is to show the state of the LED, 0 means off, 1 means on
var timer; //global timer variable
b.pinMode(led,'out');
b.pinMode('P8_19',b.INPUT);

var sensorInterval;
setTimeout(function(){ sensorInterval = setInterval(checkPIR,1000);}, 3000) // PIR motion sensor will check for movement every second, the initial will delay for around 3 seconds, this is due to latency issues
var sensor_bool = true;
var startTime;

create_channel();
// A channel will be created. Channel referred to is channel 1. It's children will store the number of Long Motions, Short Motions and Visitors
// dummyData acts as a test data for
function create_channel(){
    ref = db.ref("1");
    ref.off("value");
    ref.on("value", function (snapshot) {       //this callback will be invoked with each new object
	if(snapshot.val() != null && isInitialDataLoaded == false){
            MotionDecider=new MotionList(snapshot.val().long,snapshot.val().short,snapshot.val().visitor);
            isInitialDataLoaded=true;
	}
	console.log(snapshot.val());            // How to retrive the new added object
    }, function (errorObject) {                 // if error
        console.log("The read failed: " + errorObject.code);
    });

    ref.push({
   	 dummyData: "Load Data Use"
    })

}
// External LED will light up.
// It will check for the current state, if the external LED is turned off, the timer for the LED will be cleared to allow the LED to light up when the state changes.
// The external LED has to register the current time it was turn on, this is to allow the extension of the timer.
function toggleLED(){
	if(state==1){s
	  console.log("LED Off");
	  clearTimeout(timer);
	}
	else{
	  console.log("LED On");
	}
    state=(state==1)?0:1;
    b.digitalWrite(led,state);
    startTime=Date.now();
}

// This starts the motion sensor at the pin P8_19
function checkPIR(){
    //the function where my motion sensor will work to detect any movements whatsoever, supposedly timer is set at 1 second per interval
    b.digitalRead('P8_19',checkforMotion);}

// This motion sensor will first detect for any motion
// Motion sensor will emit two types of signals, HI and LO. It will add the respective signal into the class function
// The class function will decide does it fulfill LSLL
function checkforMotion(x){
    if(x.value===0){
        //motion emits LO
        MotionDecider.add('L');
	console.log('Motion Detected');
        dataPush(MotionDecider.getLongMotionNum(),MotionDecider.getShortMotionNum(),MotionDecider.getVisitorNum());

        if(MotionDecider.getPotentialVisitor()==true && state==0){ // if LSLL is fulfilled
            console.log('A visitor detected');
            toggleLED()
            timer = setTimeout(toggleLED, 15000); //my LED will light on for the first 15 seconds
        }else if(MotionDecider.getPotentialVisitor()==true && state==1){ // if another LSLL is fulfilled during the 15 second time period
            console.log('A new visitor detected');
            clearTimeout(timer);
            var newTime = (startTime+20000) - Date.now(); //date.now is the current time when motion decider is called.
            timer = setTimeout(toggleLED, newTime);
            startTime+5000; //increment 5 seconds
        }
    }else{
        //motion emits HI
        MotionDecider.add('H');
        console.log('No Motion Detected');
        dataPush(MotionDecider.getLongMotionNum(),MotionDecider.getShortMotionNum(),MotionDecider.getVisitorNum());
	}
}

// This stores the data on the Google Firebase.
// Use .update instead of .push to enable data being continuosly updated.
function dataPush(long,short,visitor){
    ref.update({
        long : long,
        short : short,
        visitor: visitor
    });
}

//Socket receive command
socket.listen(server).on('connection', function (socket) {
    	// Client manually turns on/off external LED
    socket.on('LED',function(){
        toggleLED()
    });
	// Client manually turns on/off motion sensor
    socket.on('sensor',function(){
        if(sensor_bool==true){
	    console.log("Sensor Off")
            sensor_bool=false
            clearInterval(sensorInterval);
        }else{
	    console.log("Sensor On")
            sensor_bool=true;
            sensorInterval = setInterval(checkPIR,1000);}
    });
	// Client manually resets the Google Firebase channel
    socket.on('reset',function(){
	console.log("Database Reset")
        ref.remove();
        create_channel();
	MotionDecider.reset();
    });
});

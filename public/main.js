function TrafficAnalyser(){
    this.checkSetup();
    
    // Link sections from index.html
    this.socket=io.connect();
    this.longMsgNum=document.getElementById("longMsgNum");
    this.shortMsgNum=document.getElementById("shortMsgNum");
    this.visitorMsgNum=document.getElementById("visitorMsgNum");
    this.LEDButton=document.getElementById("LEDButton");
    this.sensorButton=document.getElementById("sensorButton");
    this.resetButton=document.getElementById("resetButton");
    
    // Initialize properties of firebase
    this.database=firebase.database();
    this.storage=firebase.storage();
    this.channel=1; //the channel the database refers to
    
    // Set observers
    this.LEDButton.addEventListener('click',this.LEDButtonClicked.bind(this));
    this.sensorButton.addEventListener('click',this.sensorButtonClicked.bind(this));
    this.resetButton.addEventListener('click',this.resetButtonClicked.bind(this));
    
    // Fetch old data from firebase if exist
    this.loadMessages();
}

// Checks that the Firebase SDK has been correctly setup and configured.
TrafficAnalyser.prototype.checkSetup = function() {
    if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
    }
}

// Loads chat messages history and listens for upcoming ones.
TrafficAnalyser.prototype.loadMessages = function() {
    // Reference to the /messages/ database path.
    this.messagesRef = this.database.ref(this.channel);
    // Make sure we remove all previous listeners.
    this.messagesRef.off();

    // Loads the last 12 messages and listen for new ones.
    this.long = 0;
    this.short = 0;
    this.visitor = 0;
    this.longMsgNum.textContent = this.long;
    this.shortMsgNum.textContent = this.short;
    this.visitorMsgNum.textContent = this.visitor;
    
    // Get data from firebase each time it is updated and display them
    var getData = function(data) {
        var val = data.val();
        this.longMsgNum.textContent = val.long;
        this.shortMsgNum.textContent = val.short;
        this.visitorMsgNum.textContent = val.visitor;
    }
    this.messagesRef.on('value',getData);
};

// Detection of click event for LED button
TrafficAnalyser.prototype.LEDButtonClicked = function() {
    this.socket.emit('LED');
}

// Detection of click event for sensor button
TrafficAnalyser.prototype.sensorButtonClicked = function() {
    this.socket.emit('sensor');
}

// Detection of click event for reset button
TrafficAnalyser.prototype.resetButtonClicked = function() {
    this.loadMessages();
    this.socket.emit('reset');
}

// Action when someone enters the website 
window.onload = function() {
    window.trafficAnalyser = new TrafficAnalyser();
}
class MotionList{
    
    /**
    
     Lo/Hi Signal (The first layer)
    
         |
         v
         
    Long/Short Motion (The second layer)
    
         |
         v
    
      Visitor (The third layer)
      
    **/
    constructor(long,short,visitor){
        this.signalCounter = 0; // counter used to assist the convertion of Lo/Hi signals to Long/Short motions
        this.mainDecider = 'H'; // decider to decide whether there is a long or short motion
        this.visitorDecider = 0; //decider to decide whether there is a person, stage 0 - {stage 1: L | stage 2: S | stage 3: L | stage 4: L}
        this.longMotion = long; // literally variable for storing the number of long motions
        this.shortMotion = short; // literally variable for storing the number of short motions
        this.visitor = visitor; // literally variable for storing the number of visitors
	    this.isVisitor = false; // check whether there is a visitor
        this.doesServerGetVisitor = false;  // boolean variable that checks whether the server gets the visitor when there is a visitor
        if(long == undefined || short==undefined || visitor==undefined){
               this.longMotion = 0;
               this.shortMotion = 0;
               this.visitor = 0;
        }
    }
    
    // method that allows programmers to add signals obtained from the sensor to the motion list
    // also the first layer of the convertion
    add(signalType){
        this.serverReceivedVisitor();
        if(this.mainDecider == 'L' && signalType == 'H'){
            this.concludeSignal();
            this.mainDecider = 'H';
        }
        else if(signalType == 'L'){
            this.incrementSignalCounter();
            if(this.signalCounter >= 3){
                this.concludeSignal();
                this.mainDecider = 'H';   
            }
            else{
                this.mainDecider = 'L';
            }
        }
    }
    
    // method that increments the signal counter
    incrementSignalCounter(){
        this.signalCounter ++;
    }
        
    // method that resets the signal counter
    resetSignalCounter(){
        this.signalCounter = 0;
    }
    
    // method that converts Lo/Hi signals to Long/Short motions 
    // also the second layer of the convertion
    concludeSignal(){
        if(this.signalCounter < 3){
            this.shortMotion ++;
            this.checkVisitorDecider('short');
        }
        else{
            this.longMotion ++;
            this.checkVisitorDecider('long');
        }
        this.resetSignalCounter();
    }
    
    // method that increments the vistor decider
    incrementVisitorDecider(){
        this.visitorDecider ++;
    }
    
    // method that resets the visitor decider
    resetVisitorDecider(){
        this.visitorDecider = 0;
    }
    
    // method that checks a sequence of motions
    // Long - Short - Long - Long will be seen as a visitor passes by
    // also the third layer of the convertion
    checkVisitorDecider(motionType){
        if(this.visitorDecider == 0 && motionType == 'long'){
            this.incrementVisitorDecider();
        }
        else if(this.visitorDecider == 1 && motionType == 'short'){
            this.incrementVisitorDecider();
        }
        else if(this.visitorDecider == 2 && motionType == 'long'){
            this.incrementVisitorDecider();
        }
        else if(this.visitorDecider == 3 && motionType == 'long'){
            this.concludeVisitor();
        }
        else{
            this.resetVisitorDecider();
            if(motionType == 'long'){
                this.incrementVisitorDecider();
            }
        }
    }
    
    // method that increments the visitor numbers and update related properties
    concludeVisitor(){
        this.visitor ++;
        this.isVisitor = true;
        this.resetVisitorDecider();
    }
    
    // getter method for the number of long motions
    getLongMotionNum(){
        return this.longMotion;
    }
    
    // getter method for the number of short motions
    getShortMotionNum(){
        return this.shortMotion;
    }
    
    // getter method for the number of visitors
    getVisitorNum(){
        return this.visitor;
    }
    
    // method that allows the server to know whether there is a visitor passes by
    // Note: getVistorNum() could have done for this if we make some changes in server-side code 
    //       but the method is presented to reduce its complexity.
    getPotentialVisitor(){
        if(this.isVisitor){
            this.doesServerGetVisitor = true;
        }
        return this.isVisitor;
    }
    
    // method that checks whether the server calls getPotentialVisitor() when there is a visitor
    serverReceivedVisitor(){
        if(this.doesServerGetVisitor == true){
            this.doesServerGetVisitor = false;
            this.isVisitor = false;
        }
    }

    // method that resets class properties
    reset(){
        this.signalCounter = 0;
        this.mainDecider = 'H'; 
        this.visitorDecider = 0; 
        this.longMotion = 0; 
        this.shortMotion = 0;
        this.visitor = 0;
        this.isVisitor = false; 
        this.doesServerGetVisitor = false;
    }
}

// action that exports this class to let the server use it as a library
module.exports = MotionList;

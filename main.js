/* 
=============
Params
=============
*/

// Drawing
let imageSize = {
    width: 640,
    height: 480
};
let scaleSize = {
    x: 1.0,
    y: 1.0
};
let capture;

// face-api.js
let isFaceapiLoaded = [false,false,false];
let isPredictStarted = false;
let faces;
let numberOfPredict=10;
let faceExpressions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
let enableGetFacePartsPos = false;
let facePartsPosSlider;

// FPS
let time;
let drawCount=0;
let startTime;
let fps=0;

// Other
let isWsConnection=false;
let enableDrawInfo = true;
let enableDrawCapture = true;
let sendTypeSlider;

/* 
=============
Main Function
=============
*/

function preload() {

}

function setup() {
    createCanvas(windowWidth,windowHeight);
    scaleSize.x = windowWidth/imageSize.width;
    scaleSize.y = windowHeight/imageSize.height;
    
    // Set your environment's url & port
    setupWs()
    //setupWs(hosturl="ws://192.168.11.222", wsport="8080")
    
    setupCamera();
    loadTfModel();

    sendTypeSlider = createSlider(0,1,0);
    sendTypeSlider.position(20,20);
    facePartsPosSlider = createSlider(0,67,0);
    facePartsPosSlider.position(20,40);

    // for calculating fps
    time = new Date();
    startTime = time.getTime();
}

function setupWs(hosturl="ws://localhost", wsport="8080"){
    // change your URL!
    //socket = new WebSocket('wss://echo.websocket.org');
    //socket = new WebSocket('ws://localhost:8080');
    //socket = new WebSocket('ws://192.168.1.6:8080');
    //socket = new WebSocket('ws://192.168.11.223:8080'); //designium
    socket = new WebSocket(hosturl+':'+wsport);

    // when connected
    socket.onopen = function(e) {
        console.log("Websocket connected!");
        // socket.send('Hello Server!');
        socket.binaryType = 'arraybuffer';
        // socket.binaryType = 'blob';

        isWsConnection=true;
    };
    
    // when an error occurs
    socket.onerror = function(error) { 
        console.log('Websocket Error Message: ', error);
    };
    
    // when received message
    socket.onmessage = function(e) { 
        console.log("Websocket Received!");
    };
    
    // when disconnected
    socket.onclose = function() { 
        console.log("Websocket Disconnected...");
    };
}

function setupCamera(id = ""){
    //let capture;
    if(id == ""){
        capture = createCapture(VIDEO, captureLoaded); //capture the webcam
        // capture.id("video_element");
    }else{
        let option = {
            video: {
                deviceId: id,
                width: imageSize.width,
                height: imageSize.height
            },
            audio: false
        };
        capture = createCapture(option, captureLoaded); //constraints
    }
    
    capture.size(imageSize.width, imageSize.height);
    // console.log("capture-w: ",capture.width);
    capture.hide();
    //captures.push(capture);
}

function captureLoaded(){
    console.log("capture loaded...");
    loadTfModel();
}

function loadTfModel(){
    // ===== face-api =====
    console.log(faceapi.nets);
    faceapi.nets.ssdMobilenetv1.loadFromUri('./assets/models').then(() => {
        console.log("faceapi loaded...");
        isFaceapiLoaded[0]=true;
    });
    // faceapi.nets.tinyFaceDetector.loadFromUri('./assets/models').then(() => {
    //     console.log("faceapi loaded...");
    // });
    // faceapi.nets.faceLandmark68Net.loadFromUri('./assets/models').then(() => {
    //     console.log("faceapi loaded...");
    // });
    faceapi.nets.faceLandmark68TinyNet.loadFromUri('./assets/models').then(() => {
        console.log("faceapi loaded...");
        isFaceapiLoaded[1]=true;
    });
    faceapi.nets.faceExpressionNet.loadFromUri('./assets/models').then(() => {
        console.log("faceapi loaded...");
        isFaceapiLoaded[2]=true;
    });
}

function predictFaces(){
    // TinyFaceDetector: input sizes are 128, 160, 224, 320, 416, 512, 608,
    // const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 608 });
    const options = new faceapi.SsdMobilenetv1Options({minConfidence: 0.5,maxResults: numberOfPredict});
    const useTinyModel = true;
    faceapi.detectAllFaces(capture.elt, options).withFaceLandmarks(useTinyModel).withFaceExpressions()
    .then(function(predictedFaces) {
        // // resizeすると何故かずれる
        // const displaySize = { width: windowWidth, height: windowWidth }
        // resizedDetections = faceapi.resizeResults(predictedFaces, displaySize)
        faces = predictedFaces;

        //drawWhenPredicted();
        predictFaces();
    });
}

function draw() {
    background(255);

    // Draw Capture
    if(enableDrawCapture){
        push();
        scale(-1,1);
        //image(capture,-320,windowHeight-240,320,240);
        image(capture, -windowWidth, 0, windowWidth, windowHeight);
        pop();
    }

    if(faces){
        let protocolStr="";
        if(sendTypeSlider.value()==0){
            protocolStr="WebSocket";
        }else if(sendTypeSlider.value()==1){
            protocolStr="OSC";
        }

        let jsonObj = {
            "protocol":protocolStr, // WebSocket or OSC
            "model":"face-api",
            "numberOfPeople":faces.length,
            "imageSize":imageSize
        };
        if(enableGetFacePartsPos){
            jsonObj.positionInfo = "all";
        }else{
            jsonObj.positionInfo = "mouth";
        }
        let facesObj=[];

        let faceIndex=0;
        fill(0,0,0,150);
        textSize(50);
        stroke(0, 0, 0, 150);
        //strokeWeight(5);
        for(let face of faces){
            if(enableGetFacePartsPos){
                // Expressions
                let faceObj = {
                    "expressions":[
                        {"name":"neutral", "score":face.expressions['neutral']},
                        {"name":"happy", "score":face.expressions['happy']},
                        {"name":"sad", "score":face.expressions['sad']},
                        {"name":"angry", "score":face.expressions['angry']},
                        {"name":"fearful", "score":face.expressions['fearful']},
                        {"name":"disgusted", "score":face.expressions['disgusted']},
                        {"name":"surprised", "score":face.expressions['surprised']}
                    ]
                };
                //console.log("pos:",face.landmarks._positions[0]._x);

                // ===FacePartsIndex===
                //  0-16(17):JawOutline(顎の輪郭)
                // 17-21(5):RightEyeBrow
                // 22-26(5):LeftEyeBrow
                // 27-35(9):Nose
                // 36-41(6):RightEye
                // 42-47(6):LeftEye
                // 48-67(20):Mouth, index56:mouthPos[9]
                let positions = [];
                for(let pos of face.landmarks._positions){
                    let posObj = {"x":imageSize.width - Math.floor(pos._x), "y":Math.floor(pos._y)};
                    positions.push(posObj);
                }
                faceObj.positions = positions;
                facesObj.push(faceObj);

                let x=positions[facePartsPosSlider.value()].x*scaleSize.x;
                let y=positions[facePartsPosSlider.value()].y*scaleSize.y;
                ellipse(x, y, 10, 10);
                textSize(15);
                text("FacePart",x+10,y-10);
            }else{
                if(mouthPos = face.landmarks.getMouth()){
                    let x=Math.floor(imageSize.width - mouthPos[9]._x);
                    let y=Math.floor(mouthPos[9]._y);
    
                    let faceObj = {
                        "position":{
                            "x":imageSize.width - Math.floor(mouthPos[9]._x),
                            "y":Math.floor(mouthPos[9]._y)
                        },
                        "expressions":[
                            {"name":"neutral", "score":face.expressions['neutral']},
                            {"name":"happy", "score":face.expressions['happy']},
                            {"name":"sad", "score":face.expressions['sad']},
                            {"name":"angry", "score":face.expressions['angry']},
                            {"name":"fearful", "score":face.expressions['fearful']},
                            {"name":"disgusted", "score":face.expressions['disgusted']},
                            {"name":"surprised", "score":face.expressions['surprised']}
                        ]
                    };
                    facesObj.push(faceObj);
    
                    // Draw at face position
                    // fill(255,255,255);
                    // ellipse(x*scaleSize.x, y*scaleSize.y, 10, 10);
                    text(String(faceIndex+1), x*scaleSize.x, y*scaleSize.y);
                }
            }
            faceIndex++;
        }
        jsonObj.faces = facesObj;

        var json = JSON.stringify(jsonObj);
        if(isWsConnection){
            socket.send(json);
        }
    }

    // Draw model loading info 
    if(!isPredictStarted){
        let w=300;
        let h=100;
        fill(200,200,200,150);
        rect(windowWidth/2-w/2,windowHeight/2-h/2,w,h);
        fill(0,0,0);
        textSize(15);
        if(isFaceapiLoaded[0] && isFaceapiLoaded[1] &&isFaceapiLoaded[2]){
            text("Push 'p'key,\nPrediction start!", windowWidth/2-w/4, windowHeight/2);
        }else{
            text("Wait...", windowWidth/2-w/4, windowHeight/2);
        }
    }

    // Draw Info
    if(enableDrawInfo){
        textSize(15);
        //strokeWeight(1);
        noStroke();

        fill(200,200,200,150);
        rect(0,0,270,180);

        fill(0,0,0);
        if(sendTypeSlider.value()==0){
            text('WS', sendTypeSlider.x+sendTypeSlider.width+10, sendTypeSlider.y+10);
        }else if(sendTypeSlider.value()==1){
            text('OSC', sendTypeSlider.x+sendTypeSlider.width+10, sendTypeSlider.y+10);
        }
        text('FacePart:'+String(facePartsPosSlider.value()), facePartsPosSlider.x+facePartsPosSlider.width+10, facePartsPosSlider.y+10);
        
        info = "";
        info += "FPS1: " + String(getFrameRate()) + "\n";
        updateCalculateFps();
        info += "FPS2: " + String(fps) + "\n";
        info += "'i'key: Draw info\n";
        info += "'c'key: Draw capture\n";
        info += "'C'key: WebSocket close\n";
        if(enableGetFacePartsPos){
            info += "'P'key: Get all face parts position\n";
        }else{
            info += "'P'key: Get only mouth position\n";
        }
        text(info, 20, facePartsPosSlider.y+40);
    }
}

function updateCalculateFps(){
    drawCount++;
    time = new Date();
    let elapsedTime = time.getTime()-startTime;
    if(elapsedTime>1000){
        fps = drawCount;
        drawCount=0;
        startTime = time.getTime();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    scaleSize.x = windowWidth/imageSize.width;
    scaleSize.y = windowHeight/imageSize.height;
}

function mousePressed() {
    // nothing
}

function keyTyped() {
    switch (key) {
        case 'f':
            let fs = fullscreen();
            fullscreen(!fs);
            break;
        case 'i':
            if(enableDrawInfo){
                enableDrawInfo=false;
                sendTypeSlider.hide();
                facePartsPosSlider.hide();
            }else{
                enableDrawInfo=true;
                sendTypeSlider.show();
                facePartsPosSlider.show();
            }
            break;
        case 'c':
            if(enableDrawCapture){
                enableDrawCapture=false;
            }else{
                enableDrawCapture=true;
            }
            break;
        case 'p':
            predictFaces();
            isPredictStarted=true;
            break;
        case 'P':
            if(enableGetFacePartsPos){
                enableGetFacePartsPos=false;
            }else{
                enableGetFacePartsPos=true;
            }
            break;
        case 'C':
            if(isWsConnection){
                console.log("WebSocket close...");
                socket.close();
            }
            break;
        default:
            break;
    }
}
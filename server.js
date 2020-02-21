// ===WebSocket===
var wsurl = "localhost";
//var wsurl = "192.168.11.222";
var wsport = 8080;
// ===OSC===
var oscurl = "localhost";
var oscport = 6000;

// Run WebSocket Server
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({host:wsurl, port:wsport});

// Run OSC Client
var osc = require('node-osc');
var oscClient = new osc.Client(oscurl, oscport);
// var oscServer = new osc.Server(oscport);

// FPS
let time = new Date();
let receiveCount=0;
let startTime=time.getTime();
let fps=0;

// WebSocket Event Handler
wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        //console.log(message);
        let jsonObj = JSON.parse( message );
        let protocolStr = "---,";

        if(jsonObj.protocol == "OSC" && jsonObj.positionInfo == "mouth"){
            protocolStr = "OSC,";
            let sendMsg =  new osc.Message('/info',jsonObj.model,jsonObj.numberOfPeople,jsonObj.imageSize.width,jsonObj.imageSize.height);
            oscClient.send(sendMsg);
    
            for(let i=0;i<jsonObj.numberOfPeople;i++){
                // send message -> /face,index,x,y,scores...
                sendMsg =  new osc.Message('/face',i,jsonObj.faces[i].position.x,jsonObj.faces[i].position.y);
                for(let expression of jsonObj.faces[i].expressions){
                    sendMsg.append(expression.score);
                }
                oscClient.send(sendMsg);
            }
        }else if(jsonObj.protocol == "WebSocket"){
            protocolStr = "WebSocket,";
            wss.clients.forEach(client => {
                // Send to all connected clients
                client.send(message);
            });
        }

        updateCalculateFps();
        console.log(protocolStr,"FPS: ",fps);
    });
});

function updateCalculateFps(){
    receiveCount++;
    time = new Date();
    let elapsedTime = time.getTime()-startTime;
    if(elapsedTime>1000){
        fps = receiveCount;
        receiveCount=0;
        startTime = time.getTime();
    }
}
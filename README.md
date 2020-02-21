# faceapi-sender
## Overview
Send the output of face-api.js using the protocol of WebSocket or OSC using node.js.
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- [node.js](https://nodejs.org/)

## Requirement
I confirmed the operation in the following environment.(2020/2/21)
- Visual Studio Code(v1.42.1)
    - Debugger for Chrome(v4.12.6) 
    - LiveServer(v5.6.1)
- p5.js(Included on source code by cdn service)
- ~~tensorflow.js(Included on source code by cdn service)~~
- face-api.js(Included in repository)
- node.js(v12.14.1)
    - nvm(v1.1.7)->(recommend)
    - npm(v6.13.4)
    - node-osc(v4.1.4)
    - ws(v7.2.1)
## Usage
1. Go to the directory where the repository is located at the command prompt.
2. Run the following command -> 'node server.js'
3. Run faceapi-sender by VSCode
4. Push 'p'key, and then model prediction starts.
<br>

- You need to rewrite the url and pot number on source code to suit your environment. (Default is url:localhost wsport:8080 oscport:6000)
- Currently, only the mouth coordinates can be sent when using OSC.
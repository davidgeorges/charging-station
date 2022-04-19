// Import dependencies
const SerialPort = require("serialport");
var childProcess = require('child_process');

var dataReceive = [];
var dataHex = [];


// Defining the serial port
const port = new SerialPort("COM12", {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none'
});

const frame1 = [0x01, 0x03, 0x08, 0x43, 0x41, 0x38, 0x34, 0x35, 0x42, 0x35, 0x44, 0x9b, 0x19];


port.on("data", (line) => {
    dataReceive = line;
    converTabToHex();
    if (dataHex[0] == "1") {
        port.write(frame1, () => {
            port.close((err) => {
                //Nous éxécutons le script
                var process = childProcess.fork('./borne1.js');
            })
        });
    }
    dataHex = []
});



function converTabToHex() {
    dataReceive.forEach(element => {
        //console.log('Convert ' + element.toString(16));
        dataHex.push(element.toString(16))
    });
    console.log("Converted : ", dataHex[0])
}
// Import dependencies
const SerialPort = require("serialport");
var childProcess = require('child_process');

// Defining the serial port
const port = new SerialPort("COM12",{
    baudRate : 9600,
    dataBits :8,
    parity :'none'
});

const frame1 = [0x01, 0x03, 0x08, 0x43, 0x41, 0x38, 0x34, 0x35, 0x42, 0x35, 0x44, 0x9b, 0x19];

// Ecriture des données
port.write(frame1,() => {
    port.close((err) => {
        //Nous éxécutons le script
        var process = childProcess.fork('./borne1.js');
    })
});



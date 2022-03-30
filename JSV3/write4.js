// Import dependencies
const SerialPort = require("serialport");

// Defining the serial port
const port = new SerialPort("COM12");

const t1 = [0x0e, 0x03, 0x01, 0x31, 0x00, 0x01, 0xD4, 0xC6];

var dataReceive = [];

var dataHex = [];


// Write the data to the serial port
port.write(t1);


// Read the data from the serial port
port.on("data", (line) => {

    console.log(line);
    dataReceive = line; 
    converTabToHex();
    tr();
});

function converTabToHex() {

    dataReceive.forEach(element => {

        console.log('Convert ' + element.toString(16));
        dataHex.push(element.toString(16))
    });

}


function tr() {


    if(dataHex[2] == 2 && dataHex[3] == 10){
        
    }
}
// Import dependencies
const SerialPort = require("serialport");

// Defining the serial port
const port = new SerialPort("COM11");

const t1 = [0x01, 0x03, 0x08, 0x43, 0x41, 0x38, 0x34, 0x35, 0x42, 0x35, 0x44, 0x9b, 0x19];

var dataReceive = [];

var dataHex = [];


// Write the data to the serial port
port.write(t1);


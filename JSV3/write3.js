// Import dependencies
const SerialPort = require("serialport");

// Defining the serial port
const port = new SerialPort("COM11");

const t1 = [0x03, 0x03, 0x08, 0x42, 0x47, 0x31, 0x34, 0x33, 0x42, 0x35, 0x45, 0x86, 0xc2];

var dataReceive = [];

var dataHex = [];


// Write the data to the serial port
port.write(t1);

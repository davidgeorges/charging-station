// Import dependencies
const SerialPort = require("serialport");

// Defining the serial port
const port = new SerialPort("COM11");

const t1 = [0x02, 0x03, 0x08, 0x41, 0x45, 0x38, 0x34, 0x35, 0x42, 0x35, 0x42, 0xa2, 0xe3];

var dataReceive = [];

var dataHex = [];


// Write the data to the serial port
port.write(t1);


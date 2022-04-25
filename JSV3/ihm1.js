// Import dependencies
const SerialPort = require("serialport");

var dataReceive = [];
var dataHex = [];


// Defining the serial port
const port = new SerialPort("COM12", {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none'
});



port.on("data", (line) => {
    dataReceive = line;
    converTabToHex();
    if (dataHex[0] == "b") {
        console.log("IHM WRITED");
        port.write([0x0b, 0x03, 0x00, 0x00, 0x01, 0x2D, 0xDB]);
    }
    dataHex = []
});



function converTabToHex() {
    dataReceive.forEach(element => {
        dataHex.push(element.toString(16))
    });
    console.log("Converted : ", dataHex[0])
}
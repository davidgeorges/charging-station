// Import dependencies
const SerialPort = require("serialport");

// Defining the serial port
const port = new SerialPort("COM12", {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none'
});


var dataReceive = [];

var dataHex = [];


// Write the data to the serial port port.write(t1);

console.log("write2.js")


// Read the data from the serial port
port.on("data", (line) => {
    dataReceive = line;
    converTabToHex();
    if (dataHex[0] == "16") {
        switch (dataHex[3]) {
            case '10':
                console.log("ID");
                //port.write(0x16, 0x03, 0x01, 0x31, 0x00, 0x01, 0xD4, 0x93)
                console.log(dataHex[3]);
                break;
            case '31':
                console.log("VOLT");
                port.write([0x16, 0x03, 0x02, 0x58, 0xF0, 0xF7, 0xC3]); //227,68 V
                console.log(dataHex[3]);
                break;
            case '39':
                port.write([0x16, 0x03, 0x04, 0x00, 0x00, 0x1E, 0xB1, 0x54, 0xE6]); //7,857 A
                console.log(dataHex[3]);
                console.log("CURRENT");
                break;
            case '40':
                port.write([0x16, 0x03, 0x04, 0x00, 0x00, 0x06, 0xE2, 0x1E, 0xDB]);//1,762 kW
                console.log("ACTIVE POWER");
                console.log(dataHex[3]);
            default:
                break;
        }
    }
    console.clear();
    dataHex = []
});

function converTabToHex() {

    dataReceive.forEach(element => {

        //console.log('Convert ' + element.toString(16));
        dataHex.push(element.toString(16))
    });
    console.log("Converted : ", dataHex[0])

}


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

var val2;




// Write the data to the serial port port.write(t1);

console.log("borne1.js")


var volt = getRandomArbitrary(22220,23000)
var ampere = getRandomArbitrary(22220,23000)
var kw = getRandomArbitrary(22220,23000)
/*
yourNumber = Math.round(yourNumber)
console.log("New Val 1 --> ",yourNumber)
var hexString = yourNumber.toString(16)
console.log("New Val 2 ",val2," --> ",hexString)
*/
// Read the data from the serial port
port.on("data", (line) => {
    dataReceive = line;
    converTabToHex();
    if (dataHex[0] == "15") {
        changeVal();
        switch (dataHex[3]) {
            case '31':
                console.log("VOLT");
                port.write([0x15, 0x03, 0x02, 0x58, val2, 0xB1, 0xC3]); //227,68 V
                console.log(dataHex[3]);
                break;
            case '39':
                port.write([0x15, 0x03, 0x04, 0x00, 0x00, 0x5E, val2, 0x67, 0xE6]); //7,857 A
                console.log(dataHex[3]);
                console.log("CURRENT");
                break;
            case '40':
                port.write([0x15, 0x03, 0x04, 0x00, 0x00, 0x05, val2, 0x2D, 0xDB]);//1,762 kW
                console.log("ACTIVE POWER");
                console.log(dataHex[3]);
                console.clear();
                break;
            default:
                break;
        }
    }

    if (dataHex[0] == "b") {
        console.log("IHM WRITED");
        port.write([0x0b, 0x03, 0x02, 0x00, 0x01, 0x2D, 0xDB]);
        console.log("Test 1 : ", dataHex[1])
        console.log("Test 2 : ", dataHex[2])
        console.log("Test 3 : ", dataHex[3])
        console.log("Test 4 : ", dataHex[4])
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


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

function changeVal() {
    var yourNumber = getRandomArbitrary(22220,23000)
    console.log("New Val 1 --> ",yourNumber)
    var hexString = yourNumber.toString(16)
    switch (hexString.length) {
        case 2:
            val2 = "0x" + hexString
            break;
        case 1:
            val2 = "0x0" + hexString;
            break;
        default:
            break;
    }
    console.log("New Val 2 ",val2," --> ",parseInt(hexString,16))
}
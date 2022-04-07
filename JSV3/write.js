// Import dependencies
const SerialPort = require("serialport");

// Defining the serial port
const port = new SerialPort("COM12");

const t1 = [0x0b, 0x03, 0x01, 0x31, 0x00, 0x01, 0xD4, 0x93];

var dataReceive = [];

var dataHex = [];


// Write the data to the serial port port.write(t1);

console.log("write.js")



// Read the data from the serial port
port.on("data", (line) => {
    dataReceive = line;
    if (dataHex[0] == "0b") {

        switch (dataHex[3]) {
            case "10":
                console.log("ID")
                //port.write(0x0b, 0x03, 0x01, 0x31, 0x00, 0x01, 0xD4, 0x93)
                break;
            case "31":
                console.log("VOLT")
                port.write(0x0b, 0x03, 0x02, 0x58, 0x14, 0xD4, 0x93)
                break;
            case "39":
                console.log("CURRENT")
                break;
            case "40":
                console.log("ACTIVE POWER")
                break;
            default:
                break;
        }

    }
    console.log(line);

    //converTabToHex();

});

function converTabToHex() {

    dataReceive.forEach(element => {

        //console.log('Convert ' + element.toString(16));
        dataHex.push(element.toString(16))
    });
    console.log("Converted : ", dataHex[0])

}


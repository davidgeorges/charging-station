// Import dependencies
const SerialPort = require("serialport");

// Defining the serial port
const port = new SerialPort("COM5");

var dataReceive;

var dataToSend = [0x05, 0x03, 0x02, 0x10, 0x58, 0x14, 0x72, 0x4B];

var dataHex = [];

// Read the data from the serial port
port.on("data", (line) => {

    console.log("Données reçu ")
    console.log(line);
    dataReceive = line; 
    converTabToHex();
    port.write(dataToSend)
});


function converTabToHex() {

    dataReceive.forEach(element => {
        dataHex.push(element.toString(16))
    });

    console.log("Apres conversion : " + dataHex);
    
    dataHex = [];
    dataReceive = [];
}

function tr() {

    if(dataHex[2] == 1 && dataHex[3] == 31){

        /* Demande d'envoie de données */
        console.log("Reçu "  + dataHex);
        console.log("Renvoie données ")
        port.write(dataToSend)
        dataHex = [];
    }

}
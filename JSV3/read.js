// Import dependencies
const SerialPort = require("serialport");

// Defining the serial port
const port = new SerialPort("COM12");

var dataReceive;

var dataHex = [];

// Read the data from the serial port
port.on("data", (line) => {

  
    dataReceive = line; 
    converTabToHex();
    // port.write(dataToSend)
    // console.log("Données reçu ")
    // console.log(line);
    tr();
});


function converTabToHex() {
    dataReceive.forEach(element => {
        dataHex.push(element.toString(16))
    });
    console.log("Apres conversion : " + dataHex);
}

function tr() {

    //console.log("Read : ",dataReceive)

    if("0x"+dataReceive[0] == "0x15"){
    //console.log("Rfid : ","0x"+dataReceive[0],"Reçu.")
    //     // Demande d'envoie de données 
    //     // console.log("Reçu "  + dataHex);
    //     // console.log("Renvoie données ")
    //     // port.write(dataToSend)
    //     // 
     }
        dataHex = [];
    dataReceive = []

}
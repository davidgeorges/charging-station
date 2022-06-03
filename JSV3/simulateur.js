const io = require("socket.io-client");
const socket = io("http://localhost:8080");

// Import dependencies
const SerialPort = require("serialport");

let dataReceive = [];
let dataHex = [];

// Defining the serial port
const port = new SerialPort("COM12", {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none'
});

let frame1 = [0x01, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9b, 0x19];

let frame2 = [0x02, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa2, 0xe3];

let frame3 = [0x03, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa2, 0xe3];

let objBt1 =  {
    connect : true,
}

let objBt2 =  {
    connect : true,
}

let objBt3 =  {
    connect : true,
}

let val1;
let val2;

let tabVal;


socket.on("newSimulationFromServ", (dataR) => {

    console.log("Simulate Receive", dataR)

    let execute = (val) => {
        let inputs = {
            "b1b1": ()=>{
                objBt1.connect = true;
                frame1 = [0x01, 0x03, 0x08, 0x00, 0x41, 0x00, 0x34, 0x00, 0x42, 0x00, 0x44, 0x9b, 0x19]
            },
            "b1b2": ()=>{
                frame1 = [0x01, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9b, 0x19];
            },
            "b1b3": ()=>{
                objBt1.connect = false;
            },
            "b1b4": ()=>{
                objBt1.connect = true;
                frame1 = [0x01, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa2, 0xe3];
            },
            "b2b1": ()=>{
                objBt2.connect = true;
                frame2 = [0x02, 0x03, 0x08, 0x00, 0x43, 0x00, 0x41, 0x00, 0x38, 0x00, 0x34, 0xa2, 0xe3];
            },
            "b2b2": ()=>{
                frame2 = [0x02, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa2, 0xe3];
            },
            "b2b3": ()=>{
                objBt2.connect = false;
            },
            "b2b4": ()=>{
                objBt2.connect = true;
                frame2 = [0x02, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa2, 0xe3];
            },
            "b3b1": ()=>{
                objBt3.connect = true;
                frame3 = [0x03, 0x03, 0x08, 0x00, 0x42, 0x00, 0x47, 0x00, 0x31, 0x00, 0x34, 0xa2, 0xe3];
            },
            "b3b2": ()=>{
                frame3 = [0x03, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa2, 0xe3];
            },
            "b3b3": ()=>{
                objBt3.connect = false;
            },
            "b3b4": ()=>{
                objBt3.connect = true;
                frame3 = [0x03, 0x03, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa2, 0xe3];
            },
            "bb": ()=>{

                tabVal = dataR.tabVal;
                console.log("TTTTT : ", tabVal);
            },

        }
        return inputs[val]();
    }
    execute(dataR.id)


})

port.on("data", (line) => {

    dataReceive = line;
    converTabToHex();

    if (objBt1.connect && dataHex[0] == "1") {
        port.write(frame1);
    }

    if (objBt2.connect && dataHex[0] == "2") {
        port.write(frame2);
    }

    if (objBt3.connect && dataHex[0] == "3") {
        port.write(frame3);
    }


    if (objBt1.connect && dataHex[0] == "b") {
        port.write([0x0b, 0x03, 0x00, 0x00, 0x01, 0x2D, 0xDB]);
    }

    if (objBt2.connect && dataHex[0] == "c") {
        port.write([0x0c, 0x03, 0x00, 0x00, 0x01, 0x2D, 0xDB]);
    }
    if (objBt3.connect && dataHex[0] == "d") {
        port.write([0x0d, 0x03, 0x00, 0x00, 0x01, 0x2D, 0xDB]);
    }


    if (objBt1.connect && dataHex[0] == "15") {
        let randomVal = 0;
        switch (dataHex[3]) {
            case '31':
                randomVal = Math.round(getRandomArbitrary(22220, 23000));
                console.log("VOLT I 0x15 --> ", randomVal);
                change(randomVal.toString(16))
                console.log("VOLT I 0x15 HEXA  --> ", val1, " ",val2);
                port.write([0x15, 0x03, 0x02, val1, val2, 0xB1, 0xC3]); //Ex : 227,68 V
                break;
            case '39':
                randomVal = Math.round(getRandomArbitrary(tabVal[1] - 1.2, tabVal[1]));
                console.log("CURRENT A 0x15 --> ", randomVal);
                change(randomVal.toString(16))
                console.log("CURRENT A 0x15 HEXA  --> ", val1, " ",val2);
                port.write([0x15, 0x03, 0x04, 0x00, 0x00, val1, val2, 0x67, 0xE6]); //Ex : 30 A
                break;
            case '40':
                randomVal = Math.round(getRandomArbitrary((tabVal[0] * 1000) - 100, (tabVal[0] * 1000)));
                console.log("ACTIVE POWER KW 0x15 --> ", randomVal);
                change(randomVal.toString(16))
                console.log("ACTIVE POWER KW 0x15 HEXA  --> ", val1, " ",val2);
                port.write([0x15, 0x03, 0x04, 0x00, 0x00, val1, val2, 0x2D, 0xDB]);//Ex : 3,850 kW
                break;
            default:
                break;
        }
        console.log("---------------------------------");

    }

    if (objBt2.connect && dataHex[0] == "16") {
        let randomVal = 0;
        switch (dataHex[3]) {
            case '31':
                randomVal = Math.round(getRandomArbitrary(22220, 23000));
                console.log("VOLT I 0x16 --> ", randomVal);
                change(randomVal.toString(16))
                console.log("VOLT I 0x16 HEXA  --> ", val1, " ",val2);
                port.write([0x16, 0x03, 0x02, val1, val2, 0xB1, 0xC3]); //227,68 V
                break;
            case '39':
                randomVal = Math.round(getRandomArbitrary(tabVal[3] - 1.2, tabVal[3]));
                console.log("CURRENT A 0x16 --> ", randomVal);
                change(randomVal.toString(16))
                console.log("CURRENT A 0x16 HEXA  --> ", val1, " ",val2);
                port.write([0x16, 0x03, 0x04, 0x00, 0x00, val1, val2, 0x67, 0xE6]); //7,857 A
                break;
            case '40':
                randomVal = Math.round(getRandomArbitrary((tabVal[2] * 1000) - 100, (tabVal[2] * 1000)));
                console.log("ACTIVE POWER KW 0x16  --> ", randomVal);
                change(randomVal.toString(16))
                console.log("ACTIVE POWER 0x16 KW HEXA  --> ", val1, " ",val2);
                port.write([0x16, 0x03, 0x04, 0x00, 0x00, val1, val2, 0x2D, 0xDB]);//1,762 kW
                break;
            default:
                break;
        }
        console.log("---------------------------------");

    }

    if (objBt3.connect && dataHex[0] == "17") {

        let randomVal = 0;
        switch (dataHex[3]) {
            case '31':
                randomVal = Math.round(getRandomArbitrary(22220, 23000));
                console.log("VOLT I 0x17 --> ", randomVal);
                change(randomVal.toString(16))
                console.log("VOLT I 0x17 HEXA  --> ", val1, " ",val2);
                port.write([0x17, 0x03, 0x02, val1, val2, 0xB1, 0xC3]); //227,68 V
                break;
            case '39':
                randomVal = Math.round(getRandomArbitrary(tabVal[5] - 1.2, tabVal[5]));
                console.log("CURRENT A 0x17 --> ", randomVal);
                change(randomVal.toString(16))
                console.log("CURRENT A 0x17 HEXA  --> ", val1, " ",val2);
                port.write([0x17, 0x03, 0x04, 0x00, 0x00, val1, val2, 0x67, 0xE6]); //7,857 A
                break;
            case '40':
                randomVal = Math.round(getRandomArbitrary((tabVal[4] * 1000) - 100, (tabVal[4] * 1000)));
                console.log("ACTIVE POWER KW 0x17 --> ", randomVal);
                change(randomVal.toString(16))
                console.log("ACTIVE POWER KW 0x17 HEXA  --> ", val1, " ",val2);
                port.write([0x17, 0x03, 0x04, 0x00, 0x00, val1, val2, 0x2D, 0xDB]);//1,762 kW
                break;
            default:
                break;
        }
        console.log("---------------------------------");

    }

    dataHex = []
});


function converTabToHex() {

    dataReceive.forEach(element => {
        dataHex.push(element.toString(16))
    });

}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function change(dataR) {
    switch (dataR.length) {
        case 4:
            val1 = "0x" + dataR.substring(0, 2)
            val2 = "0x" + dataR.substring(2)
            break;
        case 3:
            val1 = "0x0" + dataR.substring(0, 1)
            val2 = "0x" + dataR.substring(1)
            break;
        case 2:
            val1 = "0x00"
            val2 = "0x" + dataR
            break;
        case 1:
            val1 = "0x00"
            val2 = "0x0" + dataR
            break;
        default:
            break;
    }
}
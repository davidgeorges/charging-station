var self = null;

class Terminal {

    /* Constructeur */
    constructor() {

        // Lecteur rfid
        this.rfid = {
            adr: 0x15,
            anyError: true,
            nbRetry: 0,
            frame: [],
        }


    }

}



var term = new Terminal()

console.log("T : ",term.rfid["adr"]);
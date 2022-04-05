var self = null;

class Serial {

    /* Constructeur */
    constructor(pathPortR, baudRateR, nbBitR, parityR) {

        /* Import des modules */

        /* Serial port */
        this.SerialPort = require('serialport')

        /* Config */
        this.dotenv = require('dotenv').config()

        /* Events */
        this.emitter = require('./Listener');
        this.myEmitter = this.emitter.myEmitter

        /* Calcul crc */
        this.crc16 = require('./CalculCR16')
        this.valCrc16

        /* Var pour créer la connexion */
        this.port = null;

        // Données
        this.dataReceive;

        // Données en HEXA
        this.dataHex = [];

        this.writeTerminalTimeout = null;

        this.newData = false;

        this.data = null;

        self = this

        /* Appel des méthodes pour créer la communication serial */
        this.createConnectionPort(pathPortR, baudRateR, nbBitR, parityR);

        console.log("From Serial.js : Constructor serial end");
        console.log("---------------------------------------")
    }


    /**
     * Create port communication
     * @param {string} pathPort path of the SERIAL PORT
     * @param {int} baudRate baudRate value 
     */
    createConnectionPort(pathPortR, baudRateR, nbBitR, parityR) {

        /* Si le port vaut null il n'a jamais été crée */
        if (self.port != null) { console.error("From Serial.js : Error --> make sure you didn't create a connectionPort two times."); }

        /* Creation du port serial */
        else {
            /* Création de la communication */
            self.port = new self.SerialPort(pathPortR, {
                baudRate: baudRateR,
                databits: nbBitR,
                parity: parityR
            })

            console.log("From Serial.js : Port connection successfully created : " + self.port.baudRate);
            console.log("---------------------------------------")

            /* Mise en place de tout les listeners*/
            self.allListener();
        }
    }

    /* Regroupe tout les listeners */
    allListener() {

        /* Mise en place des listener d'events */
        self.port.on('open', self.showPortOpen);
        self.port.on('close', self.showPortClose);
        self.port.on('error', self.showError);
        self.port.on('data', (dataR) => {


            console.log("From Serial.js [92 ] : Données reçu.", dataR)
            console.log("---------------------------------------")

            /* On récupère les données reçu */
            self.dataReceive = dataR;

            /* Conversion en hexa */
            self.converTabToHex(self.dataReceive);

            /* Conditions pour conmparer les octets */
            self.instructToDo();

            self.newData = true;
            clearTimeout(this.writeTerminalTimeout)

        });

    }

    /* --------------------------- FONCTIONS EXECUTER EVENT --------------------------- */
    /* Affichage ouverture du port */
    showPortOpen() {
        console.log("From Serial.js : Port is open.");
        console.log("---------------------------------------")
    }

    /* Affichage fermeture du port */
    showPortClose() {
        console.log('From Serial.js : port closed.');
    }

    /* Affichage erreur */
    showError(error) {

        console.log('From Serial.js : port error --> ' + error);
        console.log("---------------------------------------")

    }

    /* Ecriture de données sur le port (async)*/
    async writeData(dataToSend, whosWriting) {
        //Renvoie une promesse
        let adr = "";
        return new Promise((resolve, reject) => {
            switch (whosWriting) {
                case "rfid":
                    console.log("From Serial.js [160] : Ecriture RFID ", dataToSend[0])
                    //console.log("---------------------------------------")
                    adr = dataToSend[0];
                    //Timeout a mettre ici ?
                    self.port.write(dataToSend, (err) => {
                        if (err) { console.log("From Serial.js [142] : ", err) }
                    })
                    break;
                case "wattMeter":
                    console.log("From Serial.js [160] : Ecriture Terminal ", dataToSend)
                    //console.log("---------------------------------------")
                    adr = dataToSend[0];
                    //Timeout a mettre ici ?
                    //console.log("Envoie T",index)
                    self.port.write(dataToSend, (err => {
                        if (err) { console.log("From Serial.js [142] : ", err) }
                    }))
                    break;
                default:
                    console.log("From Serial.js [157] : Error whosWriting: ")
                    break;
            }

            /* Mise en place d'un timeout pour reject ou resolve la promesse
               Si on a une erreur lors de la réception des données on reject*/
            setTimeout(() => {
                if (!self.newData) {
                    reject({
                        status: "error",
                        adr: adr
                    });
                } else {
                    resolve({
                        status: "sucess",
                        adr: adr
                    });
                    self.newData = false;
                }
            }, 1500)

            //console.log("Apres");
        })

    }

    /* Conversion en HEXA */
    converTabToHex(tabToConvert) {
        self.dataHex = [];
        tabToConvert.forEach(element => {

            self.dataHex.push(element.toString(16))
        });
        console.log("From Serial.js : Conversion en HEXA effectuer.");
        console.log("---------------------------------------")
    }

    /* A venir ... (lecture des mots a lire ) */
    instructToDo() {
        var dataDest = " ";
        var keyCode = " ";
        switch (self.dataHex[2]) {
            //Lecture 8 mot = RFID
            case "8":
                console.log("From Serial.js [183] : RFID data receive.")
                console.log("---------------------------------------")
                //console.log(self.dataHex)
                keyCode = self.convertRfid(self.dataHex)
                dataDest = "rfid";
                break;
            case "3":
                break;
            default:
                console.log("erreur");
                dataDest = "err";
                break;
        }

        switch (dataDest) {
            case "rfid":
                self.data = {
                    room: "rfid",
                    data: self.dataHex,
                    adr: "0x0" + self.dataHex[0],
                    keyCode: keyCode
                }
                break;
            default:
                break;
        }
    }


    /* Conversion des données de la carte RFID reçu */
    convertRfid(str1) {
        // Converion en String , récupération des données nécéssaires , et suppressin des virgules */
        var hex = str1.toString();
        hex = hex.substr(6, 23)
        hex = hex.replaceAll(',', '')
        var str = '';
        for (var n = 0; n < hex.length; n += 2) {
            str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
        }
        return str;
    }


}

/* Export du module */
module.exports = Serial;
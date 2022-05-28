let self = null;

class Serial {

    /* Constructeur */
    constructor(pathPortR, baudRateR, nbBitR, parityR) {

        /* Import des modules */

        /* Serial port */
        this.SerialPort = require('serialport')

        /* Config */
        this.dotenv = require('dotenv').config()

        /* Calcul crc */
        this.crc16 = require('./calculCR16')

        /* let pour créer la connexion */
        this.port = null;

        // Données
        this.dataReceive;

        //Interval
        this.writeTerminalTimeout = null;

        //Flag pour savoir si nous avons reçu les données
        this.newData;

        this.dataPromise;
        this.whoIsWriting;

        self = this

        //Appel de méthodes pour créer la communication serial
        this.createConnectionPort(pathPortR, baudRateR, nbBitR, parityR);

        console.log("From Serial.js : Constructor serial end");
        console.log("---------------------------------------")
    }


    /**
     * Crée la communication serial
     * @param pathPort chemin du PORT SERIAL
     * @param baudRate vitesse de transmission
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
        self.port.on('data', self.onNewData);
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

    //
    onNewData(dataR) {
        console.log("From Serial.js [102 ] : Données reçu.", dataR)
        /* On récupère les données reçu */
        self.dataReceive = dataR;

        /* Conditions pour conmparer les octets */
        self.instructToDo();

        self.newData = true;
        clearTimeout(this.writeTerminalTimeout)
    }

    /* Ecriture de données sur le port (async)*/
    async writeData(dataToSend, whosWritingR) {
        self.newData = false;
        self.whoIsWriting = whosWritingR
        return new Promise((resolve, reject) => {
            console.log("From Serial.js [119] : Ecriture du module", self.whoIsWriting, " adr : ", dataToSend[0],"trame : ",dataToSend)
            self.port.write(dataToSend, (err) => {
                if (err) { console.log("From Serial.js [140] :  ", err) }
            })
            /* Mise en place d'un timeout pour reject ou resolve la promesse
            Si on a une erreur lors de la réception des données on reject*/
            setTimeout(() => {
                if (!self.newData) {
                    reject({
                        status: "error",
                        adr: dataToSend[0]
                    });
                } else {
                    resolve({
                        status: "sucess",
                        adr: dataToSend[0],
                        data: self.dataPromise,
                    });
                }
            },30)
        })
    }

    /* Instruction à faire selon qui écrit */
    instructToDo() {

        self.dataPromise = "";
        //On créer et stock le nombre de bits de donneés
        let nbDataBits = self.dataReceive[2];
        //On le converti en entier
        nbDataBits = parseInt(nbDataBits);

        //Selon le satus de l'erreur
        let doInstruction = (whoIsWritingR) => {
            let inputs = {
                "rfid": () => { self.dataPromise = self.convertRfidDataToString(self.dataReceive) },
                "wattMeter": () => {
                    //On récupère tout les bits de donneés
                    for (let index = 3; index < 3 + nbDataBits; index++) {
                        //On concat les bits qui sont convertis en HEXA
                        self.dataPromise += self.dataReceive[index].toString(16);
                    }
                },
                "him": () => {
                    //console.log("From Serial.js [189] : him data receive.")
                },
                "contactor": () => {
                    //console.log("From Serial.js [189] : him data receive.")
                },
            }
            inputs[whoIsWritingR]();
        }

        doInstruction(self.whoIsWriting)

    }

    /* Conversion des données de la carte RFID reçu */
    convertRfidDataToString(str1) {
        console.log("STR : ",str1)
        let hex = "";
        if(str1.length>=13){
            for (let index = 4; index <= 10; index += 2) {
                console.log("STR : ",str1[index])
                hex += str1[index].toString(16);
            }
            let str = '';
            for (let n = 0; n < hex.length; n += 2) {
                str += String.fromCharCode(parseInt(hex.substring(n, n + 2), 16));
            }
            return str;
        }
    }

}

/* Export du module */
module.exports = Serial;
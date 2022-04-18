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
        self.port.on('data', self.onData);

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

    onData(dataR) {
        console.log("From Serial.js [92 ] : Données reçu.", dataR)
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
        let adr = "";
        self.whoIsWriting = whosWritingR
        return new Promise((resolve, reject) => {
            console.log("From Serial.js [137] : Ecriture du module",self.whoIsWriting, " adr : ", dataToSend[0])
            adr = dataToSend[0];
            self.port.write(dataToSend, (err) => {
                if (err) { console.log("From Serial.js [140] :  ", err) }
            })
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
                        adr: adr,
                        data: self.dataPromise,
                    });
                }
            }, 1500)
        })
    }

    /* A venir ... (lecture des mots a lire ) */
    instructToDo() {

        
        self.dataPromise = "";
        //Variable pour vérifier si  i
        //On créer et stock le nombre de bits de donneés
        var nbDataBits = self.dataReceive[2];
        var stringHex = "";
        //On le converti en entier
        nbDataBits = parseInt(nbDataBits);
        switch (self.whoIsWriting) {
            //Lecture 8 mot = RFID
            case "rfid":
                //console.log(self.dataHex)
                self.dataPromise = self.convertRfidDataToString(self.dataReceive)
                break;
            case "wattMeter":
                //On récupère tout les bits de donneés
                for (let index = 3; index < 3 + nbDataBits; index++) {
                    //On concat les bits qui sont convertis en HEXA
                    
                    self.dataPromise += self.dataReceive[index].toString(16);
                }
                //Conversion
                //self.dataPromise = parseInt(self.dataPromise, 16)
                console.log("---------------------------------------")
                break;
            case "him":
                console.log("From Serial.js [189] : him data receive.")
                console.log("---------------------------------------")
                break;
            default:
                console.log("erreur");
                break;
        }
    }


    /* Conversion des données de la carte RFID reçu */
    convertRfidDataToString(str1) {
        // Converion en String , récupération des données nécéssaires , et suppression des virgules */
        var hex = str1.toString();
        hex = hex.substr(3, 8)
        return hex;
    }


}

/* Export du module */
module.exports = Serial;
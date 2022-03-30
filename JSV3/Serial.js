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

        /* Paramètres de la communication */
        this.pathPort = pathPortR;
        this.baudRate = baudRateR;
        this.parity = parityR;
        this.nbBit = nbBitR;

        /* Var pour créer la connexion */
        this.port = null;

        // Données
        this.dataReceive;

        // Données en HEXA
        this.dataHex = [];

        this.writeTerminalTimeout = null;

        this.newData = false;

        self = this

        /* Appel des méthodes pour créer la communication serial */
        this.createConnectionPort();

        console.log("From Serial.js : Constructor serial end");
        console.log("---------------------------------------")



    }


    /**
     * Create port communication
     * @param {string} pathPort path of the SERIAL PORT
     * @param {int} baudRate baudRate value 
     */
    createConnectionPort() {

        /* Si le port vaut null il n'a jamais été crée */
        if (this.port != null) { console.error("From Serial.js : Error --> make sure you didn't create a connectionPort two times."); }

        /* Creation du port serial */
        else {
            /* Création de la communication */
            this.port = new this.SerialPort(this.pathPort, {
                baudRate: this.baudRate,
                databits: this.data,
                parity: this.parity
            })

            console.log("From Serial.js : Port connection successfully created : " + this.port.baudRate);
            console.log("---------------------------------------")

            /* Mise en place de tout les listeners*/
            this.allListener();
        }
    }

    /* Regroupe tout les listeners */
    allListener() {

        /* Mise en place des listener d'events */
        this.port.on('open', this.showPortOpen);
        this.port.on('close', this.showPortClose);
        this.port.on('error', this.showError);
        this.port.on('data', (dataR) => {

            this.clearTimeOutWrite();
            this.newData = true;

            console.log("From Serial.js [92 ] : Données reçu.", dataR)
            console.log("---------------------------------------")

            /* On récupère les données reçu */
            this.dataReceive = dataR;

            /* Conversion en hexa */
            this.converTabToHex(this.dataReceive);

            /* Conditions pour conmparer les octets */
            this.instructToDo();

        });


        /* on écoute si sur le serveur nous avons une demande d'écriture de données */
        this.myEmitter.on('readTerminal', (dataR) => {

            console.log("Ser ", dataR)

            switch (dataR) {
                case "0x0b":
                    console.log("From Serial.js : Ecriture Terminal 01")
                    console.log("---------------------------------------")
                    break;
                case "0x0c":
                    console.log("From Serial.js : Ecriture Terminal 02")
                    console.log("---------------------------------------")
                    break;
                case "0x0d":
                    console.log("From Serial.js : Ecriture Terminal 03")
                    console.log("---------------------------------------")
                    break;
                default:
                    break;
            }

        })
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

    /* Ecriture de données sur le port */
    async writeData(dataToSend, whosWriting) {
        /* Ecriture avec*/
        //var index = 0;

        return new Promise((resolve, reject) => {

            switch (whosWriting) {
                case "rfid":
                    console.log("From Serial.js [160] : Ecriture RFID ", dataToSend[0])
                    console.log("---------------------------------------")
                    //Timeout a mettre ici ?
                    this.port.write(dataToSend, (err) => {
                        if(err){this.newData = false;}
                    })
                    
                    break;
                case "borne":
                    console.log("From Serial.js [160] : Ecriture Terminal ", dataToSend[0][0])
                    console.log("---------------------------------------")
                    //Timeout a mettre ici ?
                    dataToSend.forEach(element => {
                        //console.log("Envoie T",index)
                        this.port.write(element, (err => {
                        }))
                    })
                    //index++
                    break;
                default:
                    console.log("From Serial.js [181] : Error whosWriting: ")
                    break;

            }

            setTimeout(() => {
                if (!this.newData) {
                    reject("Error");
                } else {
                    resolve("Resolve");
                    this.newData = false;
                }
            }, 2000)

            console.log("Apres");
        })

    }

    /* Conversion en HEXA */
    converTabToHex(tabToConvert) {

        this.dataHex = [];

        tabToConvert.forEach(element => {

            this.dataHex.push(element.toString(16))
        });

        console.log("From Serial.js : Conversion en HEXA effectuer.");
        console.log("---------------------------------------")
    }

    /* A venir ... (lecture des mots a lire ) */
    instructToDo() {
        var dataDest = " ";
        var keyCode = " ";
        switch (this.dataHex[2]) {
            //Lecture 8 mot = RFID
            case "8":
                console.log("From Serial.js [183] : RFID data receive.")
                console.log("---------------------------------------")
                //console.log(this.dataHex)
                keyCode = this.convertRfid(this.dataHex)
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
                this.emitDataToServ(keyCode, this.dataHex)
                break;
            default:
                break;
        }

    }

    /* ---------------------------------- DATA ---------------------------------- */

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

    emitDataToServ(keyCode) {

        //console.log("Key", keyCode)

        this.myEmitter.emit("new", {
            room: "rfid",
            data: this.dataHex,
            adr: "0x0" + this.dataHex[0],
            keyCode: keyCode
        })

    }

    clearTimeOutWrite() {
        this.writeTerminalTimeout = null;
    }





}

/* Export du module */
module.exports = Serial;
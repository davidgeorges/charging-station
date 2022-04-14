var self = null;

class Terminal {

    /* Constructeur */
    constructor(addressR) {

        /* Import module */
        this.crc16 = require('./CalculCR16')
        this.crc;

        this.emitter = require('./Listener');
        this.myEmitter = this.emitter.myEmitter

        // Adresse de l'instructions MODBUS ( 03 = lire )
        this.listInstructions = [0x03, 0x10];
        // Liste des adresse de commande a éxecuter ( 01 10 = demande ID)
        //[0x01, 0x10], 
        this.listCommand = [[0x01, 0x31], [0x01, 0x39], [0x01, 0x40]];
        // Nombre de mots  a lire  ( 1 ou 2 mots a lire )
        this.listRest = [0x01, 0x02];

        this.nbKwh = 0;
        this.timeP = 0;

        // Lecteur rfid
        this.rfid = {
            adr: 0,
            isUsed: false,
            anyError: false,
            nbRetry: 0,
            frame: [],
        }

        // Interface
        this.him = {
            adr: 0,
            isUsed: false,
            anyError: false,
            nbRetry: 0,
            frame: [],
        }

        // ?
        this.wattMeter = {
            adr: addressR,
            voltage: 0,
            ampere: 0,
            power: 0,
            anyError: false,
            isUsed: false,
            nbRetry: 0,
            allFrame: [[], [], [],]
        }

        this.data = {
            kwh: 0,
            kwhGive: 0,
            timeP: 0,
            prio: 0,
        }

        /* Temps estimé pour le chargement */


        this.nbRetry = 0,
            self = this;

        /* Appel méthode */
        this.createTerminal()


    }

    /**
     * Create port communication
     *
     * 
     */
    createTerminal() {

        self.createAllTr();
    }

    /* Création de tout les trames de la BORNE */
    createAllTr() {
        self.crc = null;
        var indexRest = 0;
        var stringHex = ""
        var dataToChange = null;
        /* Creation des trames */
        for (let index = 0; index < 3; index++) {
            /* Pour savoir le nombre de mots a lire (01 ou 02)*/
            if (index >= 2) {
                indexRest = 1;
            }
            //Boucle pour insérer le bon format '0x' ou 0x0'
            for (let lengthTab = 0; lengthTab <= 5; lengthTab++) {

                switch (lengthTab) {
                    case 0:
                        dataToChange = self.wattMeter.adr;
                        break;
                    case 1:
                        dataToChange = self.listInstructions[0].toString(16);
                        break;
                    case 2:
                        dataToChange = self.listCommand[index][0].toString(16)
                        break;
                    case 3:
                        dataToChange = self.listCommand[index][1].toString(16)
                        break;
                    case 4:
                        dataToChange = "0x00"
                        break;
                    case 5:
                        dataToChange = self.listRest[indexRest].toString(16)
                        break;
                    default:
                        dataToChange = "Err"
                        break;
                }

                if (dataToChange != "Err") {
                    stringHex = self.crc16.determineString(dataToChange)
                }

                if (stringHex != "Err") {
                    self.wattMeter.allFrame[index].push(stringHex + dataToChange);
                }

            }
            //Calcul et Ajout CRC16/MODBUS
            self.crc = self.crc16.calculCRC(self.wattMeter.allFrame[index], 6)
            /* Ajout du crc dans la trame */
            for (let lengtOfCrc = 0; lengtOfCrc < self.crc.length; lengtOfCrc++) {
                stringHex = self.crc16.determineString(self.crc[lengtOfCrc])
                self.wattMeter.allFrame[index].push(stringHex + self.crc[lengtOfCrc])
            }
            //console.log("Test ",self.wattMeter.allFrame[index])
        }
        self.createRfidFrame();
        self.createHimFrame();
    }

    /* Calcul du crc et insertion dans le tableau */
    createRfidFrame() {

        var adr = self.wattMeter.adr
        adr = parseInt(adr, 16) - 20
        adr = adr.toString(16);
        var stringHex = self.crc16.determineString(adr)
        self.rfid.frame.push([
            stringHex + (adr.toString()),
            "0x03",
            "0x00",
            "0x00",
            "0x00",
            "0x04"
        ]);
        //Calcul et Ajout CRC16/MODBUS
        var stringHex = "";
        self.crc = self.crc16.calculCRC(self.rfid.frame[0], 6)
        for (let lengtOfCrc = 0; lengtOfCrc < self.crc.length; lengtOfCrc++) {
            stringHex = self.crc16.determineString(self.crc[lengtOfCrc])
            self.rfid.frame[0].push(stringHex + self.crc[lengtOfCrc])
        }
        self.rfid.adr = self.rfid.frame[0][0]
        //console.log("Ici ",self.rfid.frame[0])
    }

    createHimFrame() {
        var adr = self.wattMeter.adr
        adr = parseInt(adr, 16) - 10
        adr = adr.toString(16);
        var stringHex = self.crc16.determineString(adr)
        self.him.frame.push([
            stringHex + (adr.toString()),
            //Adr fonction lire n mots
            "0x10",
            //Nombre d'octets total
            "0x0C",
            //Intensité
            "0x00",
            "0x00",
            //Consigne courant
            "0x00",
            "0x00",
            //Puissance
            "0x00",
            "0x00",
            "0x00",
            "0x00",
            //Tension
            "0x00",
            "0x00",
            //Durée
            "0x00",
            "0x00",
            //Etat borne
            "0x00",
            "0x00",
            //Crc
            "0xFF",
            "0xFF",

        ]);

        self.him.adr = self.him.frame[0][0]
    }

    resetD() {
        self.nbKwh = 0;
        self.timeP = 0;
    }

}

/* Export du module */
module.exports = Terminal;
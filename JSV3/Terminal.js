var self = null;

class Terminal {

    /* Constructeur */
    constructor(addressR) {

        /* Import module */
        this.crc16 = require('./CalculCR16')

        this.emitter = require('./Listener');
        this.myEmitter = this.emitter.myEmitter

        // Adresse de l'instructions MODBUS ( 03 = lire )
        this.listInstructions = [0x03, 0x10];
        // Liste des adresse de commande a éxecuter ( 01 10 = demande ID)
        this.listCommand = [[0x01, 0x10], [0x01, 0x31], [0x01, 0x39], [0x01, 0x40]];
        // Nombre de mots  a lire  ( 1 ou 2 mots a lire )
        this.listRest = [0x01, 0x02];

        /* CRC-16 Modbus */
        this.crc;

        // Va stocker tout les trames (Volt,Puissance,?,?)
        this.nbKwh = 0;
        this.timeP = 0;

        // Lecteur rfid
        this.rfid = {
            adr: 0,
            isUsed : false,
            anyError: false,
            frame: [],
        }

        // Interface
        this.him = {
            adr: 0,
            isUsed : false,
            anyError: false,
            frame: [],
        }

        // ?
        this.wattMeter = {
            adr: addressR,
            voltage: 0,
            rVoltage: 0,
            acPower: 0,
            isUsed : false,
            anyError: false,
            allFrame: [[],[],[],[],],
        }

        this.data = {
            kwh: 0,
            kwhGive: 0,
            timeP: 0,
            prio: 0,
        }

        /* Temps estimé pour le chargement */
        this.isUsed = false;
        self = this;

        /* Appel méthode */
        this.createBorne()
        

    }

    /**
     * Create port communication
     *
     * 
     */
    createBorne() {

        self.createAllTr();
    }

    /* Création de tout les trames de la BORNE */
    createAllTr() {
        self.crc = null;
        var indexRest = 0;
        var stringHex = ""
        var dataToChange = null;
        /* Creation des trames */
        for (let index = 0; index < 4; index++) {
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
        self.createFrameRfid();
    }

    /* Calcul du crc et insertion dans le tableau */
    createFrameRfid() {
        var stringHex = "";
        var adr = self.wattMeter.adr
        adr = parseInt(adr,16)-20
        if (adr.length == 2) {
            stringHex = "0x";
        } else {
            stringHex = "0x0";
        }
        self.rfid.frame.push([
            stringHex + (adr.toString()), "0x03",
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
        console.log("Ici ",self.rfid.frame[0])
    }

    resetD() {
        self.nbKwh = 0;
        self.timeP = 0;
    }

}

/* Export du module */
module.exports = Terminal;
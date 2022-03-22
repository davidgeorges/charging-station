const { determineString } = require('./CalculCR16');

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
        
        /* CRC-16 */
        this.crc;
        // Va stocker tout les trames
        this.allFrame = [[], [], [], []]

        /* Toute les données */
        this.voltage = 0;
        this.crVoltage = 0;
        this.acPower = 0;

        /* Total Utilisé */
        this.nbKwh = 0;
        this.timeP = 0;

        /* KWH Manquant pour atteindre l'objectif [ Total - Used = left ] 
        this.nbKwhLeft = 0;
        this.timePLeft = 0;*/

        /* KWH Demandé pour le chargement [ données constante ] 
        this.nbKwhAsked = 0;
        this.timePAsked = 0;*/

        this.data = {
            room: " ",
            adr: 0,
            adrT: addressR,
            kwh: 0,
            kwhGive: 0,
            timeP: 0,
            prio: 0,
            isCharging: false,
        }

        /* Temps estimé pour le chargement */
        this.estimateTimeCharging = 0

        /* Appel méthode */
        this.createBorne()
        self = this;

    }

    /**
     * Create port communication
     *
     * 
     */
    createBorne() {

        this.createAllTr();
    }

    /* Création de tout les trames de la BORNE */
    createAllTr() {

        this.crc = null;
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
            for (let lengthTab = 0; lengthTab <=5; lengthTab++) {
        
                switch (lengthTab) {
                    case 0:
                        dataToChange = this.data.adrT;
                        break;
                    case 1:
                        dataToChange = this.listInstructions[0].toString(16);
                        break;
                    case 2:
                        dataToChange = this.listCommand[index][0].toString(16)
                        break;
                    case 3:
                        dataToChange = this.listCommand[index][1].toString(16)
                        break;
                    case 4:
                        dataToChange = "0x00"
                        break;
                    case 5:
                        dataToChange  = this.listRest[indexRest].toString(16)
                        break;
                    default:
                        dataToChange = "Err"
                        break;
                }
                
                if(dataToChange !="Err"){
                    stringHex =  this.crc16.determineString(dataToChange)
                }

                if(stringHex !="Err"){
                    this.allFrame[index].push(stringHex+dataToChange);
                }
  
            }
            //Calcul et Ajout CRC16/MODBUS
            this.crc = this.crc16.calculCRC(this.allFrame[index], 6)

            /* Ajout du crc dans la trame */
            for (let lengtOfCrc = 0; lengtOfCrc < this.crc.length; lengtOfCrc++) {
                stringHex =  this.crc16.determineString(this.crc[lengtOfCrc])
                this.allFrame[index].push(stringHex + this.crc[lengtOfCrc])
            }

            //console.log("Test ",this.allFrame[index])
        }
    }

    resetD() {
        this.nbKwh = 0;
        this.timeP = 0;
    }

    newData() {

        this.timeP = dataR.timeP
        this.nbKwh= dataR.kwh
        console.log(`From Terminal${self.data.adrT} [130] Data receive : [${this.timeP}] , N : [${this.nbKwh}] , NU : [${dataR.kwhGive}]`)
        console.log("---------------------------------------")

        // this.estimateCharging();
    }

    sendData() {

        console.log("From Terminal" + self.data.adrT + " [138] : demande d'envoie de données terminal" + self.data.adrT)
        console.log("---------------------------------------")

        this.data = {
            room: "rfiA",
            adr: this.data.adr,
            adrT: this.data.addressR,
            kwh: this.nbKwh - 2,
            kwhGive: self.data.kwhGive,
            timeP: this.timeP - 1,
            prio: 0,
            isCharging: this.data.isCharging
        }
    }

}

/* Export du module */
module.exports = Terminal;
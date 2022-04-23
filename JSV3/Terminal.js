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
        //[0x01, 0x10], 
        this.listCommand = [[0x01, 0x31], [0x01, 0x39], [0x01, 0x40]];
        // Nombre de mots  a lire  ( 1 ou 2 mots a lire )
        this.listRest = [0x01, 0x02];

        this.nbKwh = 0; // kW demandé par l'utilisateur
        this.timeP = 0; // Temps max possible en charge

        // Lecteur rfid
        this.rfid = {
            adr: 0,
            anyError: false,
            nbRetry: 0,
            frame: [],
            frameContactor: [],
        }

        // Interface
        this.him = {
            adr: 0,
            anyError: false,
            nbRetry: 0,
            frame: [],
        }

        // Mesureur
        this.wattMeter = {
            adr: addressR,
            voltage: ["0x00", "0x00"],
            ampere: ["0x00", "0x00"],
            power: ["0x00", "0x00", "0x00", "0x00"],
            anyError: false,
            nbRetry: 0,
            allFrame: [[], [], [],]
        }



        this.data = {
            kwhLeft: 0, // (kW Restant a charger ) kW fourni - kW a charger
            kwhGive: 0, //kW fourni pour la charge
            timeLeft: 0, // (Temps restant possible en charge) temps écouler - temps de présence
            prio: 0, // Coefficient  de priorité
        }

        this.contactor = {
            frame: [],
        }

        /* Temps estimé pour le chargement */
        this.nbRetry = 0,
            this.isUsed = false;
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

    //Création de tout les trames de la BORNE
    createAllTr() {
        var crc = [];
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
            //Calcul et ajout du crc dans la trame
            self.manageAndAddCrc(self.wattMeter.allFrame[index])
            //console.log("Test ",self.wattMeter.allFrame[index])
        }
        self.createRfidFrame();
        self.createHimFrame();
    }

    //Calcul du crc et insertion dans le tableau
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

        //Calcul et ajout du crc dans la trame
        self.manageAndAddCrc(self.rfid.frame[0])

        self.rfid.adr = self.rfid.frame[0][0]
        //console.log("Ici ",self.rfid.frame[0])
    }

    //Création de la trame RFID (avec des valeurs par défaut)
    createHimFrame() {
        var crc = [];
        //On récupère l'adresse
        var adr = self.wattMeter.adr
        //Ici -10 car tout simplement l'adresse de l'ihm est celle du mesureur -10
        adr = parseInt(adr, 16) - 10
        adr = adr.toString(16);
        var stringHex = self.crc16.determineString(adr)

        self.him.frame.push([
            stringHex + (adr.toString()),
            //Adr fonction lire n mots
            "0x10",
            //Adr premier mot
            "0x00", "0x01",
            //Nombre de mot
            "0x07",
            //Nombre d'octet
            "0x0E",
            //Intensité
            "0x00", "0x00",
            //Consigne courant
            "0x00", "0x00",
            //Puissance
            "0x00", "0x00", "0x00", "0x00",
            //Tension
            "0x00", "0x00",
            //Durée
            "0x00", "0x00",
            //Etat borne
            "0x00", "0x00",
            //Crc
        ]);
        //Calcul et ajout du crc dans la trame
        self.manageAndAddCrc(self.him.frame[0])

        self.him.adr = self.him.frame[0][0]
        
        this.createContactorFrame();
    }

    //Création de la trame du contacteur pour pouvoir fournir ou non la puissance
    createContactorFrame() {
        self.contactor.frame.push([
            self.him.adr,
            //Adr fonction ecriture 1 bit
            "0x05",
            //Adr du bit
            "0x00",
            //Valeur ( ON/OFF (00/FF) par défaut on le met éteint )
            "0x00",
            // ?
            "0x00",
        ]);

        //Calcul et ajout du crc dans la trame
        self.manageAndAddCrc(self.contactor.frame[0])

    }

    //Va éteindre ou allumer le contacteur selon son état actuelle
    switchContactor() {
        var crc = [];
        var newValue;

        switch (self.contactor.frame[0][3]) {
            case "0x00":
                console.log("Switch contactor ON");
                newValue = "0xFF";
                break;
            case "0xFF":
                console.log("Switch contactor OFF");
                newValue = "0x00";
                break;
            default:
                break;
        }

        //Modification du champ du tableau pour allumer ou éteindre le contacteur
        self.contactor.frame[0][3] = newValue

        ////Calcul du crc et ajout manuellement dans la trame
        crc = self.manageCrc(self.contactor.frame[0], self.contactor.frame[0].length - 2)

        //Modification des champs CRC du tableau
        self.contactor.frame[0][5] = crc[0]
        self.contactor.frame[0][6] = crc[1]

    }

    //Va calculer et ajouter le crc dans le tableau
    manageAndAddCrc(tabR) {
        var crc = [];
        var stringHex = "";
        //Calcul et Ajout CRC16/MODBUS
        crc = self.crc16.calculCRC(tabR, tabR.length)
        for (let lengtOfCrc = 0; lengtOfCrc < crc.length; lengtOfCrc++) {
            stringHex = self.crc16.determineString(crc[lengtOfCrc])
            tabR.push(stringHex + crc[lengtOfCrc])
        }
    }

    //Va calculer le crc et le renvoyer
    manageCrc(tabR, tabLength) {
        var crc = [];
        var stringHex = "";
        //Calcul et Ajout CRC16/MODBUS
        crc = self.crc16.calculCRC(tabR, tabLength)
        for (let lengtOfCrc = 0; lengtOfCrc < crc.length; lengtOfCrc++) {
            stringHex = self.crc16.determineString(crc[lengtOfCrc]);
            crc[lengtOfCrc] = stringHex + crc[lengtOfCrc];
        }
        return crc
    }

    resetD() {
        self.nbKwh = 0;
        self.timeP = 0;
    }

}

/* Export du module */
module.exports = Terminal;
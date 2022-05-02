
class Terminal {

    /* Constructeur */
    constructor(addressR ) {

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

        this.allData = {

            rfid: {
                adr: 0,
                anyError: false,
                nbRetry: 0,
                frame: [],
            },

            // Interface
            him: {
                adr: 0,
                anyError: false,
                nbRetry: 0,
                frame: [],
            },

            // Mesureur
            wattMeter: {
                adr: addressR,
                voltage: ["0x00", "0x00"],
                ampere: ["0x00", "0x00"],
                power: ["0x00", "0x00", "0x00", "0x00"],
                anyError: false,
                nbRetry: 0,
                allFrame: [[], [], [],]
            },

            data: {
                kwhLeft: 0, // (kW Restant a charger ) kW fourni - kW a charger
                kwhGive: ["0x00", "0x00"], //kW fourni pour la charge
                timeLeft: 0, // (Temps restant possible en charge) temps écouler - temps de présence
                prio: 0, // Coefficient  de priorité
            },

            contactor: {
                frame: [],
            },
            
            himWeb :{
               tabData : [],
            },

        }

        /* Temps estimé pour le chargement */
        this.nbRetry = 0;
        this.status = "0x00";


        /* Appel méthode */
        this.createTerminal();


    }

    /**
     * Create port communication
     *
     * 
     */
    createTerminal() {

        this.createAllTr();
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
                        dataToChange = this.allData.wattMeter.adr;
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
                        dataToChange = this.listRest[indexRest].toString(16)
                        break;
                    default:
                        dataToChange = "Err"
                        break;
                }

                if (dataToChange != "Err") {
                    stringHex = this.crc16.determineString(dataToChange)
                }

                if (stringHex != "Err") {
                    this.allData.wattMeter.allFrame[index].push(stringHex + dataToChange);
                }

            }
            //Calcul et ajout du crc dans la trame
            this.manageAndAddCrc(this.allData.wattMeter.allFrame[index])
            //console.log("Test ",this.wattMeter.allFrame[index])
        }
        this.createRfidFrame();
        this.createHimFrame();
    }

    //Calcul du crc et insertion dans le tableau
    createRfidFrame() {

        var adr = this.allData.wattMeter.adr
        adr = parseInt(adr, 16) - 20
        adr = adr.toString(16);
        var stringHex = this.crc16.determineString(adr)
        this.allData.rfid.frame.push([
            stringHex + (adr.toString()),
            "0x03",
            "0x00",
            "0x00",
            "0x00",
            "0x04"
        ]);

        //Calcul et ajout du crc dans la trame
        this.manageAndAddCrc(this.allData.rfid.frame[0])

        this.allData.rfid.adr = this.allData.rfid.frame[0][0]
        //console.log("Ici ",this.rfid.frame[0])
    }

    //Création de la trame RFID (avec des valeurs par défaut)
    createHimFrame() {
        //On récupère l'adresse
        var adr = this.allData.wattMeter.adr
        //Ici -10 car tout simplement l'adresse de l'ihm est celle du mesureur -10
        adr = parseInt(adr, 16) - 10
        adr = adr.toString(16);
        var stringHex = this.crc16.determineString(adr)

        this.allData.him.frame.push([
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
        ]);

        //Calcul et ajout du crc dans la trame
        this.manageAndAddCrc(this.allData.him.frame[0])
        this.allData.him.adr = this.allData.him.frame[0][0]

        //Création des données a envoyer pour l'ihm WEB
        this.allData.himWeb.tabData.push([
            stringHex + (adr.toString()),
            //Puissance
            0,
            //Kw restant
            0,
            //Durée
            0,
            //Etat borne
            0,
        ]);

        this.createContactorFrame();
    }

    //Création de la trame du contacteur pour pouvoir fournir ou non la puissance
    createContactorFrame() {
        this.allData.contactor.frame.push([
            this.allData.him.adr,
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
        this.manageAndAddCrc(this.allData.contactor.frame[0])

    }

    //Va éteindre ou allumer le contacteur selon son état actuelle
    switchContactor(valueR) {
        var crc = [];
        var newValue;

        var switchContactorValue = (valueR) => {
            var inputs = {
                "OFF": () => {
                    console.log("From Terminal.js [233] : Switch contactor OFF");
                    newValue = "0x00";
                },
                "ON": () => {
                    console.log("From Terminal.js [233] :  Switch contactor ON");
                    newValue = "0xFF";
                },
            }
            inputs[valueR]();
        }
        //On fait appel 
        switchContactorValue(valueR)

        //Modification du champ du tableau pour allumer ou éteindre le contacteur
        this.allData.contactor.frame[0][3] = newValue

        ////Calcul du crc et ajout manuellement dans la trame
        crc = this.manageCrc(this.allData.contactor.frame[0], this.allData.contactor.frame[0].length - 2)

        //Modification des champs CRC du tableau
        this.allData.contactor.frame[0][5] = crc[0]
        this.allData.contactor.frame[0][6] = crc[1]

    }

    //Va calculer et ajouter le crc dans le tableau
    manageAndAddCrc(tabR) {
        var crc = [];
        var stringHex = "";
        //Calcul et Ajout CRC16/MODBUS
        crc = this.crc16.calculCRC(tabR, tabR.length)
        for (let lengtOfCrc = 0; lengtOfCrc < crc.length; lengtOfCrc++) {
            stringHex = this.crc16.determineString(crc[lengtOfCrc])
            tabR.push(stringHex + crc[lengtOfCrc])
        }
    }

    //Va calculer le crc et le renvoyer
    manageCrc(tabR, tabLength) {
        var crc = [];
        var stringHex = "";
        //Calcul et Ajout CRC16/MODBUS
        crc = this.crc16.calculCRC(tabR, tabLength)
        for (let lengtOfCrc = 0; lengtOfCrc < crc.length; lengtOfCrc++) {
            stringHex = this.crc16.determineString(crc[lengtOfCrc]);
            crc[lengtOfCrc] = stringHex + crc[lengtOfCrc];
        }
        return crc
    }

    //----------------------------- SETTER -----------------------------//

    //Modification des volts au niveau de la trame ihm
    setVoltageHim() {
        //Changement Intensité
        this.allData.him.frame[0][6] = this.allData.wattMeter.voltage[0]
        this.allData.him.frame[0][7] = this.allData.wattMeter.voltage[1]
        this.setCrcHim();
    }

    //Modification des volts au niveau de la trame ihm
    setAmpereHim() {
        //Changement Ampère
        this.allData.him.frame[0][14] = this.allData.wattMeter.ampere[0]
        this.allData.him.frame[0][15] = this.allData.wattMeter.ampere[1]
        this.setCrcHim();
    }

    //Modification de la puissance au niveau de la trame ihm
    setPowerHim() {
        //Changement Puissance
        this.allData.him.frame[0][10] = this.allData.wattMeter.power[0]
        this.allData.him.frame[0][11] = this.allData.wattMeter.power[1]
        this.allData.him.frame[0][12] = this.allData.wattMeter.power[2]
        this.allData.him.frame[0][13] = this.allData.wattMeter.power[3]
        this.setCrcHim();
    }

    //Modifie le nombre de kwh fourni au niveau de la trame ihm ( consigne )
    setKwhGiveHim() {
        //Changement Consigne courant
        this.allData.him.frame[0][8] = this.allData.data.kwhGive[0]
        this.allData.him.frame[0][9] = this.allData.data.kwhGive[1]
        this.setCrcHim();
    }

    //Modification du status au niveau de la trame ihm
    setStatusHim() {
        //Changement Ampère
        this.allData.him.frame[0][19] = this.status
        this.setCrcHim();
    }
    
    setStatusHimWebAdr(){
        this.allData.himWeb.tabData[0] = this.allData.him.adr;
    }

    setStatusHimWeb(){

    }

    //Modification du CRC de la trame ihm
    setCrcHim() {
        var crc = [];
        //Calcul du crc et ajout manuellement dans la trame
        crc = this.manageCrc(this.allData.him.frame[0], this.allData.him.frame[0].length - 2)
        //Modification des champs CRC du tableau
        this.allData.him.frame[0][20] = crc[0]
        this.allData.him.frame[0][21] = crc[1]

    }

    //Modification des volts
    setVoltageValue(valueR) {
        //console.log('S1 : ', this.allData.wattMeter.adr);
        this.allData.wattMeter.voltage[0] = valueR[0];
        this.allData.wattMeter.voltage[1] = valueR[1];
        //console.log("VOLT : ", this.allData.wattMeter.voltage);
        this.setVoltageHim();
    }

    //Modification des ampères
    setAmpereValue(valueR) {
        //console.log('S2 : ', this.allData.wattMeter.adr);
        this.allData.wattMeter.ampere[0] = valueR[0];
        this.allData.wattMeter.ampere[1] = valueR[1];
        //console.log("AMPERE : ", this.allData.wattMeter.ampere);
        this.setAmpereHim();
    }

    //Modification de la puissance
    setPowerValue(valueR) {
        //console.log('S3 : ', this.allData.wattMeter.adr);
        this.allData.wattMeter.power[0] = valueR[0];
        this.allData.wattMeter.power[1] = valueR[1];
        this.allData.wattMeter.power[2] = valueR[2];
        this.allData.wattMeter.power[3] = valueR[3];
        //console.log("POWER: ", this.allData.wattMeter.power);
        this.setPowerHim();
    }

    //Modifie le status de la borne
    setStatus(valueR) {
        this.status = valueR;
        console.log("From Terminal.js [357] : Changing status for : ", valueR);
        this.setStatusHim();
    }

    //Modifie le nombre de kw a charger
    setKwh(valueR) {
        this.nbKwh = valueR;
    }

    //Modifie le temps maximum en charge
    setTimeP(valueR) {
        this.timeP = valueR;
    }

    //Modifie le nombre restant de kw a charger 
    setKwhLeft(valueR) {
        this.allData.data.kwhLeft = valueR;
    }

    //Modifie le temps restant en charge
    setTimeLeft(valueR) {
        this.allData.data.timeLeft = valueR;
    }

    //Modifie le coefficient de priorité 
    setPrio(valueR) {
        this.allData.data.prio = valueR;
    }

    //Modifie le nombre de kwh fourni ( consigne )
    setKwhGive(valueR) {
        this.allData.data.kwhGive = valueR
        this.setKwhGiveHim();
    }

    //Modifie l'état du module
    setAnyError(valueR, whoIsWriting) {
        this.allData[whoIsWriting].anyError = valueR;
        //console.log("changement Error")
    }

    //Modifie le nombre d'essaie restant
    setNbRetry(valueR, whoIsWriting) {
        this.allData[whoIsWriting].nbRetry = valueR;
    }

    //----------------------------- GETTER -----------------------------//

    //Renvoie le nombre restant de kw a charger 
    getKwhLeft() {
        return this.allData.data.kwhLeft;
    }

    //Renvoie le temps restant en charge
    getTimeLeft() {
        return this.allData.data.timeLeft;
    }

    //Renvoie le status de la borne
    getStatus() {
        return this.status;
    }

    //Renvoie l'adresse du module
    getAdr(whoIsWriting) {
        return this.allData[whoIsWriting].adr;
    }

    //Renvoie les trames du mesureur
    getWattMeterFrame() {
        return this.allData.wattMeter.allFrame;
    }

    //Renvoie la trame du rfid
    getRfidFrame() {
        return this.allData.rfid.frame[0];
    }

    getHimFrame() {
        return this.allData.him.frame[0];
    }

    //Renvoie le coefficient de priorité
    getPrio() {
        return this.allData.data.prio;
    }

    //Renvoie les kw fourni
    getKwhGive() {
        return this.allData.data.kwhGive;
    }

    //Renvoie l'état du module
    getAnyError(whoIsWriting) {
        return this.allData[whoIsWriting].anyError;

    }

    //Renvoie le nombre d'essaie du module
    getNbRetry(whoIsWriting) {
        return this.allData[whoIsWriting].nbRetry;
    }

    //Renvoie le status du contacteur
    getStatusContactor() {
        return this.allData.contactor.frame[0][3];
    }

    resetEveryData() {

    }

}

/* Export du module */
module.exports = Terminal;
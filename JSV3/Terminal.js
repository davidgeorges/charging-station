class Terminal {

    /* Constructeur */
    constructor(addressR) {

        /* Import module */
        this.crc16 = require('./calculCR16')

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
                status: "canBeRead",
                nbRetry: 0,
                frame: [],
            },

            // Interface
            him: {
                adr: 0,
                status: "canBeRead",
                nbRetry: 0,
                frame: [],
            },

            // Mesureur
            wattMeter: {
                adr: addressR,
                voltage: ["0x00", "0x00"],
                ampere: ["0x00", "0x00"],
                power: ["0x00", "0x00", "0x00", "0x00"],
                status: "canBeRead",
                nbRetry: 0,
                allFrame: [[], [], [],]
            },

            data: {
                kwhLeft: 0, // (kW Restant a charger ) kW fourni - kW a charger
                kwhGive: ["0x00", "0x00"], //kW fourni pour la charge
                timeLeft: 0, // (Temps restant possible en charge) temps écouler - temps de présence
                prio: 0, // Coefficient  de priorité
                timer: 0,
            },

            contactor: {
                frame: [],
            },

            himWeb: {
                tabData: [],
            },

        }

        /* Temps estimé pour le chargement */
        this.nbRetry = 0;
        this.status = "0x00";
        this.intervalTimer = null;

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

        let indexRest = 0;
        let stringHex = ""
        let dataToChange = null;
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

        let adr = this.allData.wattMeter.adr
        adr = parseInt(adr, 16) - 20
        adr = adr.toString(16);
        let stringHex = this.crc16.determineString(adr)
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
        let adr = this.allData.wattMeter.adr
        //Ici -10 car tout simplement l'adresse de l'ihm est celle du mesureur -10
        adr = parseInt(adr, 16) - 10
        adr = adr.toString(16);
        let stringHex = this.crc16.determineString(adr)

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
            "waiting RFID",
            //Pourcentage de charge possible par rapport a la demande
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
    setContactor(valueR) {
        let crc = [];
        let newValue;

        let switchContactorValue = (valueR) => {
            let inputs = {
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
        let crc = [];
        let stringHex = "";
        //Calcul et Ajout CRC16/MODBUS
        crc = this.crc16.calculCRC(tabR, tabR.length)
        for (let lengtOfCrc = 0; lengtOfCrc < crc.length; lengtOfCrc++) {
            stringHex = this.crc16.determineString(crc[lengtOfCrc])
            tabR.push(stringHex + crc[lengtOfCrc])
        }
    }

    //Va calculer le crc et le renvoyer
    manageCrc(tabR, tabLength) {
        let crc = [];
        let stringHex = "";
        //Calcul et Ajout CRC16/MODBUS
        crc = this.crc16.calculCRC(tabR, tabLength)
        for (let lengtOfCrc = 0; lengtOfCrc < crc.length; lengtOfCrc++) {
            stringHex = this.crc16.determineString(crc[lengtOfCrc]);
            crc[lengtOfCrc] = stringHex + crc[lengtOfCrc];
        }
        return crc
    }

    resetData() {
        this.setAmpereValue(["0x00", "0x00"]);
        this.setVoltageValue(["0x00", "0x00"]);
        this.setPowerValue(["0x00", "0x00", "0x00", "0x00"]);
        this.setKwhGive(["0x00", "0x00"]);
        this.setKwhLeft(0);
        this.setTimeLeft(0);
        this.setPrio(0);
        this.nbKwh = 0;
        this.timeP = 0;
    }

    connectCar(kwhR, timePR, timeLeftR, kwhLeftR, statusR, contactorR, statusRfidR, statusWattMeterR) {
        this.startTimer();
        this.setKwh(kwhR);
        this.setTimeP(timePR);
        this.setTimeLeft(timeLeftR);
        this.setKwhLeft(kwhLeftR)
        this.setStatus(statusR);
        this.setContactor(contactorR)
        this.setStatusModule(statusRfidR, "rfid");
        this.setStatusModule(statusWattMeterR, "wattMeter")
    }

    disconnectCar(statusR, statusRfidR, statusWattMeterR, contactorR) {
        this.stopTimer()
        this.resetData();
        this.setStatus(statusR);
        this.setStatusModule(statusRfidR, "rfid");
        this.setStatusModule(statusWattMeterR, "wattMeter");
        this.setContactor(contactorR);

    }

    brokenDown(statusR) {
        this.setStatusModule("broken", "rfid");
        this.setStatusModule("broken", "wattMeter");
        if (this.allData.data.prio>0) {
            statusR = "0x0B"
        } else {
            this.resetData();
        }
        this.setStatus(statusR);
    }

    startTimer() {
        if (!this.intervalTimer) {
            this.intervalTimer = setInterval(() => {
                this.allData.data.timer++;
                this.setTimerHim();
            }, 60000);
        }
    }

    stopTimer() {
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
    }


    //----------------------------- SETTER -----------------------------//

    //Modification des volts au niveau de la trame ihm
    setVoltageHim(valueR) {
        //Changement Intensité
        this.allData.him.frame[0][6] = valueR[0]
        this.allData.him.frame[0][7] = valueR[1]
        this.setCrcHim();
    }

    //Modification de l'intensité au niveau de la trame ihm
    setAmpereHim(valueR) {
        //Changement Ampère
        this.allData.him.frame[0][14] = valueR[0]
        this.allData.him.frame[0][15] = valueR[1]
        this.setCrcHim();
    }

    //Modification de la puissance au niveau de la trame ihm
    setPowerHim(valueR) {
        //Changement Puissance
        this.allData.him.frame[0][10] = valueR[0]
        this.allData.him.frame[0][11] = valueR[1]
        this.allData.him.frame[0][12] = valueR[2]
        this.allData.him.frame[0][13] = valueR[3]
        this.setCrcHim();
    }

    //Modifie le nombre de kwh fourni au niveau de la trame ihm ( consigne )
    setKwhGiveHim(valueR) {
        //Changement Consigne courant
        this.allData.him.frame[0][8] = valueR[0]
        this.allData.him.frame[0][9] = valueR[1]
        this.setCrcHim();
    }


    //Modifie le nombre de kwh fourni au niveau de la trame ihm ( consigne )
    setKwhGiveHim(valueR) {
        //Changement Consigne courant
        this.allData.him.frame[0][8] = valueR[0]
        this.allData.him.frame[0][9] = valueR[1]
        this.setCrcHim();
    }

    //Modification du status au niveau de la trame ihm
    setStatusHim(valueR) {
        //Changement Ampère
        this.allData.him.frame[0][19] = valueR
        this.setCrcHim();
    }

    //Modification du timer au niveau de la trame ihm
    setTimerHim() {
        var tabHexa = this.crc16.convertIntoHexaBuffer(this.allData.data.timer.toString(16), "timer")
        this.allData.him.frame[0][17] = tabHexa[0]
        this.allData.him.frame[0][18] = tabHexa[1];
        this.setCrcHim();
    }

    //Modification du CRC de la trame ihm
    setCrcHim() {
        let crc = [];
        //Calcul du crc et ajout manuellement dans la trame
        crc = this.manageCrc(this.allData.him.frame[0], this.allData.him.frame[0].length - 2)
        //Modification des champs CRC du tableau
        this.allData.him.frame[0][20] = crc[0]
        this.allData.him.frame[0][21] = crc[1]

    }

    //Modification des volts
    setVoltageValue(valueR) {
        this.allData.wattMeter.voltage[0] = valueR[0];
        this.allData.wattMeter.voltage[1] = valueR[1];
        this.setVoltageHim(valueR);
    }

    //Modification des ampères
    setAmpereValue(valueR) {
        this.allData.wattMeter.ampere[0] = valueR[0];
        this.allData.wattMeter.ampere[1] = valueR[1];
        this.setAmpereHim(valueR);
    }

    //Modification de la puissance
    setPowerValue(valueR) {
        this.allData.wattMeter.power[0] = valueR[0];
        this.allData.wattMeter.power[1] = valueR[1];
        this.allData.wattMeter.power[2] = valueR[2];
        this.allData.wattMeter.power[3] = valueR[3];
        this.setPowerHim(valueR);
    }

    //Modifie le status de la borne
    setStatus(valueR) {
        this.status = valueR;
        this.setStatusHim(valueR);
        this.setWebHimStatus(valueR);
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
        if (valueR < 0) {
            valueR = 0;
        }
        this.allData.data.kwhLeft = valueR;
        this.setWebHimKwhLeft(valueR);
    }

    //Modifie le temps restant en charge
    setTimeLeft(valueR) {
        this.allData.data.timeLeft = valueR;
        this.setWebHimDuration(valueR);
    }

    //Modifie le coefficient de priorité 
    setPrio(valueR) {
        this.allData.data.prio = valueR;
    }

    //Modifie le nombre de kwh fourni ( consigne )
    setKwhGive(valueR) {
        this.allData.data.kwhGive = valueR
        this.setKwhGiveHim(valueR);
        this.setKwhGiveHimWeb(valueR);
    }

    //Modifie l'état du module
    setStatusModule(valueR, whoIsWriting) {
        this.allData[whoIsWriting].status = valueR;
        //console.log("changement Error")
    }

    //Modifie le nombre d'essaie restant
    setNbRetry(valueR, whoIsWriting) {
        this.allData[whoIsWriting].nbRetry = valueR;
    }

    setWebHimStatus(valueR) {
        let getStatus = (val) => {
            let inputs = {
                "0x00": "waiting RFID",
                "0x01": "working",
                "0x02": "stopped",
                "0x03": "broken-down",
                "0x04": "RFID broken-down",
                "0x05": "RFID-HIM broken-down",
                "0x06": "WATTMETER broken-down",
                "0x07": "WATTMETER-HIM broken-down",
                "0x08": "HIM broken-down",
                "0x09": "HIM-WATTMETER broken-down",
                "0x0A": "HIM-RFID broken-down",
                "0x0B": "FATAL ERROR",
                "0x0C": "CONNECTION REFUSED",
            }
            return inputs[val];
        }
        this.allData.himWeb.tabData[0][4] = getStatus(valueR);
    }

    setKwhGiveHimWeb(valueR) {
        //va convertir la puissance depuis sa valeur HEXA et l'insérer dans le tableau
        this.allData.himWeb.tabData[0][1] = (parseInt(valueR[0].substring(2) + valueR[1].substring(2), 16) / 1000);
    }

    setWebHimKwhLeft(valueR) {
        this.allData.himWeb.tabData[0][2] = valueR;
    }

    setWebHimDuration(valueR) {
        this.allData.himWeb.tabData[0][3] = valueR;
    }

    setWebHimPourcentage(valueR) {
        this.allData.himWeb.tabData[0][5] = valueR;
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

    getFrame(whoIsWriting) {
        if (whoIsWriting == "wattMeter") { return this.allData.wattMeter.allFrame; }
        return this.allData[whoIsWriting].frame[0];
    }

    getContactorFrame() {
        return this.allData.contactor.frame[0];
    }

    getWebHimData() {
        return this.allData.himWeb.tabData[0];
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
    getStatusModule(whoIsWriting) {
        return this.allData[whoIsWriting].status;

    }

    //Renvoie le nombre d'essaie du module
    getNbRetry(whoIsWriting) {
        return this.allData[whoIsWriting].nbRetry;
    }

    //Renvoie le status du contacteur
    getStatusContactor() {
        return this.allData.contactor.frame[0][3];
    }

    //Modifie l'état du module
    getStatusModule(whoIsWriting) {
        return this.allData[whoIsWriting].status;
        //console.log("changement Error")
    }




}

/* Export du module */
module.exports = Terminal;
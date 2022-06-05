const { log, Console } = require('console');
const { stat } = require('fs');
const { resolve } = require('path');

let self = null;

class Server {


    constructor() {

        //Import des modules 
        this.http = require('http');
        this.fs = require('fs');
        this.dotenv = require('dotenv').config({ path: "../.env" })

        //Database
        this.mysql = require('../JSV3/Database');
        this.db = new this.mysql();

        //Serial com
        this.Serial = require("../JSV3/Serial");
        this.mySerial = null;

        //CRC-16
        this.crc16 = require('./calculCR16')

        //Terminal ( Borne )
        this.Terminal = require("../JSV3/Terminal");
        //Va contenir les objets de la classe TERMINAL (Borne)
        this.tabTerminal = [];

        /* Récupération  des informations si une des informations n'est pas disponible,
         nous prenons l'information a droite du ou ( || )*/
        this.port = process.env.PORT || 8080;
        this.fichierHTML = process.env.fichierHTML || '../HTML/index.html'
        this.fichierTEST = process.env.fichierTEST || '../JS/Test.js'
        this.fichierCSS = process.env.fichierCSS || '../CSS/headers.css'
        this.maxTerminal = process.env.maxTerminal;
        this.portCom = process.env.portCom;
        this.baudrate = parseInt(process.env.baudrate, 10);
        this.bits = process.env.bits;
        this.parity = process.env.parity;

        //Server app,requête,response
        this.app = null;

        //Socket.io
        this.io = require("socket.io");

        //Tableau des trames a écrire
        this.tabFrameToRead = []
        //Flag pour permettre de toutes les X secondes d'appeler la fonction méthode emit()
        this.canEmit = true;
        //Va contenir l'interval sur la méthode emit()
        this.intervalEmitRfid = null;
        this.intervalWebIhm = null;
        this.nbBorneUsed = 0;

        this.hardReset = {
            data : null,
            status : false,
        }

        //Pour 
        self = this;

        console.log("From Serv.js : Constructor server   end");
        console.log("---------------------------------------")
    }

    /**
     * Créer le serveur http
     * Écoute-les requêtes utilisateur
     * Réponds aux requêtes utilisateurs
     */
    createHttpServer() {
        /* Si le serveur n'a pas encore été crée */
        if (self.app == null) {
            self.app = self.http.createServer(function (req, res) {
                /* Selon la requête on appel la fonction sendFile avec en paramètre la res  ( pour pouvoir répondre à la requête depuis la fonction ),
                on envoie le type de document et le fichier a lire */
                switch (req.url) {
                    case "/":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/index.html')
                        break
                    case "/index.html":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/index.html')
                        break
                    case "/testPanel.html":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/testPanel.html')
                        break
                    case "/JSV3/client.js":
                        self.sendFile(res, 'text/javascript', 'utf-8', '../JSV3/client.js')
                        break
                    case "/JSV3/testPanel.js":
                        self.sendFile(res, 'text/javascript', 'utf-8', '../JSV3/testPanel.js')
                        break
                    case "/dashboard.html":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/dashboard.html')
                        break
                    case "/CSS/headers.css":
                        self.sendFile(res, 'text/html', 'utf-8', '../CSS/headers.css')
                        break
                    case "/CSS/style.css":
                        self.sendFile(res, 'text/html', 'utf-8', '../CSS/style.css')
                        break
                    case "/CSS/main.css":
                        self.sendFile(res, 'text/html', 'utf-8', '../CSS/main.css')
                        break
                    case "/CSS/testPanel.css":
                        self.sendFile(res, 'text/html', 'utf-8', '../CSS/testPanel.css')
                        break
                    case "/CSS/car.css":
                        self.sendFile(res, 'text/html', 'utf-8', '../CSS/car.css')
                        break
                    case "/assets/dist/css/bootstrap.min.css":
                        self.sendFile(res, 'text/html', 'utf-8', "../../assets/dist/css/bootstrap.min.css")
                        break
                    case "/assets/dist/css/bootstrap.min.css.map":
                        self.sendFile(res, 'text/html', 'utf-8', "../../assets/dist/css/bootstrap.min.css.map")
                        break
                    case "/assets/dist/js/bootstrap.bundle.min.js":
                        self.sendFile(res, 'text/html', 'utf-8', "../../assets/dist/js/bootstrap.bundle.min.js")
                        break
                    case "/assets/dist/js/bootstrap.bundle.min.js.map":
                        self.sendFile(res, 'text/html', 'utf-8', "../../assets/dist/js/bootstrap.bundle.min.js.map")
                        break
                    case "/car.png":
                        self.sendFile(res, 'image/jpg', 'Base64', "../IMG/car.png")
                        break
                    case "/car2.png":
                        self.sendFile(res, 'image/jpg', 'Base64', "../IMG/car2.png")
                        break
                    case "/fontawesome-free-5.15.4-web/js/all.js":
                        self.sendFile(res, 'text/html', 'utf-8', "../fontawesome-free-5.15.4-web/js/all.js")
                        break
                    case "/node_modules/socket.io/client-dist/socket.io.js.map":
                        self.sendFile(res, 'text/javascript', 'utf-8', "../../node_modules/socket.io/client-dist/socket.io.js.map")
                        break
                    case "/node_modules/socket.io/client-dist/socket.io.js":
                        self.sendFile(res, 'text/javascript', 'utf-8', "../../node_modules/socket.io/client-dist/socket.io.js")
                        break
                    default:
                        res.writeHead(404);
                        res.end("Page inexistante");
                }
            });
            console.log("From Serv.js : HTTP connection successfully created");
            console.log("---------------------------------------")
        }
    }

    /**
     * Créer la connexion HTTP
     * Instanciation du Socket
     * Instanciation du port serial 
     */
    createHttpConnection(callback) {
        //Lancement du serveur sur le port 8080 
        self.app.listen(self.port, () => {
            console.log(`From Serv.js : Mise en place du serveur http://localhost:${self.port}/`);
            console.log("---------------------------------------");
            //Création socket.io
            self.io = new self.io.Server(self.app)
            //Création du port com
            self.mySerial = new self.Serial(
                self.portCom,
                self.baudrate,
                self.bits,
                self.parity
            );
            callback();
        });
    }



    /**
     * Va répondre a la requête utilisateur
     * @param res Réponse de la requête
     * @param type Type du fichier a envoyer (html / javascript / image )
     * @param encoding L'encodage du fichier (utf-8 / base 64)
     * @param fichier  Nom ou Emplacement du fichier
     */
    sendFile(res, type, encoding, fichier) {
        self.fs.readFile(`./${fichier}`, encoding, (err, content) => {
            if (err) console.log(err);
            res.writeHead(200, { 'Content-Type': type });
            res.write(content, encoding);
            res.end();
        })
    }

    /**
     * Va vérifier si le code RFID est connu dans le BDD et si oui va resolve la promesse avec comme données le temps de présence de l'utilisateur et les kw demandées,
     * sinon on reject avec l'erreur
     * @param valueR objet avec le status de l'écriture de la trame,l'adresse du Rfid qui a écrit la trame et le code de la carte {status: "succes", adr: '0x02", data: "CA84"}
     */
    async checkBdd(valueR) {
        return new Promise(async (resolve, reject) => {
            let dataStatus = {
                err: false,
                status: " ",
            };
            //Si le satus du rfid est en attente et
            if (self.tabTerminal.some(element => (element.getAdr("rfid") == valueR.adr && element.getStatus() == "0x00"))) {
                console.log("From Serv.js [203] : Checking User in BDD");
                await self.db.readData(valueR.data).then((dataR) => {
                    self.determineBddError(dataR.length.toString(), dataStatus)
                    if (!dataStatus.err) { resolve(dataR) } else {
                        let indexTerminal = self.findIndex("rfid", valueR.adr);
                        self.tabTerminal[indexTerminal].setStatus(dataStatus.status);
                        setTimeout(() => {
                            self.tabTerminal[indexTerminal].setStatus("0x00");
                        }, 7000)
                        let newIndex = indexTerminal + 1;
                        self.io.emit("newSimulationFromServ", { id: "b" + newIndex + "b4" })
                        reject((dataStatus.status))
                    }
                })
            } else {
                reject();
            }
        })
    }

    async tryToDisconnect(indexTerminalR) {

        if (self.checkIfNoTimetout() && self.checkIfNoFatalError()) {
            await self.disconnectCar(indexTerminalR)
        } else {
            self.tabTerminal[indexTerminalR].setStatus("0x0F");;
        }

    }

    /**
    * Va écrire les trames des différents modules contenu dans le tableau tabFrameToRead
    */
    async emit() {
        let indextabFrameToRead;
        let indexTerminal;
        let whoIsWriting;

        for (indextabFrameToRead = 0; indextabFrameToRead < self.tabFrameToRead.length; indextabFrameToRead++) {
            whoIsWriting = self.tabFrameToRead[indextabFrameToRead].whoIsWriting
            //On va chercher l'index de l'initiateur de la trame dans le tableau de bornes
            indexTerminal = self.findIndex(whoIsWriting, self.tabFrameToRead[indextabFrameToRead].adr);
            //Si le status est a ok on peut écrire la trame
            if (self.tabTerminal[indexTerminal].getStatusModule(whoIsWriting) == "canBeRead") {
                //On vérifie si le véhicule du chargement est fini Si c'est le cas on gère la fin de chargement
                if ((self.tabTerminal[indexTerminal].getKwhLeft() <= 0 && self.tabTerminal[indexTerminal].getStatus() == "0x01")) {
                    await self.tryToDisconnect(indexTerminal)
                    self.canEmit = true;
                    return;
                }

                if ((self.hardReset.status)) {
                    console.log("dans hard reset " , self.hardReset);
                    self.io.emit("newSimulationFromServ", self.hardReset.data);
                    self.tabTerminal[self.hardReset.data.index].resetData(true)
                    for (let [index, element] of self.tabTerminal.entries()) {
                        if (element.getStatus() == "0x0F") {
                            console.log("forced deco");
                            await self.disconnectCar(index)
                        }
                    }
                    self.calcPrioCoeff();
                    self.hardReset.status = false;
                    self.canEmit = true;
                    return;
                }

                await self.mySerial.writeData(self.tabFrameToRead[indextabFrameToRead].data, whoIsWriting)
                    .then(async (res) => {
                        //Si on a deja eu des erreurs mais que le module communique actuellement
                        if (self.tabTerminal[indexTerminal].getNbRetry(whoIsWriting) > 0) { self.tabTerminal[indexTerminal].setNbRetry(0, whoIsWriting); }
                        switch (whoIsWriting) {
                            case "rfid":
                                await self.rfidProcessing(indexTerminal, res)

                                break;
                            case "wattMeter":
                                self.wattMeterProcessing(res.data, indexTerminal, self.tabFrameToRead[indextabFrameToRead].whatIsWritten)
                                break;
                            default:
                                break;
                        }
                        console.log("---------------------------------------");
                    })
                    .catch((err) => {
                        //Si l'index du nombre d'essais est supérieur ou égal à 2 on met la borne en panne.
                        if (self.tabTerminal[indexTerminal].getNbRetry(whoIsWriting) >= 2) {
                            err.status = "brokenDown";
                        } else {
                            err.status = "error"
                        }
                        self.execErrorMethodFomStatus(err.status, indexTerminal, whoIsWriting)
                        console.log("From Serv.js [277] : Error brokenDown or Timeout");
                        console.log("---------------------------------------");
                    })
            }
        }
        self.canEmit = true;
    }

    getPourcentage = (val) => {
        let inputs = {
            1: [100],
            2: [55, 45],
            3: [38, 34, 28]
        }
        return inputs[val];
    }

    /**
    * Va calculer selon le coefficient de priorités le kw a utilisé
    * @param tabPrioR va contenir les coefficients de priorités
    */
    calculKwh(tabPrioR) {
        let tabPrio = tabPrioR;
        let tabPourcentage = self.getPourcentage(tabPrio.length)

        //Tri croissant du coefficient de priorité
        tabPrio.sort(function (a, b) { return a.prio - b.prio });

        //Pour chaque element du tableau on change la valeur des kwh a fournir
        for (const [indexPrio, elementPrio] of tabPrio.entries()) {
            for (let elementTerminal of self.tabTerminal) {
                if (elementPrio.adr == elementTerminal.getAdr("rfid")) {
                    elementTerminal.setKwhGive(self.crc16.convertIntoHexaBuffer((tabPourcentage[indexPrio] * 70).toString(16), "kwhGive"));
                }
            }
        }

    }


    /**
    * Va calculer le coefficient de priorités par rapport au ratio temps restant et kw restant 
    */
    calcPrioCoeff() {
        let tabPrio = [];
        let nbCalcul = 0;
        self.tabTerminal.forEach(element => {
            if (element.getStatus() == "0x01") {
                nbCalcul++;
                element.setPrio((((element.getTimeLeft() / 3600) / element.getKwhLeft())).toFixed(5));
                tabPrio.push({
                    adr: element.getAdr("rfid"),
                    prio: element.getPrio(),
                })
            }
        });
        self.calculKwh(tabPrio);
    }

    /**
    * Va instancier tous les objets de la classe Terminal.js
    * et insérer les trames RFID,MESUREUR ET IHM dans le tableau des trames a lires.
    * @param nbBorne Nombre d'objets de bornes à instancier
    */
    createAllTerminal(nbBorne) {
        let stringHex = "";
        let indexString;
        for (let index = 0; index < nbBorne; index++) {
            indexString = (index + 21);
            indexString = indexString.toString(16)
            stringHex = self.crc16.determineString(indexString)
            self.tabTerminal.push(new self.Terminal(stringHex + indexString));
            self.insertFrame(index, "rfid")
            self.insertFrame(index, "wattMeter")
            self.insertFrame(index, "him");
        }
        console.log("From Serv.js [360] : Terminal created.")
        console.log("---------------------------------------");
    }

    /**
    * Va retrouver l'index de la borne dans le tableau tabTerminal correspondant au module qui veut écrire
    * @param whoIsWritingR Le nom du module qui écris la trame 
    * @param adrR Adresse du module qui écris la trame
    */
    findIndex(whoIsWritingR, adrR) {
        for (const [index, element] of self.tabTerminal.entries()) {
            if (element.getAdr(whoIsWritingR) == adrR) {
                return index
            }
        }
    }

    /**
    * Va vérifier si nous pouvons appeler la méthode emit()
    */
    checkIfCanEmit() {
        if (self.canEmit == true) {
            //Nous mettons canEmit a false pour interdire a l'intervalle de rappeler cette méthode
            self.canEmit = false;
            self.emit();
        }
    }

    /**
    * Mise en place d'un timeout pour attendre quelques secondes avant de réessayer l'écriture de la trame
    * @param indexR Index de l'objet de la classe Terminal.js qui a un problème avec un de ces modules
    * @param whoIsWritingR Nom du module qui ne communique plus
    */
    emitSetTimeOut(indexR, whoIsWritingR) {
        let nbRetry = self.tabTerminal[indexR].getNbRetry(whoIsWritingR);
        nbRetry++;
        setTimeout(() => {
            self.tabTerminal[indexR].setStatusModule("canBeRead", whoIsWritingR);
            self.tabTerminal[indexR].setNbRetry(nbRetry, whoIsWritingR);
        }, 5000)
    }

    /**
    * Création de l'interval sur la méthode checkIfCanEmit()
    */
    createEmitInteval() {
        if (self.intervalEmitRfid == null) {
            self.intervalEmitRfid = setInterval(this.checkIfCanEmit, 2000);
        }
    }

    /**
    * Création de l'interval sur la méthode sendWebIhm()
    */
    createWebEmitInteval() {
        if (self.intervalWebIhm == null) {
            self.intervalWebIhm = setInterval(this.sendWebIhm, 1000);
        }
    }

    /**
    * Va determiner ce qui est écrit sur la borne Volt , Intensité ou Puissance
    * @param adrInstructR Adresse de l'instruction 
    */
    determineWhatIsWritten(adrInstructR) {
        let whatIsWritten;
        let inputs = {
            "0x31": () => { whatIsWritten = "V" },
            "0x39": () => { whatIsWritten = "A" },
            "0x40": () => { whatIsWritten = "kW" },
        }
        inputs[adrInstructR]();
        return whatIsWritten
    }


    async tryToConnect(indexTerminalR) {

        let newTabPrioFrame = [];
        let tabSaveAllKwhUsed = self.saveAllKwhUsed()
        let newIndex = indexTerminalR + 1;

        if (self.checkIfNoTimetout() && self.checkIfNoFatalError()) {

            self.calcPrioCoeff();
            self.insertPrioFrame("newCar", indexTerminalR, newTabPrioFrame)
            await self.connectCar(indexTerminalR, newTabPrioFrame, tabSaveAllKwhUsed).then((res) => {
                self.sendTabVal();
            }).catch((err) => {
                self.io.emit("newSimulationFromServ", { id: "b" + newIndex + "b4" })
            })
        } else {
            self.tabTerminal[indexTerminalR].resetData(false);
            self.tabTerminal[indexTerminalR].setStatus("0x0E");
            self.tabTerminal[indexTerminalR].setStatusModule("canBeRead", "rfid");
            self.tabTerminal[indexTerminalR].setStatusModule("dontRead", "wattMeter");
            //On redonne les kWh avant le calcul de prio
            for (let [index, element2] of self.tabTerminal.entries()) {
                element2.setKwhGive(tabSaveAllKwhUsed[index])
            }
            self.io.emit("newSimulationFromServ", { id: "b" + newIndex + "b4" })
            setTimeout(() => {
                self.tabTerminal[indexTerminalR].setStatus("0x00");
            }, 7000)
        }

    }

    /**
    * Traitement de données lors de la récéption d'une trame RFID
    * @param indexTerminalR Index de l'objet de la classe Terminal.js qui contient le module rfid qui a écrit
    * @param dataR objet avec le status de l'écriture de la trame,l'adresse du Rfid qui a écrit la trame et le code de la carte {status: "succes", adr: '0x02", data: "CA84"}
    */
    async rfidProcessing(indexTerminalR, dataR) {

        //Si le RFID répond avec une carte de passé
        if (dataR.data != '\x00\x00') {
            await self.checkBdd(dataR).then(async (res) => {
                self.tabTerminal[indexTerminalR].connectCar(res.data[0].nbKwh, res.data[0].timeP, res.data[0].timeP * 60,
                    res.data[0].nbKwh, "0x01", "ON", "dontRead", "canBeRead")
                /*On sauvegarde le kwh utilisé par les véhicules en chargement;
                pour contrer un crash lors d'une éventuelle IHM HS lors de la déconnexion d'un véhicule*/

                await self.tryToConnect(indexTerminalR)


            }).catch((err) => {
                console.log("Froms Serv.js [476] : ", err)
            });
        }

    }


    /**
    * Traitement de données lors de la récéption d'une trame MESUREUR
    * @param dataR Données reçu en hexa
    * @param indexTerminalR Index de l'objet de la classe Terminal.js qui contient le module mesureur qui a écrit
    * @param whatIsWrittenR La nature de la trame écrite (Volt, Ampere, Puissance)
    */
    wattMeterProcessing(dataR, indexTerminalR, whatIsWrittenR) {
        let value = self.crc16.convertIntoHexaBuffer(dataR, whatIsWrittenR);
        //On fait appel 
        self.fromWhatIsWritten(whatIsWrittenR, indexTerminalR, value)
    }

    fromWhatIsWritten = (whatIsWrittenR, indexTerminalR, valueR) => {
        let inputs = {
            "V": () => { self.tabTerminal[indexTerminalR].setVoltageValue(valueR) },
            "A": () => { self.tabTerminal[indexTerminalR].setAmpereValue(valueR) },
            "kW": () => { self.tabTerminal[indexTerminalR].setPowerValue(valueR) },
        }
        inputs[whatIsWrittenR]();
    }


    /**
    * Insertion des trames dans le tableau des trames a lire (tabFrameToRead)
    * @param indexTerminalR Index de l'objet de la classe Terminal.js qui contient le module mesureur qui a écrit
    * @param whoIsWritingR Le nom du module qui écrit
    */
    insertFrame(indexTerminalR, whoIsWritingR) {
        let inputs = {
            "rfid": () => {
                self.tabFrameToRead.push({
                    whoIsWriting: "rfid",
                    data: self.tabTerminal[indexTerminalR].getFrame("rfid"),
                    adr: self.tabTerminal[indexTerminalR].getAdr("rfid"),
                });
            },
            "wattMeter": () => {
                let wattMeterFrame = self.tabTerminal[indexTerminalR].getFrame("wattMeter");
                /* Pour chaque Trame lié au rfid reçu et qui a été accépter par la borne 
                   Nous les insérons dans le tableau des trames a lire (wattMeter) */
                for (let index = 0; index < wattMeterFrame.length; index++) {
                    self.tabFrameToRead.push({
                        whoIsWriting: "wattMeter",
                        data: wattMeterFrame[index],
                        adr: self.tabTerminal[indexTerminalR].getAdr("wattMeter"),
                        whatIsWritten: self.determineWhatIsWritten(wattMeterFrame[index][3])
                    });
                }
            },
            "him": () => {
                self.tabFrameToRead.push({
                    whoIsWriting: "him",
                    data: self.tabTerminal[indexTerminalR].getFrame("him"),
                    adr: self.tabTerminal[indexTerminalR].getAdr("him"),
                });
            },
        }
        inputs[whoIsWritingR]();
    }


    /**
    * Envoie des données a l'ihm de la page web par communication SOCKET 
    */
    sendWebIhm() {
        let ihmWeb;
        for (let element of self.tabTerminal) {
            //Si le status de la borne est en fonctionnement qu'il n'y pas d'erreur sur le mesureur ?
            if (element.getStatus() == "0x01" && (element.getNbRetry("wattMeter") <= 0)) {
                let kwhGive = element.getKwhGive()
                let kwhLeft = element.getKwhLeft()
                let timeLeft = element.getTimeLeft();
                let estimationCharge = element.getEstimationCharge();
                kwhLeft -= (((parseInt(kwhGive[0].substring(2) + kwhGive[1].substring(2), 16)) / 1000) / 3600)
                estimationCharge = kwhLeft / (((parseInt(kwhGive[0].substring(2) + kwhGive[1].substring(2), 16)) / 1000) / 3600)
                timeLeft -= 1
                element.setKwhLeft(kwhLeft)
                element.setTimeLeft(timeLeft.toFixed(2));
                element.setEstimationCharge(estimationCharge.toFixed(2))
            }
            ihmWeb = element.getWebHimData();
            self.io.emit("newValueIhm", ihmWeb)
        }
    }

    /** 
    * Va change le satus des modules en HS
    * @param indexTerminalR Index de l'objet de la classe Terminal.js qui contient le module HS
    * @param whoIsWritingR Le nom du module qui est HS
    */
    //Mettre des modules en HS
    brokenDownModule(indexTerminalR, whoIsWritingR) {
        let status;

        let inputs = {
            "rfid": () => {
                if (self.tabTerminal[indexTerminalR].getNbRetry("him") > 0) {
                    //Rfid ET Mesureur HS
                    status = "0x05"
                } else {
                    status = "0x04"
                }
            },
            "wattMeter": () => {
                if (self.tabTerminal[indexTerminalR].getNbRetry("him") > 0) {
                    //Rfid ET Mesureur HS
                    status = "0x07"
                } else {
                    status = "0x06"
                }
            },
            "him": () => {
                if (self.tabTerminal[indexTerminalR].getNbRetry("rfid") > 0) {
                    //IHM et Rfid HS
                    status = "0x0A"
                } else {
                    if (self.tabTerminal[indexTerminalR].getNbRetry("wattMeter") > 0) {
                        //IHM et Mesureur HS
                        status = "0x09"
                    } else {
                        //IHM HS
                        status = "0x08"
                    }
                }
            },
        }
        inputs[whoIsWritingR]();

        console.log("From Serv.js [615] : ", whoIsWritingR, "HS");

        //Si l"ihm communique pas
        if (self.tabTerminal[indexTerminalR].getNbRetry("him") > 0 || whoIsWritingR == "him") {
            self.tabTerminal[indexTerminalR].setStatusModule("broken", "him")
        }

        if (self.tabTerminal[indexTerminalR].getPrio() > 0) {
            status = "0x0B"
        }

        self.tabTerminal[indexTerminalR].brokenDown(status, "broken", "broken")
    }

    /** 
    * Va changer l'erreur de notre objet et ou on status selon la longueur des données reçu depuis la BDD
    * @param lengthDataR La longueur des données reçu
    * @param L'objet qui va contenir l'erreur et le status
    */
    determineBddError(lengthDataR, dataStatusR) {
        let inputs = {
            "-1": function () {
                dataStatusR.err = true;
                dataStatusR.status = "0x0D";
            },
            "0": function () {
                dataStatusR.err = true;
                dataStatusR.status = "0x10";
            },
            "1": function () {
                dataStatusR.status = "userAvailable";
            },
        }
        inputs[lengthDataR]();
    }

    /**
    * Va éxecuter des méthodes d'erreur selon le status reçu 
    * @param  statusR Contient l'erreur reçu
    * @param indexTerminalR Index de l'objet de la classe Terminal.js qui contient le module qui a une erreur
    * @param whoIsWritingR Le nom du module qui a une erreur
    */
    execErrorMethodFomStatus(statusR, indexTerminalR, whoIsWritingR) {
        let inputs = {
            "error": () => {
                self.tabTerminal[indexTerminalR].setStatusModule("timeout", whoIsWritingR)
                self.emitSetTimeOut(indexTerminalR, whoIsWritingR)
            },
            "brokenDown": () => {
                console.log("Broken")
                self.brokenDownModule(indexTerminalR, whoIsWritingR);
            },
        }
        inputs[statusR]();
    }

    sendTabVal() {
        let tabVal = [];
        for (const element of self.tabTerminal) {
            if (element.getStatus() == "0x01") {
                let value = element.getKwhGive()
                tabVal.push((parseInt(value[0].substring(2) + value[1].substring(2), 16) / 1000))
                tabVal.push(parseInt(element.getKwhGiveHim(), 16))
            } else {
                tabVal.push(0)
                tabVal.push(0)
            }
        }
        self.io.emit("newSimulationFromServ", { id: "bb", tabVal })
    }
    /**
    * Déconnexion d'un véhicule
    * @param  indexTerminalR L'index de l'élement du tableau des bornes qui vient se de déconnecter
    */
    async disconnectCar(indexTerminalR) {
        console.log("L 692");
        /*On sauvegarde le kwh utilisé par les véhicules en chargement;
        pour contrer un crash lors d'une éventuelle IHM HS lors de la déconnexion d'un véhicule*/
        let tabSaveAllKwhUsed = self.saveAllKwhUsed()

        let newTabPrioFrame = []
        let newIndex = indexTerminalR+1

        self.tabTerminal[indexTerminalR].setContactor("OFF");
        self.tabTerminal[indexTerminalR].setStatus("0x00")
        self.calcPrioCoeff()
        self.insertPrioFrame("discoCar", indexTerminalR, newTabPrioFrame);
        console.log("L 704");
        await self.writePrioFrame(newTabPrioFrame).then((res) => {
            console.log("L 710");
            self.tabTerminal[indexTerminalR].disconnectCar("canBeRead", "dontRead")
            self.io.emit("newSimulationFromServ", { id: "b" + newIndex + "b4" })
            self.sendTabVal();
            self.nbBorneUsed--;

        }).catch((err) => {
            console.log("L 713");
            self.refuseDisconnection(err.adr, indexTerminalR, tabSaveAllKwhUsed)
        })

    }

    /**
    * On refuse la déconnexion d'un véhicule
    * @param  adrDeconnectionR L'adresse du module him qui demande la déconnexion
    * @param  indexTerminalR L'index de l'élement du tableau des bornes qui vient se de déconnecter
    * @param  tabSaveAllKwhUsedR Tableau des anciens kWs fourni
    */
    refuseDisconnection(adrDeconnectionR, indexTerminalR, tabSaveAllKwhUsedR) {
        console.log("L 723");
        //Si celui qui a crash n'est pas le module qui demande une deco
        if (adrDeconnectionR != self.tabTerminal[indexTerminalR].getAdr("him")) {
            let indexTerminalError = self.findIndex("him", adrDeconnectionR);
            self.tabTerminal[indexTerminalError].brokenDown("0x0B", "broken", "broken");
            self.tabTerminal[indexTerminalR].resetData(false);
            self.tabTerminal[indexTerminalR].setStatus("0x0F");
            console.log("L 730");

        } else {
            self.tabTerminal[indexTerminalR].brokenDown("0x0C", "broken", "broken");
            console.log("L 734");
        }

        //Deco erreur donc on remet les kwh avant le recalcul de prio
        for (let [index, element] of self.tabTerminal.entries()) {
            element.setKwhGive(tabSaveAllKwhUsedR[index])
        }
    }

    /**
    * Connexion d'un véhicule
    * @param  I
    */
    async connectCar(indexTerminalR, newTabPrioFrameR, tabSaveAllKwhUsedR) {

        await self.writePrioFrame(newTabPrioFrameR).then((res) => {
            self.nbBorneUsed++;
        })
            //Si on a un problème d'écriture de trame prioritaire
            .catch((err) => {
                self.refuseNewConnection(err.adr, indexTerminalR, tabSaveAllKwhUsedR);
            })

    }

    /**
    * On refuse la déconnexion d'un véhicule
    * @param  adrDeconnectionR L'adresse du module him qui demande la connexion
    * @param  indexTerminalR L'index de l'élement du tableau des bornes qui vient se de connecter
    * @param  tabSaveAllKwhUsedR Tableau des anciens kWs fourni
    */
    refuseNewConnection(adrDeconnectionR, indexTerminalR, tabSaveAllKwhUsedR) {

        let newIndex = indexTerminalR + 1;
        //Si celui qui a crash n'est pas le nouveau module  
        self.tabTerminal[indexTerminalR].resetData(false);
        self.tabTerminal[indexTerminalR].brokenDown("0x0E", "canBeRead", "dontRead")
        if (adrDeconnectionR != self.tabTerminal[indexTerminalR].getAdr("him")) {
            console.log("L 768");
            let indexTerminalError = self.findIndex("him", adrDeconnectionR);
            self.tabTerminal[indexTerminalError].brokenDown("0x0B", "broken", "broken")
            //On redonne les kWh avant le calcul de prio
            for (let [index, element2] of self.tabTerminal.entries()) {
                element2.setKwhGive(tabSaveAllKwhUsedR[index])
            }   

        } else {
            console.log("L 777");
            self.calcPrioCoeff();
        }
      
        self.io.emit("newSimulationFromServ", { id: "b" + newIndex + "b4" });

        setTimeout(() => {
            self.tabTerminal[indexTerminalR].setStatus("0x00");
        }, 7000)
        console.log("L 787");
    }

    /**
    * Ecriture des trames prioritaires
    * @param  tabReceive Le tableau des trames prioritaires
    */
    async writePrioFrame(tabReceive) {
        return new Promise(async (resolve, reject) => {
            let errR = false;

            for (const element of tabReceive) {
                await self.mySerial.writeData(element.data, element.whoIsWriting).then((res) => {
                    console.log("Froms Serv.js [810] : sucess write")
                }).catch((err) => {
                    errR = true;
                    console.log("Froms Serv.js [813] : fail write")
                })
                if (errR) {
                    return reject(element);
                }
            }
            resolve();
        })
    }

    checkIfNoTimetout() {

        for (const element of self.tabTerminal) {

            if (element.getNbRetry("wattMeter") > 0 && element.getKwhGive() > 0 || element.getNbRetry("rfid") > 0 && element.getKwhGive() > 0 || element.getNbRetry("him") > 0 && element.getKwhGive() > 0) {
                return false
            }

        }

        return true;

    }

    checkIfNoFatalError() {

        for (const element of self.tabTerminal) {

            if (element.getStatus() == "0x0B" || element.getStatus() == "0x0C") {
                return false
            }

        }

        return true;

    }

    /**
    * Stock les kwh des bornes en utilisation ou qui ont des erreurs
    * 
    */
    saveAllKwhUsed() {
        let tab = [];
        for (let element of self.tabTerminal) {
            if (element.getStatus() == "0x01" || element.getStatus() == "0x0B" || element.getStatus() == "0x0C" || element.getStatus() == "0x0F") {
                tab.push(element.getKwhGive());
            } else {
                tab.push(["0x00", "0x00"]);
            }
        }
        return tab;
    }

    /**
    * Insère dans un tableau les trames prioritaires
    * @param  natureOfTheCall La nature de l'appel Connexion Ou Deconnexion d'un véhicule
    * @param  indexTerminalR L'index de l'élement du tableau des bornes qui vient se de connecter ou déconnecter
    * @param  newTabPrioFrameR Le tableau des trames prioritaires
    */
    insertPrioFrame(natureOfTheCall, indexTerminalR, newTabPrioFrameR) {
        //Insertion des trames prioritaires
        for (let element of self.tabTerminal) {
            if (element.getStatus() == "0x01" && element.getAdr("rfid") != self.tabTerminal[indexTerminalR].getAdr("rfid")) {
                newTabPrioFrameR.push({
                    whoIsWriting: "him",
                    data: element.getFrame("him"),
                    adr: element.getAdr("him"),
                })
            }
        }
        //Si il est en chargement on insère la trame nouvelle puissance
        newTabPrioFrameR.push({
            whoIsWriting: "him",
            data: self.tabTerminal[indexTerminalR].getFrame("him"),
            adr: self.tabTerminal[indexTerminalR].getAdr("him"),
        })
        //Puis la trame contacteur ON
        newTabPrioFrameR.push({
            whoIsWriting: "contactor",
            data: self.tabTerminal[indexTerminalR].getFrame("contactor"),
            adr: self.tabTerminal[indexTerminalR].getAdr("him"),
        })
        /* Si le véhicule se déconnecte et qu'il y a un autre véhicule en chargement nous devons avoir les trames dans le tableau dans l'ordre suivant : 
            Trame IHM du véhicule se déconnectant
            Trame Contactor du véhicule se déconnectant
            Trame IHM des autres véhicules (connecter) */
        if (natureOfTheCall == "discoCar" && self.nbBorneUsed > 1) {
            let contactorFrame = newTabPrioFrameR[newTabPrioFrameR.length - 1];
            newTabPrioFrameR.splice(newTabPrioFrameR.length - 1, newTabPrioFrameR.length - 2);
            newTabPrioFrameR.reverse();
            newTabPrioFrameR.splice(1, 0, contactorFrame);
        }
        return newTabPrioFrameR;
    }

    /**
    * Gère les sockets
    */
    manageSocket() {
        self.io.on("connection", (socket) => {

            socket.on("newSimulationFromPanel", (dataR) => {
                self.io.emit("newSimulationFromServ", dataR);
                console.log("Reçu du panel", dataR);
            })

            socket.on("disconnectFromPanel", (dataR) => {
                self.tabTerminal[dataR.index].setKwhLeft(0);
                self.io.emit("newSimulationFromServ", dataR);
                console.log("Deco Reçu du panel ", dataR)
            })

            socket.on("hardResetFromPanel", async (dataR) => {
                console.log("hardReset Reçu du panel")
                self.hardReset = {
                    data : dataR,
                    status : true,
                }
            })

        })
    }

}

/* Export du module */
module.exports = Server;
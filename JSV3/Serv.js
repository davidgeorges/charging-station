const { log } = require('console');

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
                    case "/JS/Listener":
                        self.sendFile(res, 'text/javascript', 'utf-8', '../JSV3/Listener.js')
                        break
                    case "/dashboard.html":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/dashboard.html')
                        break
                    case "/informations":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/info.html')
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
            if (err) throw err;
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
        console.log("Test ", valueR)
        return new Promise(async (resolve, reject) => {
            let dataStatus = {
                err: false,
                status: " ",
            };
            //Si le satus du rfid est en attente et
            if (self.tabTerminal.some(element => element.getAdr("rfid") == valueR.adr && element.getStatus() == "0x00" || element.getStatus() == "0x0D")) {
                console.log("From Serv.js [209] : Checking User in BDD");
                await self.db.readData(valueR.data).then((dataR) => {
                    self.fromLength(dataR.length.toString(), dataStatus)
                    if (!dataStatus.err) { resolve(dataR) }
                    reject((dataStatus.status))
                })
            }
        })
    }

    /**
    * Va écrire les trames des différents modules contenu dans le tableau tabFrameToRead
    */
    async emit() {
        let indextabFrameToRead;
        let indexTerminal;
        let whoIsWriting;
        if (self.tabFrameToRead.length) {
            for (indextabFrameToRead = 0; indextabFrameToRead < self.tabFrameToRead.length; indextabFrameToRead++) {
                whoIsWriting = self.tabFrameToRead[indextabFrameToRead].whoIsWriting
                //On va chercher l'index de l'initiateur de la trame dans le tableau de bornes
                indexTerminal = self.findIndex(whoIsWriting, self.tabFrameToRead[indextabFrameToRead].adr);
                //Si le status est a ok on peut écrire la trame
                if (self.tabTerminal[indexTerminal].getStatusModule(whoIsWriting) == "canBeRead") {
                    //On vérifie si le véhicule du chargement est fini Si c'est le cas on gère la fin de chargement
                    if (self.tabTerminal[indexTerminal].getKwhLeft() <= 0 && self.tabTerminal[indexTerminal].getStatus() == "0x01") {
                        console.log("Deco avant 1")
                        await self.disconnectCar(indexTerminal)
                        console.log("Deco avant 2")
                        if (self.tabFrameToRead[indextabFrameToRead].adr == self.tabTerminal[indexTerminal].getAdr("wattMeter")) {
                            self.canEmit = true;
                            return;
                        }
                    }
                    //Si le module qui écrit est l'ihm nous mettons a jour toutes ses valeurs
                    if (whoIsWriting == "ihm") {
                        self.tabTerminal[indexTerminal].setHimValue();
                    }
                    await self.mySerial.writeData(self.tabFrameToRead[indextabFrameToRead].data, whoIsWriting)
                        //Résolution de la promesse avec sucess
                        .then(async (res) => {
                            //Si on a deja eu des erreurs mais que le module communique actuellement
                            if (self.tabTerminal[indexTerminal].getNbRetry(whoIsWriting) > 0) {
                                self.tabTerminal[indexTerminal].setNbRetry(0, whoIsWriting);
                            }
                            switch (whoIsWriting) {
                                case "rfid":
                                    console.log("Tesyt 1 ");
                                    await self.rfidProcessing(indexTerminal, res)
                                    console.log("Tesyt 2");
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
                            self.fromStatus(err.status, indexTerminal, whoIsWriting)
                            console.log("From Serv.js [239] : Error brokenDown or Timeout");
                            console.log("---------------------------------------");
                        })
                }
            }
            self.canEmit = true;
        }
    }

    /**
    * Va calculer selon le coefficient de priorités le kw a utilisé
    * @param tabPrioR va contenir les coefficients de priorités
    */
    calculKwh(tabPrioR) {
        let tabPrio = tabPrioR;
        let getPourcentage = (val) => {
            let inputs = {
                1: [100],
                2: [55, 45],
                3: [38, 34, 28]
            }
            return inputs[val];
        }
        let pourcentage = getPourcentage(tabPrio.length)

        //Tri croissant du coefficient de priorité
        tabPrio.sort(function (a, b) { return a.prio - b.prio });

        //Pour chaque element du tableau on change la valeur des kwh a fournir
        for (const [indexPrio, elementPrio] of tabPrio.entries()) {
            for (var elementTerminal of self.tabTerminal) {
                if (elementPrio.adr == elementTerminal.getAdr("wattMeter")) {
                    elementTerminal.setKwhGive(self.crc16.convertIntoHexaBuffer((pourcentage[indexPrio] * 70).toString(16), "kwhGive"));
                    console.log("From Serv.js [405] : New value kwhGive ", elementTerminal.getKwhGive())
                }
            }
        }

    }

    /**
    * Va calculer le coefficient de priorités par rapport au ratio temps restant et kw restant 
    */
    calcPrioCoeff() {
        let tabPrio = [];
        self.tabTerminal.forEach(element => {
            if (element.getStatus() == "0x01") {
                element.setPrio(((Math.round((element.getTimeLeft() / element.getKwhLeft()) * 100) / 100) / 60).toFixed(2));
                console.log("From Serv.js [426] : Caclul de la prio ", element.getPrio());
                tabPrio.push({
                    adr: element.getAdr("wattMeter"),
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

            //On ne veux pas lire les trames du mesureur au début ( inutile )
            for (const element of self.tabTerminal) {
                element.setStatusModule("dontRead", "wattMeter")
            }
        }
        console.log("From Serv.js [518] : Terminal created.")
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
        let determineWhatIsWritten = (adrInstructR) => {
            let inputs = {
                "0x31": () => { whatIsWritten = "V" },
                "0x39": () => { whatIsWritten = "A" },
                "0x40": () => { whatIsWritten = "kW" },
            }
            inputs[adrInstructR]();
        }
        determineWhatIsWritten(adrInstructR)
        return whatIsWritten
    }

    /**
    * Traitement de données lors de la récéption d'une trame RFID
    * @param indexTerminalR Index de l'objet de la classe Terminal.js qui contient le module rfid qui a écrit
    * @param dataR objet avec le status de l'écriture de la trame,l'adresse du Rfid qui a écrit la trame et le code de la carte {status: "succes", adr: '0x02", data: "CA84"}
    */
    async rfidProcessing(indexTerminalR, dataR) {
        var newTabPrioFrame = [];
        //Si le RFID répond avec une carte de passé
        if (dataR.data != '\x00\x00') {
            await self.checkBdd(dataR).then(async (res) => {
                self.tabTerminal[indexTerminalR].connectCar(res.data[0].nbKwh, res.data[0].timeP, res.data[0].timeP * 3600,
                    res.data[0].nbKwh, "0x01", "ON", "dontRead", "canBeRead")
                self.calcPrioCoeff();
                self.insertPrioFrame("newCar", indexTerminalR, newTabPrioFrame)
                await self.connectCar(indexTerminalR, newTabPrioFrame)
            }).catch((err) => {
                console.log("Froms Serv.js [446] : ", err)
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
        console.log("test ", dataR);
        let value = self.crc16.convertIntoHexaBuffer(dataR, whatIsWrittenR);
        //Selon le satus de l'erreur
        let fromWhatIsWritten = (whatIsWrittenR) => {
            let inputs = {
                "V": () => { self.tabTerminal[indexTerminalR].setVoltageValue(value) },
                "A": () => { self.tabTerminal[indexTerminalR].setAmpereValue(value) },
                "kW": () => { self.tabTerminal[indexTerminalR].setPowerValue(value) },
            }
            inputs[whatIsWrittenR]();
        }
        //On fait appel 
        fromWhatIsWritten(whatIsWrittenR)
    }

    /**
    * Traitement de données lors de la récéption d'une trame IHM
    */
    himProcessing() {
        console.log("From Serv.js [667] : données envoyer et reçu de l'IHM avec succées");
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
                var kwhGive = element.getKwhGive()
                let kwhLeft = element.getKwhLeft()
                let timeLeft = element.getTimeLeft();
                kwhLeft -= (((parseInt(kwhGive[0].substring(2) + kwhGive[1].substring(2), 16)) / 1000) / 3600)

                timeLeft -= 1;
                element.setKwhLeft(kwhLeft)
                element.setTimeLeft(timeLeft.toFixed(2));
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
        var status;
        let fromWhoIsWritingError = (whoIsWritingR) => {
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
        }
        fromWhoIsWritingError(whoIsWritingR)
        console.log("From Serv.js [736] : ", whoIsWritingR, "HS");

        //Si l"ihm communique pas
        if (self.tabTerminal[indexTerminalR].getNbRetry("him") > 0 || whoIsWritingR == "him") {
            self.tabTerminal[indexTerminalR].setStatusModule("broken", "him")
        }

        self.tabTerminal[indexTerminalR].brokenDown(status, "broken", "broken")
    }

    /** 
    * Va changer l'erreur de notre objet et ou on status selon la longueur des données reçu depuis la BDD
    * @param lengthDataR La longueur des données reçu
    * @param L'objet qui va contenir l'erreur et le status
    */
    fromLength(lengthDataR, dataStatusR) {
        let inputs = {
            "-1": function () {
                dataStatusR.err = true;
                dataStatusR.status = "databaseTimeout";
            },
            "0": function () {
                dataStatusR.err = true;
                dataStatusR.status = "userNotAvailable";
            },
            "1": function () {
                dataStatusR.status = "userAvailable";
            },
        }
        inputs[lengthDataR]();
    }

    /**
    * Va éxecuter des méthodes selon le status reçu 
    * @param  statusR Contient l'erreur reçu
    * @param indexTerminalR Index de l'objet de la classe Terminal.js qui contient le module qui a une erreur
    * @param whoIsWritingR Le nom du module qui a une erreur
    */
    fromStatus(statusR, indexTerminalR, whoIsWritingR) {
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

    /**
    * Va rénitialiser tout les attributs de l'objet Terminal
    * @param  indexTerminalR L'index de l'élement du tableau des bornes qui vient se de déconnecter
    */
    async disconnectCar(indexTerminalR) {
        var newTabPrioFrame = [];
        console.log("From Serv.js [682] : deconnexion véhicule");
        self.tabTerminal[indexTerminalR].disconnectCar('0x00', "canBeRead", "dontRead", "OFF")
        self.calcPrioCoeff()
        self.insertPrioFrame("discoCar", indexTerminalR, newTabPrioFrame);
        await self.writePrioFrame(newTabPrioFrame).then((res) => {
            self.nbBorneUsed--;
        }).catch((err) => {

        })

    }

    /**
    * V
    * @param  I
    */
    async connectCar(indexTerminalR, newTabPrioFrameR) {

        return new Promise(async (resolve, reject) => {
            //Si on a une erreur 0B et qu'un véhicule veut se connecter on refuse toute connexion
            for (var element of self.tabTerminal) {
                if (element.getStatus() == "0x0B") {
                    self.tabTerminal[indexTerminalR].resetData();
                    self.tabTerminal[indexTerminalR].setStatus("0x0C")
                    return reject("FatalError");
                }
            }

            await self.writePrioFrame(newTabPrioFrameR).then((res) => {
                self.nbBorneUsed++;
                resolve();
            })
                //Si on a un problème d'écriture de trame prioritaire
                .catch((err) => {
                    self.tabTerminal[indexTerminalR].resetData();
                    self.tabTerminal[indexTerminalR].brokenDown("0x0D", "canBeRead", "canBeRead")
                    self.calcPrioCoeff();
                    reject("ErrorWriting");
                })
        })
    }


    /**
   * Ecriture des trames prioritaires
   * @param  tabReceive Le tableau des trames prioritaires
   */
    async writePrioFrame(tabReceive) {
        return new Promise(async (resolve, reject) => {
            for (const element of tabReceive) {
                console.log("writePrioFrame", element)
                this.sleep(700)
                await self.mySerial.writeData(element.data, element.whoIsWriting)
                    .then((res) => {
                        console.log("Froms Serv.js [672] : sucess write")
                        self.nbBorneUsed++;
                    }).catch((err) => {
                        console.log("Froms Serv.js [675] : fail write")
                        return reject(element)
                    })
            }
            resolve();
        })
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
                console.log("Ici");
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

    sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    }

}

/* Export du module */
module.exports = Server;
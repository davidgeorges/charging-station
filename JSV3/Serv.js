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

    //Envoie des fichier en réponse a la requête utilisateur
    sendFile(res, type, encoding, fichier) {
        self.fs.readFile(`./${fichier}`, encoding, (err, content) => {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': type });
            res.write(content, encoding);
            res.end();
        })
    }

    //check si le code RFID est connu dans le BDD et émet a la borne concerné les données ( tps et kWh ) (AUTO OK)
    async checkBdd(valueR) {
        return new Promise(async (resolve, reject) => {
            let dataStatus = {
                err: false,
                status: " ",
            };
            //Si le satus du rfid est en attente et
            if (self.tabTerminal.some(element => element.getAdr("rfid") == valueR.adr && element.getStatus() == "0x00")) {
                console.log("From Serv.js [209] : Checking User in BDD");
                await self.db.readData(valueR.data).then((dataR) => {
                    self.fromLength(dataR, dataStatus)
                    if (!dataStatus.err) { resolve(dataR) }
                    reject((dataStatus.status))
                })
            }
        })
    }

    //Ecriture des trames stocker dans tabFrameToRead
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

    //Selon le nombre de véhicule , on fourni les kW a utilisé (AUTO PAS OK)
    calculKwh(tabPrioR) {
        let tabPrio = tabPrioR;
        //Obj literals (remplace le switch)
        let getPourcentage = (val) => {
            let inputs = {
                1: [100],
                2: [55, 45],
                3: [38, 34, 28]
            }
            return inputs[val];
        }

        //On fait appel 
        let pourcentage = getPourcentage(tabPrio.length)

        //Tri croissant du coefficient de priorité
        tabPrio.sort(function (a, b) { return a.prio - b.prio });

        //Pour chaque element du tableau on change la valeur des kwh a fournir
        for (const [indexPrio, elementPrio] of tabPrio.entries()) {
            for (var elementTerminal of self.tabTerminal) {
                if (elementPrio.adr == elementTerminal.getAdr("wattMeter")) {
                    elementTerminal.setKwhGive(self.crc16.convertIntoHexa((pourcentage[indexPrio] * 70).toString(16), "kwhGive"));
                    console.log("From Serv.js [405] : New value kwhGive ", elementTerminal.getKwhGive())
                }
            }
        }

    }

    //Calcul le coefficient de prioritées selon les données (Présence et kW) (AUTO PAS OK)
    calcPrioCoeff() {
        /**/
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

    //Creation de toute les bornes (AUTO OK) 
    createAllTerminal(nbBorne) {
        let stringHex = "";
        let indexString;
        for (let index = 0; index < nbBorne; index++) {
            indexString = (index + 21);
            indexString = indexString.toString(16)
            stringHex = self.crc16.determineString(indexString)
            //Création des objets de la classe Terminal
            self.tabTerminal.push(new self.Terminal(stringHex + indexString));

            //Création et insertion des trames RFID,MESUREUR ET IHM
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
        //console.log("T : ",self.tabFrameToRead);
    }

    //Retrouve l'index de l'element a modifier depuis son adresse (AUTO OK)
    findIndex(whoIsWritingR, dataR) {
        for (const [index, element] of self.tabTerminal.entries()) {
            if (element.getAdr(whoIsWritingR) == dataR) {
                return index
            }
        }
    }

    //Va vérifier si nous pouvons appeler la méthode emit()
    checkIfCanEmit() {
        if (self.canEmit == true) {
            //Nous mettons canEmit a false pour interdire a l'intervalle de rappeler cette méthode
            self.canEmit = false;
            self.emit();
        }
    }

    /* Erreur lors de la réception de données, module ne communique plus.
       Mise en place d'un timeout pour laisser quelques secondes avant de réessayer */
    emitSetTimeOut(indexR, whoIsWritingR) {
        let nbRetry = self.tabTerminal[indexR].getNbRetry(whoIsWritingR);
        nbRetry++;
        setTimeout(() => {
            self.tabTerminal[indexR].setStatusModule("canBeRead", whoIsWritingR);
            self.tabTerminal[indexR].setNbRetry(nbRetry, whoIsWritingR);
        }, 5000)
    }

    //Va créer l'interval pour emit les trames
    createEmitInteval() {
        if (self.intervalEmitRfid == null) {
            self.intervalEmitRfid = setInterval(this.checkIfCanEmit, 2500);
        }
    }

    //Va créer l'interval pour emit les trames
    createWebEmitInteval() {
        if (self.intervalWebIhm == null) {
            self.intervalWebIhm = setInterval(this.sendWebIhm, 1000);
        }
    }

    //Pour determiner ce qui est écrit sur la borne Volt , Intensité ou Puissance
    determineWhatIsWritten(adrInstructR) {
        let whatIsWritten;
        //Selon le satus de l'erreur
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

    //Lorsqu'on reçoits des trames du  rfid
    async rfidProcessing(indexTerminalR, dataR) {

        var newTabPrioFrame = [];
        //Si le RFID répond avec une carte de passé
        if (dataR.data != '\x00\x00') {
            await self.checkBdd(dataR).then(async (res) => {

                self.tabTerminal[indexTerminalR].connectCar(res.data[0].nbKwh, res.data[0].timeP, res.data[0].timeP * 3600,
                    res.data[0].nbKwh, "0x01", "ON", "dontRead", "canBeRead")
                self.calcPrioCoeff();
                self.insertPrioFrame("newCar", indexTerminalR, newTabPrioFrame)
                self.nbBorneUsed++;

                await self.writePrioFrame(newTabPrioFrame);
            }).catch((err) => {
                console.log("Froms Serv.js [446] : ", err)
            });
        }

    }

    //Lorsqu'on reçoits des trames du mesureur
    wattMeterProcessing(dataR, indexR, whatIsWrittenR) {
        let value = self.crc16.convertIntoHexa(dataR, whatIsWrittenR);
        //Selon le satus de l'erreur
        let fromWhatIsWritten = (whatIsWrittenR) => {
            let inputs = {
                "V": () => { self.tabTerminal[indexR].setVoltageValue(value) },
                "A": () => { self.tabTerminal[indexR].setAmpereValue(value) },
                "kW": () => { self.tabTerminal[indexR].setPowerValue(value) },
            }
            inputs[whatIsWrittenR]();
        }
        //On fait appel 
        fromWhatIsWritten(whatIsWrittenR)
    }

    //Lorsqu'on reçoits des trames de l'ihm
    himProcessing() {
        console.log("From Serv.js [667] : données envoyer et reçu de l'IHM avec succées");
    }

    insertFrame(indexR, whoIsWritingR) {
        let inputs = {
            "rfid": () => {
                self.tabFrameToRead.push({
                    whoIsWriting: "rfid",
                    data: self.tabTerminal[indexR].getFrame("rfid"),
                    adr: self.tabTerminal[indexR].getAdr("rfid"),
                });
            },
            "wattMeter": () => {
                let wattMeterFrame = self.tabTerminal[indexR].getFrame("wattMeter");
                /* Pour chaque Trame lié au rfid reçu et qui a été accépter par la borne 
                   Nous les insérons dans le tableau des trames a lire (wattMeter) */
                for (let index = 0; index < wattMeterFrame.length; index++) {
                    self.tabFrameToRead.push({
                        whoIsWriting: "wattMeter",
                        data: wattMeterFrame[index],
                        adr: self.tabTerminal[indexR].getAdr("wattMeter"),
                        whatIsWritten: self.determineWhatIsWritten(wattMeterFrame[index][3])
                    });
                }
            },
            "him": () => {
                self.tabFrameToRead.push({
                    whoIsWriting: "him",
                    data: self.tabTerminal[indexR].getFrame("him"),
                    adr: self.tabTerminal[indexR].getAdr("him"),
                });
            },
        }
        inputs[whoIsWritingR]();
    }


    //Envoie données a l'ihm WEB
    sendWebIhm() {
        let ihmFrame;
        let ihmWeb;
        for (let element of self.tabTerminal) {
            ihmFrame = element.getFrame("him");
            ihmWeb = element.getWebHimData();
            //Si le status de la borne est en fonctionnement qu'il n'y pas d'erreur sur le mesureur ?
            if (ihmFrame[19] == "0x01" && (element.getNbRetry("wattMeter") <= 0)) {
                var kwhGive = element.getKwhGive()
                let kwhLeft = element.getKwhLeft()
                let timeLeft = element.getTimeLeft();
                kwhLeft -= (((parseInt(kwhGive[0].substring(2) + kwhGive[1].substring(2), 16)) / 1000) / 3600)
                timeLeft -= 1;
                element.setKwhLeft(kwhLeft)
                element.setTimeLeft(timeLeft.toFixed(2));
                //console.log("Sending .. ", element.allData.himWeb.tabData)
            }
            self.io.emit("newValueIhm", ihmWeb)
        }
    }

    //Mettre des modules en HS
    brokenDownModule(indexTerminal, whoIsWriting) {
        var status;
        let fromWhoIsWritingError = (whoIsWritingR) => {
            let inputs = {
                "rfid": () => {
                    if (self.tabTerminal[indexTerminal].getNbRetry("him") > 0) {
                        //Rfid ET Mesureur HS
                        status = "0x05"
                    } else {
                        status = "0x04"
                    }
                },
                "wattMeter": () => {
                    if (self.tabTerminal[indexTerminal].getNbRetry("him") > 0) {
                        //Rfid ET Mesureur HS
                        status = "0x07"
                    } else {
                        status = "0x06"
                    }
                },
                "him": () => {
                    if (self.tabTerminal[indexTerminal].getNbRetry("rfid") > 0) {
                        //IHM et Rfid HS
                        status = "0x0A"
                    } else {
                        if (self.tabTerminal[indexTerminal].getNbRetry("wattMeter") > 0) {
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
        fromWhoIsWritingError(whoIsWriting)
        console.log("From Serv.js [736] : ", whoIsWriting, "HS");

        //Si l"ihm communique pas
        if (self.tabTerminal[indexTerminal].getNbRetry("him") > 0 || whoIsWriting == "him") {
            self.tabTerminal[indexTerminal].setStatusModule("broken", "him")
        }

        self.tabTerminal[indexTerminal].brokenDown()
    }

    //Selon la longueur des données reçu depuis la BDD nous allons modifier des données et ou éxécuter la méthode calcPrioCoeff
    fromLength(dataR, dataStatusR) {
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
        inputs[dataR.length.toString()]();
    }

    //Selon le status reçu on va éxecuter des méthodes
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
        await self.writePrioFrame(newTabPrioFrame);
        self.nbBorneUsed--;
    }


    async writePrioFrame(tabReceive) {
        for (const element of tabReceive) {
            await self.mySerial.writeData(element.data, element.whoIsWriting)
        }
    }

    /**
    * Insère dans un tableau les trames prioritaires
    * @param  natS La nature de l'appel Connexion Ou Deconnexion d'un véhicule
    * @param  indexTerminalR L'index de l'élement du tableau des bornes qui vient se de connecter ou déconnecter
    * @param  newTabPrioFrameR Le tableau des trames prioritaires
    */
    insertPrioFrame(natS, indexTerminalR, newTabPrioFrameR) {
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
        if (natS == "discoCar" && self.nbBorneUsed > 1) {
            let contactorFrame = newTabPrioFrameR[newTabPrioFrameR.length - 1];
            newTabPrioFrameR.splice(newTabPrioFrameR.length - 1, newTabPrioFrameR.length - 2);
            newTabPrioFrameR.reverse();
            newTabPrioFrameR.splice(1, 0, contactorFrame);
        }
        return newTabPrioFrameR;
    }

}

/* Export du module */
module.exports = Server;
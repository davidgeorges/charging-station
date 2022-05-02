
let self = null;

/* Implementation ... */
class Server {

    //Constructeur 
    constructor() {

        //Import des modules 
        this.http = require('http');
        this.fs = require('fs');
        this.dotenv = require('dotenv').config({ path: "../.env" })

        //Events
        this.emitter = require('./Listener');
        this.myEmitter = this.emitter.myEmitter

        //Database
        this.mysql = require('../JSV3/Database');
        this.db = new this.mysql();

        //Serial com
        this.Serial = require("../JSV3/Serial");
        this.mySerial = null;

        //CRC-16
        this.crc;
        this.crc16 = require('./CalculCR16')

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

        //Nombre de bornes en utilisation
        this.nbBorneUsed = 0;

        this.kwhToUse = 0;

        //Tableau des trames a écrire
        this.tabToRead = []
        //Tableau dont l'écriture a échoué
        this.tabError = []
        //Flag pour permettre de toutes les X secondes d'appeler la fonction méthode emit()
        this.canEmit = true;
        //Va contenir l'interval sur la méthode emit()
        this.intervalEmitRfid = null;

        this.intervalWebIhm = null;

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
        /* Si app ne vaut pas null cela veut dire qu'un serveur a déja été crée */
        if (self.app != null) {
            console.log("From Serv.js : HTTP connection already created");
        } else {
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

    //On gére la communucation de Socket pour l'ihm WEB
    manageSocket() {
        self.io.on('connection', function (socket) {
        });
    }

    //check si le code RFID est connu dans le BDD et émet a la borne concerné les données ( tps et kWh ) (AUTO OK)
    async checkBdd(valueR) {
        console.log("From Serv.js [209] : Checking User in BDD");
        //Utilisation de la méthode readData qui utilise une requête SQL pour lire dans la BDD
        return new Promise((resolve, reject) => {
            var err = false;
            var status = " ";
            //Si le satus de la 
            if (self.tabTerminal.some(element => element.getAdr("rfid") == valueR.adr && element.getStatus() == "0x00")) {
                self.db.readData(valueR.data, (dataR) => {
                    /*Si les données ne valent pas nulles,
                      Le code de la carte existe dans la base de données*/
                    //Obj literals
                    var fromLength = (val) => {
                        var inputs = {
                            "-1": function () {
                                status = "databaseTimeout";
                                console.log("From Serv.js [ 231 ] : Error bdd timeout.");
                                console.log("---------------------------------------");
                                err = true;
                                status = "databaseTimeout";
                            },
                            "0": function () {
                                console.log("From Serv.js [ 231 ] : User not available in BDD.");
                                console.log("---------------------------------------");
                                err = true;
                                status = "userNotAvailable";
                            },
                            "1": function () {
                                console.log("From Serv.js [214] : User available in BDD !")
                                console.log("---------------------------------------")
                                self.nbBorneUsed++;
                                //On Cherche l'index de l'adresse RFID correspondant à celui dans le tableau de bornes
                                let index = self.findIndex("rfid", valueR.adr)
                                /* Modifications des valeurs */
                                self.tabTerminal[index].setKwh(dataR.data[0].nbKwh);
                                self.tabTerminal[index].setTimeP(dataR.data[0].timeP);
                                self.tabTerminal[index].setTimeLeft(dataR.data[0].timeP * 60);
                                self.tabTerminal[index].setKwhLeft(dataR.data[0].nbKwh);
                                self.tabTerminal[index].setStatus("0x01");
                                //On Calcule le coefficient de prioritées et envoie de données
                                self.calcPrio(() => {
                                    status = "userAvailable";
                                });
                            },
                        }
                        inputs[val]();
                    }

                    //Appel object literals ( va éxécuter une fonction selon la longueur de dataR )
                    fromLength(dataR.length.toString())

                    setTimeout(() => {
                        //Si il n'y a pas d'erreur
                        if (!err) {
                            resolve({
                                status: status,
                            });
                        }
                        //Si il y a une erreur
                        else {
                            reject({
                                status: status,
                            });
                        }
                    }, 100)
                });
            } else {
                console.log("From Serial.js [ 216 ] : RFID Already used !");
                console.log("---------------------------------------")
            }
        })
    }

    //Méthode pour écritire les trames
    async emit() {
        console.log("Appel emit")
        //Va contenir l'index pour le tableau de trame a lire
        let index;
        //Va contenir l'index de l'adresse de la trame situé dans le tableau de borne
        let indexTerminal;
        //Va contenir les données reçu lors du resolve ou reject de la promesse
        let dataR = {};
        let whoIsWriting;
        //Si le tableau contient un élément
        if (self.tabToRead.length) {
            //Nous mettons canEmit a false pour interdire a l'intervalle de rappeler cette méthode
            self.canEmit = false;
            //On boucle toutes les trames a lire
            for (index = 0; index < self.tabToRead.length; index++) {
                whoIsWriting = self.tabToRead[index].whoIsWriting
                //On va chercher l'index de l'initiateur de la trame dans le tableau de bornes
                indexTerminal = self.findIndex(whoIsWriting, self.tabToRead[index].adr);
                //Si on n'a pas d'erreur on peut écrire su
                if (!self.tabTerminal[indexTerminal].getAnyError(whoIsWriting)) {
                    //Si le module qui écrit est l'ihm nous mettons a jour toutes ses valeurs
                    if (whoIsWriting == "ihm") {
                        self.tabTerminal[indexTerminal].setHimValue();
                    }
                    //On écrit et on attend la résolution de la promesse
                    await self.mySerial.writeData(self.tabToRead[index].data, whoIsWriting)
                        //Résolution de la promesse avec sucess
                        .then((e) => {
                            dataR = e
                            //Si on a deja eu des erreurs mais que le module communique actuellement
                            if (self.tabTerminal[indexTerminal].getNbRetry(whoIsWriting) > 0) {
                                self.tabTerminal[indexTerminal].setNbRetry(0, whoIsWriting);
                                self.setStatus("0x01");
                            }
                        })
                        //Erreur lors de la promesse
                        .catch((e) => {
                            dataR = e
                            //Si l'index du nombre d'essais est supérieur ou égal à 2 on met la borne en panne.
                            if (self.tabTerminal[indexTerminal].getNbRetry(whoIsWriting) >= 2) {
                                dataR.status = "brokenDown";
                            }

                            //Selon le satus de l'erreur
                            var fromStatus = (statusR) => {
                                var inputs = {
                                    "error": () => {
                                        console.log("Timeout")
                                        self.io.emit(whoIsWriting, {
                                            status: "error",
                                            adr: self.tabTerminal[indexTerminal].getAdr(whoIsWriting),
                                        })
                                        self.tabTerminal[indexTerminal].setAnyError(true, whoIsWriting)
                                        self.emitSetTimeOut(indexTerminal, whoIsWriting)
                                    },
                                    "brokenDown": () => {
                                        console.log("Broken")
                                        //Cette méthode permet d'enlever la trame tu tableau à lire et de l'insérer dans le tableau des trames non fonctionnelles
                                        self.fromTabToReadToTabError(index, whoIsWriting, indexTerminal)
                                        self.io.emit(whoIsWriting, {
                                            status: "broken-down",
                                            adr: self.tabTerminal[indexTerminal].getAdr(whoIsWriting),
                                        })
                                    },
                                }
                                inputs[statusR]();
                            }

                            //On fait appel 
                            fromStatus(dataR.status)

                        })
                    //Si l'écriture s'est bien déroulé
                    if (dataR.status == "sucess") {
                        switch (whoIsWriting) {
                            case "rfid":
                                await self.rfidProcessing(whoIsWriting, index, dataR)
                                    .then((result) => {
                                        index = index - 1;
                                    })
                                    .catch((error) => {
                                        console.log("From Serv.js [354] : ", error)
                                    })
                                break;
                            case "wattMeter":
                                self.wattMeterProcessing(dataR.data, indexTerminal, self.tabToRead[index].whatIsWritten)
                                break;
                            /* si l'ihm réponse devons nous faire qqchose ? 
                            case "him":
                                self.himProcessing(index2)
                                break;*/
                            default:
                                break;
                        }
                    }
                    console.log("---------------------------------------")
                } else {
                    console.log("From Serv.js [311] : Error not writing.")
                }
            }
            // console.log("---------------------------------------")
            self.canEmit = true;
        } else {
            console.log("From Serv.js [319] : tabToRead is empty error !")
        }
    }

    //Selon le nombre de véhicule , on fourni les kW a utilisé (AUTO PAS OK)
    calculKwh(tabPrioR) {

        var tabPrio = tabPrioR;

        //Obj literals (remplace le switch)
        var getPourcentage = (val) => {
            var inputs = {
                1: [100],
                2: [55, 45],
                3: [38, 34, 28]
            }
            return inputs[val];
        }

        //On fait appel 
        var test = getPourcentage(tabPrio.length)

        //Tri croissant du coefficient de priorité
        tabPrio.sort(function (a, b) { return a.prio - b.prio });

        //Pour chaque element du tableau on change la valeur des kwh a fournir
        for (const [indexPrio, elementPrio] of tabPrio.entries()) {
            for (const elementTerminal of self.tabTerminal) {
                if (elementPrio.adr == elementTerminal.getAdr("wattMeter")) {
                    elementTerminal.setKwhGive(self.crc16.convertIntoHexa((test[indexPrio] * 70).toString(16), "kwhGive"));
                    console.log("From Serv.js [405] : New value kwhGive ", elementTerminal.getKwhGive())
                }
            }
        }

    }

    //Calcul le coefficient de prioritées selon les données (Présence et kW) (AUTO PAS OK)
    async calcPrio(callback) {

        /**/
        var tabPrio = [{
            adr: "0x16",
            prio: 22.3,
            percentKwh: 0
        }];

        self.tabTerminal.forEach(element => {
            if (element.getStatus() == "0x01") {
                element.setPrio(Math.round((element.getTimeLeft() / element.getKwhLeft()) * 100) / 100);
                console.log("From Serv.js [426] : Caclul de la prio ", element.getPrio());
                tabPrio.push({
                    adr: element.getAdr("wattMeter"),
                    prio: element.getPrio(),
                    percentKwh: 0
                })
            }
        });

        self.calculKwh(tabPrio);

        callback();
    }

    //Creation de toute les bornes (AUTO OK) 
    createAllTerminal(nbBorne) {
        let stringHex = "";
        let indexString;
        for (let index = 0; index < nbBorne; index++) {
            indexString = (index + 21);
            indexString = indexString.toString(16)
            if (indexString.length == 2) {
                stringHex = "0x";
            } else {
                stringHex = "0x0";
            }
            //Création des objets de la classe Terminal
            self.tabTerminal.push(new self.Terminal(stringHex + indexString));
            //Création de la trame RFID
            self.createRfidFrame(index);
            //Création de la tram IHM
            self.createHimFrame(index);

        }
        console.log("From Serv.js [518] : Terminal created.")
        console.log("---------------------------------------");
        //console.log("T : ",self.tabToRead);
    }

    //Retrouve l'index de l'element a modifier depuis son adresse (AUTO OK)
    findIndex(whoIsWritingR, dataR) {
        for (const [index, element] of self.tabTerminal.entries()) {
            if (element.getAdr(whoIsWritingR) == dataR) {
                // console.log("From Serv.js [478] : Index ", whoIsWritingR, "trouvé ! ", dataR," = ",element.getAdr(whoIsWritingR));
                return index
            }
        }
    }

    //Va vérifier si nous pouvons appeler la méthode emit()
    checkIfCanEmit() {
        if (self.canEmit == true) {
            self.emit();
        }
    }

    /**
     * 
     * @param  adrR  adresse du RFID déclencher
     * @description Va insérer les trames du mesureur
     */
    pushAllFrame(adrR) {
        //On récupère l'index de la borne qui contient l'adresse de ce RFID
        let indexTerminal = self.findIndex("rfid", adrR);
        //On récupère le tableau des trames du mesureur
        let wattMeterFrame = self.tabTerminal[indexTerminal].getWattMeterFrame();
        /* Pour chaque Trame lié au rfid reçu et qui a été accépter par la borne 
           Nous les insérons dans le tableau des trames a lire (wattMeter) */
        for (let index = 0; index < wattMeterFrame.length; index++) {
            self.tabToRead.push({
                whoIsWriting: "wattMeter",
                data: wattMeterFrame[index],
                adr: self.tabTerminal[indexTerminal].getAdr("wattMeter"),
                whatIsWritten: self.determineWhatIsWritten(wattMeterFrame[index][3])
            });
        }
        //On créer et insére la trame HIM après les trames du mesureur
        self.createHimFrame(indexTerminal);
    }

    //On enleve les qui ne sont plus nécéssaire
    removeFromTab(indexR, adrRfidR, whoIsWritingR) {
        switch (whoIsWritingR) {
            //On enleves les trois trames du mesureur
            case "wattMeter":
                for (let index = 0; index < self.tabToRead.length; index++) {
                    if (self.tabToRead[index].data[0] == self.tabToRead[indexR].data[0]) {
                        self.tabToRead.splice(index, 1);
                    }
                }
                break;
            case "rfid":
                //On enleve la trame RFID
                self.tabToRead.splice(indexR, 1);
                //On enleve la trame IHM - pour l'insérer après les trames du mesureur
                self.tabToRead.splice(indexR, 1);
                //On insert toutes les trames du mesureur
                self.pushAllFrame(adrRfidR)
                break;
            default:
                break;
        }
    }

    /* Erreur lors de la réception de données, module ne communique plus.
       Mise en place d'un timeout pour laisser quelques secondes avant de réessayer */
    emitSetTimeOut(indexR, whoIsWritingR) {
        let nbRetry = self.tabTerminal[indexR].getNbRetry(whoIsWritingR);
        nbRetry++;
        setTimeout(() => {
            self.tabTerminal[indexR].setAnyError(false, whoIsWritingR);
            self.tabTerminal[indexR].setNbRetry(nbRetry, whoIsWritingR);
        }, 6000)
    }

    /* Supression des trames ne communiquant plus
       Ensuite nous les insérons dans le tableau cqui contient seulement les trames qui ne communique plus */
    fromTabToReadToTabError(indexR, whoIsWritingR, indexTerminalR) {

        /*Si celui qui écrit est le wattMeter on va rechercher tout ces trames
        et on les supprimes du tableau des trames a lire
        et on les inséres dans le tableau d'erreur*/
        if (whoIsWritingR == "wattMeter") {
            for (let index = 0; index < self.tabToRead.length; index++) {
                if (self.tabToRead[index].data[0] == self.tabToRead[indexR].data[0]) {
                    self.tabError.push(self.tabToRead[index])
                    self.tabToRead.splice(index, 1);
                }
            }

            //Mesureur ne communique plus on éteint le contacteur
            self.tabTerminal[indexTerminalR].switchContactor("OFF")

        } else {
            //on push dans le tableau d'erreur la trame
            self.tabError.push(self.tabToRead[indexR])
            //on enléve la trame qui ne fonctionne plus du tableau a lire
            self.tabToRead.splice(indexR, 1);
        }

        //On met le status en panne
        self.tabTerminal[indexTerminalR].setStatus("0x03")

    }

    //Va créer l'interval pour emit les trames
    createEmitInteval() {

        if (self.intervalEmitRfid == null) {
            self.intervalEmitRfid = setInterval(this.checkIfCanEmit, 2500);
        } else {
            console.log("From Serv.js [549] : Error emit interval already created");
        }
    }

    //Va créer l'interval pour emit les trames
    createWebEmitInteval() {
        if (self.intervalWebIhm == null) {
            self.intervalWebIhm = setInterval(this.sendWebIhm, 1000);
        } else {
            console.log("From Serv.js [549] : Error web emit interval already created");
        }
    }

    //Pour determiner ce qui est écrit sur la borne Volt , Intensité ou Puissance
    determineWhatIsWritten(adrInstructR) {
        var whatIsWritten;
        //Selon le satus de l'erreur
        var determineWhatIsWritten = (adrInstructR) => {
            var inputs = {
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
    async rfidProcessing(whoIsWritingR, indexR, dataR) {
        return new Promise(async (resolve, reject) => {
            var promiseValue;
            var anyError = true;
            //Si le RFID répond avec une carte de passé
            if (dataR.data != '\x00\x00') {
                //Lecture de la bdd avec le code du badge RFID
                await self.checkBdd(dataR).then((result) => {
                    //console.log('561',result)
                    self.io.emit("rfid", {
                        status: "rfid accepted",
                        adr: self.tabTerminal[indexR].getAdr(whoIsWritingR),
                    })
                    //On active le contacteur
                    self.tabTerminal[indexR].switchContactor("ON")
                    //On supprime la trame RFID du tableau
                    self.removeFromTab(indexR, dataR.adr, whoIsWritingR)
                    promiseValue = 'rifdAccepted'
                    anyError = false;
                })
                    .catch((err) => {
                        promiseValue = err;
                    });
            } else {
                promiseValue = { status: "noDataInCard" };
            }
            if (anyError) {
                reject(promiseValue)
            } else {
                resolve(promiseValue)
            }
        });
    }

    //Lorsqu'on reçoits des trames du mesureur
    wattMeterProcessing(dataR, indexR, whatIsWrittenR) {
        var value = self.crc16.convertIntoHexa(dataR.toString(16), whatIsWrittenR);
        //Selon le satus de l'erreur
        var fromWhatIsWritten = (whatIsWrittenR) => {
            var inputs = {
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

    //Créer la trame RFID
    createRfidFrame(indexR) {
        self.tabToRead.push({
            whoIsWriting: "rfid",
            data: self.tabTerminal[indexR].getRfidFrame(),
            adr: self.tabTerminal[indexR].getAdr("rfid"),
        })
    }

    //Créer la trame IHM
    createHimFrame(indexR) {
        self.tabToRead.push({
            whoIsWriting: "him",
            data: self.tabTerminal[indexR].getHimFrame(),
            adr: self.tabTerminal[indexR].getAdr("him"),
        });
    }

    //Envoie données a l'ihm WEB
    sendWebIhm() {
        var ihmSend;
        for (const element of self.tabTerminal) {
            ihmSend = element.getHimFrame();

            //Si le status de la borne est en fonctionnement qu'il n'y pas d'erreur sur le mesureur ?
            if (ihmSend[19] == "0x01" && element.getNbRetry("wattMeter") <= 0) {

                var kwhGive = element.getKwhGive()
                var kwhLeft = element.getKwhLeft()
                //console.log("calcul kwh est", (parseInt(kwhGive[0].substring(2) + kwhGive[1].substring(2), 16)) / 1000)
                kwhLeft -= (((parseInt(kwhGive[0].substring(2) + kwhGive[1].substring(2), 16)) / 1000) / 3600)
                element.setKwhLeft(kwhLeft)

            }

            self.io.emit("newValueIhm", ihmSend)
        }
    }

    disconnectCar() {

    }
}

/* Export du module */
module.exports = Server;
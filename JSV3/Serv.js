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

        //Tableau des trame a écrire
        this.tabToRead = []
        //Tableau dont l'écriture a échoué
        this.tabError = []
        //Flag pour permettre de toutes les X secondes d'appeler la fonction méthode emit()
        this.canEmit = true;
        //Va contenir l'interval sur la méthode emit()
        this.intervalEmitRfid = null;

        this.tabInterval = [];

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
                    case "/style.css":
                        self.sendFile(res, 'text/html', 'utf-8', '../CSS/style.css')
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
            self.io = new self.io.Server(self.app)
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
            /* User or ? connection */
            switch (socket.handshake.query.myParam) {
                case "User":
                    console.log("From Serv.js : User connected");
                    console.log("---------------------------------------")
                    /* Si la chaine vaut " " c'est qu'il n'y a jamais eu de modification sur le panneau */
                    //self.sendHtmlData()
                    break;
                default:
                    console.log(self.pr.error("From Serv.js : Error connected"))
                    console.log("---------------------------------------")
                    break;
            }
        });
    }

    //check si le code RFID est connu dans le BDD et émet a la borne concerné les données ( tps et kWh ) (AUTO OK)
    async checkBdd(valueR) {
        console.log("From Serv.js [209] : Checking User in BDD");
        //Utilisation de la méthode readData qui utilise une requête SQL pour lire dans la BDD
        return new Promise((resolve, reject) => {
            var err = false;
            var status = " ";
            if (self.tabTerminal.some(element => element.rfid.adr == valueR.adr && element.isUsed == false)) {
                self.db.readData(valueR.data, (dataR) => {
                    /*Si les données ne valent pas nulles,
                      Le code de la carte existe dans la base de données*/
                    switch (dataR.length) {
                        case -1:
                            err = true;
                            status = "databaseTimeout";
                            console.log("From Serv.js [ 231 ] : Error bdd timeout.");
                            console.log("---------------------------------------");
                            break;
                        case 0:
                            err = true;
                            status = "userNotAvailable";
                            console.log("From Serv.js [ 231 ] : User not available in BDD.");
                            console.log("---------------------------------------");
                            break;
                        case 1:
                            console.log("From Serv.js [214] : User available in BDD !")
                            console.log("---------------------------------------")

                            //On incrémente le nombre de bornes en utilisation
                            self.nbBorneUsed++;
                            //On Cherche l'index de l'adresse RFID correspondant à celui dans le tableau de bornes
                            let index = self.findIndex("rfid", valueR.adr)

                            /* Modifications des valeurs */
                            self.tabTerminal[index].nbkwh = dataR.data[0].nbKwh;
                            self.tabTerminal[index].timeP = dataR.data[0].timeP;
                            self.tabTerminal[index].data.timeLeft = dataR.data[0].timeP * 60;
                            self.tabTerminal[index].data.kwhLeft = dataR.data[0].nbKwh;
                            self.tabTerminal[index].isUsed = true;

                            //On Calcule le coefficient de prioritées et envoie de données
                            self.calcPrio(() => {
                                status = "userAvailable";
                            });

                            break;
                        default:
                            break;
                    }
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
        let index2;
        //Va contenir les données reçu lors du resolve ou reject de la promesse
        let dataR = {};
        //Va contenir la borne qui essaye d'écrire une trame
        let copyTabTerminal = {};
        //Si le tableau contient un élément
        if (self.tabToRead.length) {
            //Nous mettons canEmit a false pour interdire a l'intervalle de rappeler cette méthode
            self.canEmit = false;
            //On boucle toutes les trames a lire
            for (index = 0; index < self.tabToRead.length; index++) {
                //On va chercher l'index de l'initiateur de la trame dans le tableau de bornes
                index2 = self.findIndex(self.tabToRead[index].whoIsWriting, self.tabToRead[index].adr);
                // On determine qui écrit et on fait une copie de la valeur a modifier grâce a l'index2 trouver juste avant
                copyTabTerminal = self.determineWhoIsWriting(self.tabToRead[index].whoIsWriting, index2)
                //Si on n'a pas d'erreur on peut écrire sur
                if (!copyTabTerminal.anyError) {
                    //On écrit et on attend la résolution de la promesse
                    await self.mySerial.writeData(self.tabToRead[index].data, self.tabToRead[index].whoIsWriting)
                        //Résolution de la promesse avev sucess
                        .then((e) => {
                            dataR = e
                            //Si on a deja eu des erreurs mais que le module communique actuellement
                            if (copyTabTerminal.nbRetry > 0) {
                                copyTabTerminal.nbRetry = 0;
                            }
                        })
                        //Erreur lors de la promesse
                        .catch((e) => {
                            dataR = e
                            //Si l'index du nombre d'essais est supérieur ou égal à 2 on met la borne en panne.
                            if (copyTabTerminal.nbRetry >= 2) {
                                dataR.status = "brokenDown";
                            }
                            //Selon le satus de l'erreur
                            switch (dataR.status) {
                                case "error":
                                    console.log("Timeout")
                                    self.io.emit(self.tabToRead[index].whoIsWriting, {
                                        status: "error",
                                        adr: copyTabTerminal.adr,
                                    })
                                    copyTabTerminal.anyError = true;
                                    self.emitSetTimeOut(copyTabTerminal)
                                    break;
                                //La communication a échoué à 3 FOIS, nous enlevons la trame du tableau à lire et l'insérons dans le tableau des erreurs
                                case "brokenDown":
                                    console.log("Broken")
                                    self.io.emit(self.tabToRead[index].whoIsWriting, {
                                        status: "broken-down",
                                        adr: copyTabTerminal.adr,
                                    })
                                    //Cette méthode permet d'enlever la trame tu tableau à lire et de l'insérer dans le tableau des trames non fonctionnelles
                                    self.fromTabToReadToTabError(index, self.tabToRead[index].whoIsWriting)
                                    break;
                                default:
                                    break;
                            }
                        })

                    //Si l'écriture s'est bien déroulé
                    if (dataR.status == "sucess") {
                        switch (self.tabToRead[index].whoIsWriting) {
                            case "rfid":
                                await self.rfidProcessing(copyTabTerminal, index, dataR)
                                    .then((result) => {
                                        index = index - 1;
                                    })
                                    .catch((error) => {
                                        console.log("From Serv.js [653] : ", error)
                                    })
                                break;
                            case "wattMeter":
                                self.wattMeterProcessing(dataR.data, copyTabTerminal, self.tabToRead[index].whatIsWritten)
                                break;
                            case "him":
                                self.himProcessing(index2)
                                break;
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
            var pourcentage = {
                1: [100],
                2: [55, 45],
                3: [38, 34, 28]
            }
            return pourcentage[val];
        }

        //On fait appel 
        var test = getPourcentage(tabPrio.length)

        //Tri croissant du coefficient de priorité
        tabPrio.sort(function (a, b) { return a.prio - b.prio });

        //Pour chaque element du tableau on chance la valeur des kwh a fournir
        for (const [indexPrio, elementPrio] of tabPrio.entries()) {
            for (const elementTerminal of self.tabTerminal) {
                if (elementPrio.adr == elementTerminal.wattMeter.adr) {
                    //console.log("On donne : ", elementTerminal.wattMeter.adr, "et : ", elementPrio.adr)
                    elementTerminal.data.kwhGive = test[indexPrio] * 7 / 100
                    //console.log("On donne : ", test[indexPrio], "pour : ", elementPrio.prio, " : --> ", elementTerminal.data.kwhGive);
                }
            }
        }

    }

    //Calcul le coefficient de prioritées selon les données (Présence et kW) (AUTO PAS OK)
    async calcPrio(callback) {

        var tabPrio = [{
            adr: "0x16",
            prio: 22.3,
            percentKwh: 0
        }];
        console.log("Ici 1")
        self.tabTerminal.forEach(element => {
            console.log("Ici 2")
            if (element.isUsed) {
                element.data.prio = Math.round((element.data.timeLeft / element.data.kwhLeft) * 100) / 100;
                console.log("Caclul de la prio pour ", element.wattMeter.adr, "rés : ", element.data.prio);
                tabPrio.push({
                    adr: element.wattMeter.adr,
                    prio: element.data.prio,
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
            self.tabTerminal.push(new self.Terminal(stringHex + indexString));
            self.tabToRead.push({
                whoIsWriting: "rfid",
                data: self.tabTerminal[index].rfid.frame[0],
                adr: self.tabTerminal[index].rfid.adr,
            })
        }
        console.log("From Serv.js [518] : Terminal created.")
        console.log("---------------------------------------");
        //console.log("T",this.tabToRead)
    }


    // Retrouve l'index de l'element a modifier (AUTO OK)
    findIndex(val, dataR) {
        let index = 0;
        switch (val) {
            case "rfid":
                for (index = 0; index < self.tabTerminal.length; index++) {
                    if (self.tabTerminal[index].rfid.adr == dataR) {
                        console.log("From Serv.js [478] : Index rfid trouvé ! ", dataR);
                        return index
                    }
                }
                break;
            case "wattMeter":
                for (index = 0; index < self.tabTerminal.length; index++) {
                    if (self.tabTerminal[index].wattMeter.adr == dataR) {
                        console.log("From Serv.js [478] : Index borne trouvé ! :");
                        return index
                    }
                }
                break;
            case "him":
                for (index = 0; index < self.tabTerminal.length; index++) {
                    if (self.tabTerminal[index].him.adr == dataR) {
                        console.log("From Serv.js [478] : Index ihm trouvé ! ");
                        return index
                    }
                }
                break;
            default:
                break;
        }
    }

    //Va vérifier si nous pouvons appeler la méthode emit()
    checkIfCanEmit() {
        if (self.canEmit == true) {
            //console.clear();
            self.emit();
        }
    }

    /**
     * 
     * @param  adrR  adresse du RFID déclencher
     * 
     */
    pushAllFrame(adrR) {
        let indexRfid = self.findIndex("rfid", adrR);
        /* Pour chaque Trame lié au rfid reçu et qui a été accépter par la borne 
           Nous les insérons dans le tableau des trames a lire (wattMeter et  ihm) */
        for (let index = 0; index < self.tabTerminal[indexRfid].wattMeter.allFrame.length; index++) {
            self.tabToRead.push({
                whoIsWriting: "wattMeter",
                data: self.tabTerminal[indexRfid].wattMeter.allFrame[index],
                adr: self.tabTerminal[indexRfid].wattMeter.adr,
                whatIsWritten: self.determineWhatIsWritten(self.tabTerminal[indexRfid].wattMeter.allFrame[index][3])
            });

        }

        self.tabToRead.push({
            whoIsWriting: "him",
            data: self.tabTerminal[indexRfid].him.frame[0],
            adr: self.tabTerminal[indexRfid].him.adr,
        });
        //console.log("LENGTH:", self.tabTerminal[indexRfid].wattMeter.allFrame.length);
    }

    //On enleve la trame qui n'est plus nécéssaire
    emitRemoveFromTab(indexR, adrRfidR) {
        self.tabToRead.splice(indexR, 1);
        console.log("ok receive");
        //Si celui qui a écrit est un rfid , on doit mettre toutes les trames de la borne
        self.pushAllFrame(adrRfidR)
    }

    /* Erreur lors de la réception de données, module ne communique plus.
       Mise en place d'un timeout pour laisser quelques secondes avant de réessayer */
    emitSetTimeOut(dataR) {
        setTimeout(() => {
            dataR.anyError = false;
            dataR.nbRetry++;
        }, 6000)
    }

    /* Supression des trames ne communiquant plus
       Ensuite nous les insérons dans le tableau cqui contient seulement les trames qui ne communique plus */
    fromTabToReadToTabError(indexR, whoIsWritingR) {

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
        }
        //on push dans le tableau d'erreur la trame
        self.tabError.push(self.tabToRead[indexR])
        //on enléve la trame qui ne fonctionne plus du tableau a lire
        self.tabToRead.splice(indexR, 1);
    }

    //Va créer l'interval pour emit les trames
    createEmitInteval() {

        if (self.intervalEmitRfid == null) {
            self.intervalEmitRfid = setInterval(this.checkIfCanEmit, 2500);
        } else {
            console.log("From Serv.js [549] : Error emit interval already created");
        }
    }

    //Pour determiner ce qui est écrit sur la borne Volt , Intensité ou Puissance
    determineWhatIsWritten(adrR) {
        var whatIsWritten;
        switch (adrR) {
            case '0x31':
                whatIsWritten = "V"
                //console.log("VOLT");
                break;
            case '0x39':
                whatIsWritten = "A"
                //console.log("CURRENT");
                break;
            case '0x40':
                whatIsWritten = "kW"
                //console.log("ACTIVE POWER");
                break;
            default:
                self.whatIsWritten = "error"
                break;
        }

        return whatIsWritten
    }

    //Lorsqu'on reçoits des trames du  rfid
    async rfidProcessing(copyTabTerminalR, indexR, valueR) {
        return new Promise(async (resolve, reject) => {
            var promiseValue;
            var anyError = true;
            //Lecture de la bdd avec le code du badge RFID
            await self.checkBdd(valueR).then((result) => {
                //console.log('561',result)
                self.io.emit("rfid", {
                    status: "rfid accepted",
                    adr: copyTabTerminalR.adr,
                })
                //On récupère tout l'objet pour pouvoir faire appel a la méthode pour actionner le contacteur
                var copyTabTerminal = self.determineWhoIsWriting("obj", indexR);
                copyTabTerminal.switchContactor()
                //On supprime la trame RFID du tableau
                self.emitRemoveFromTab(indexR, valueR.adr)
                promiseValue = 'rifdAccepted'
                anyError = false;
            }).catch((err) => {
                promiseValue = err;
            });

            if (anyError) {
                reject(promiseValue)
            } else {
                resolve(promiseValue)
            }

        })

    }

    //Lorsqu'on reçoits des trames du mesureur
    wattMeterProcessing(dataR, tabR, whatIsWrittenR) {
        var value = self.convertIntoHexa(dataR.toString(16), whatIsWrittenR);
        switch (whatIsWrittenR) {
            case "V":
                tabR.voltage = value;
                console.log("VOLT : ", parseInt(tabR.voltage.substring(2, 4) + tabR.voltage.substring(7, 9), 16) / 100, "V");
                console.log("VOLT : ", parseInt(tabR.voltage.substring(2, 4) + tabR.voltage.substring(7, 9), 16));
                break;
            case "A":
                tabR.ampere = value;
                console.log("AMPERE : ", parseInt(tabR.ampere.substring(2, 4) + tabR.ampere.substring(7, 9), 16) / 1000, "A");
                console.log("AMPERE : ", parseInt(tabR.ampere.substring(2, 4) + tabR.ampere.substring(7, 9), 16));
                break;
            case "kW":
                tabR.power = value;
                console.log("POWER : ", parseInt(tabR.power.substring(2, 4) + tabR.power.substring(7, 9) + tabR.power.substring(12, 14) + tabR.power.substring(17, 19), 16) / 1000, "kW");
                console.log("POWER : ", parseInt(tabR.power.substring(2, 4) + tabR.power.substring(7, 9) + tabR.power.substring(12, 14) + tabR.power.substring(17, 19), 16));
                break;
            default:
                break;
        }
    }

    //Lorsqu'on reçoits des trames de l'ihm
    himProcessing(indexR) {

        //On simule les valeurs (kW chargé, restant...)

        //On récupère le mesureur pour récupérer ses valeurs
        var copyTabTerminal = self.determineWhoIsWriting("obj", indexR);

        copyTabTerminal.setNewValueHim();

    }

    //Pour determiner qu'elle est le module qui écrit la trame
    determineWhoIsWriting(whoIsWritingR, indexR) {
        var copyTabTerminal;
        switch (whoIsWritingR) {
            case "rfid":
                copyTabTerminal = self.tabTerminal[indexR].rfid;
                break;
            case "wattMeter":
                copyTabTerminal = self.tabTerminal[indexR].wattMeter;
                break;
            case "him":
                copyTabTerminal = self.tabTerminal[indexR].him;
                break;
            case "obj":
                copyTabTerminal = self.tabTerminal[indexR];
                break;
            default:
                break;
        }
        return copyTabTerminal
    };

    convertIntoHexa(dataR, whatIsWrittenR) {
        var finalValue = "";
        var nbByte;
        var stringHex = " ";
        //Si pair
        //Determine le nombre d'octets
        switch (whatIsWrittenR) {
            case "V":
                nbByte = 2;
                break;
            case "A":
                nbByte = 2;
                break;
            case "kW":
                nbByte = 4;
                break;
            default:
                break;
        }
        const buf = Buffer.allocUnsafe(nbByte);
        buf.writeIntBE("0x" + dataR, 0, nbByte)
        let index = 0;
        buf.forEach(element => {
            if (element.toString(16).length == 1) {
                stringHex = "0x0";
            } else {
                stringHex = "0x";
            }
            finalValue += stringHex + element.toString(16)

            if (index != buf.length - 1) {
                finalValue += ","
            }
            index++;
        });
        return finalValue
    }

    simulateCharge(kwhUsedR, indexR) {

        //On récupère tout l'objet
        var copyTabTerminal = self.determineWhoIsWriting("obj", indexR);
        console.log("TD", copyTabTerminal.data)
        copyTabTerminal.data.kwhLeft = (copyTabTerminal.data.kwhLeft - (kwhUsedR / 3600)).toFixed(3)
        copyTabTerminal.data.timeLeft = Math.round(((copyTabTerminal.data.timeLeft - 0.10) + Number.EPSILON) * 100) / 100

        var dataSend = {
            adr: copyTabTerminal.wattMeter.adr,
            kwhUsed: kwhUsedR,
            kwhRemaining: copyTabTerminal.data.kwhLeft,
            timeRemaining: copyTabTerminal.data.timeLeft,
            //Math.round(((copyTabTerminal.data.timeLeft - copyTabTerminal.timeP) * 60 + Number.EPSILON) * 100) / 100
        }
        this.io.emit("newData", dataSend);

    }
}

/* Export du module */
module.exports = Server;
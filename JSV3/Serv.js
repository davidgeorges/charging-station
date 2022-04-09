

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
        //Pour 
        self = this;

        console.log("From Serv.js : Constructor server   end");
        console.log("---------------------------------------")
    }

    /**
     * Create http server.
     * Listen to user request.
     * Answer to user request
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
                        self.sendFile(res, 'text/html', 'utf-8', "../assets/dist/css/bootstrap.min.css")
                        break
                    case "/assets/dist/css/bootstrap.min.css.map":
                        self.sendFile(res, 'text/html', 'utf-8', "../assets/dist/css/bootstrap.min.css.map")
                        break
                    case "/assets/dist/js/bootstrap.bundle.min.js":
                        self.sendFile(res, 'text/html', 'utf-8', "../assets/dist/js/bootstrap.bundle.min.js")
                        break
                    case "/assets/dist/js/bootstrap.bundle.min.js.map":
                        self.sendFile(res, 'text/html', 'utf-8', "../assets/dist/js/bootstrap.bundle.min.js.map")
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
                        self.sendFile(res, 'text/javascript', 'utf-8', "../node_modules/socket.io/client-dist/socket.io.js.map")
                        break
                    case "/node_modules/socket.io/client-dist/socket.io.js":
                        self.sendFile(res, 'text/javascript', 'utf-8', "../node_modules/socket.io/client-dist/socket.io.js")
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
     * Créer la connexion HTTP.
     * Instanciation du Socket
     * Instanciation du port serial 
     */
    createHttpConnection(callback) {
        // Lancement du serveur sur le port 8080 
        self.app.listen(self.port, () => {
            console.log(`From Serv.js : Mise en place du serveur http://localhost:${self.port}/`);
            console.log("---------------------------------------");
            self.io = new self.io.Server(self.app)
            self.mySerial = new self.Serial("COM11", 9600, 8, 'none');

            callback();
        });
    }

    //Envoie de fichier (AUTO OK)
    sendFile(res, type, encoding, fichier) {
        self.fs.readFile(`./${fichier}`, encoding, (err, content) => {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': type });
            res.write(content, encoding);
            res.end();
        })
    }

    //Envoie les données de chaque borne lors de la connexion d'un utilisateur sur la page WEB (AUTO OK) A MODIFIER
    sendHtmlData() {

        /* Pour chaque rfid on envoie */
        self.tabTerminal.forEach(element => {
            self.io.emit("changeB", element.data)
        });

        /*On change le nombre de borne en utilisation ( html )*/
        self.io.emit("changeTerminalUsed", self.nbBorneUsed)
    }

    //On gére la communucation en Socket pour la page WEB
    manageSocket() {
        self.io.on('connection', function (socket) {
            /* User or ? connection */
            switch (socket.handshake.query.myParam) {
                case "User":
                    console.log("From Serv.js : User connected");
                    console.log("---------------------------------------")
                    /* Si la chaine vaut " " c'est qu'il n'y a jamais eu de modification sur le panneau */
                    self.sendHtmlData()
                    break;
                default:
                    console.log(self.pr.error("From Serv.js : Error connected"))
                    console.log("---------------------------------------")
                    break;
            }
        });
    }

    //check si le code RFID est connu dans le BDD et émet a la borne concerné les données ( tps et kWh ) (AUTO OK)
    checkBdd(data) {
        console.log("From Serv.js [209] : Checking User in BDD");
        console.log("---------------------------------------");

        //Utilisation de la méthode readData qui utilise une requête SQL pour lire dans la BDD
        self.db.readData(data.keyCode, (dataR) => {
            /*Si les données ne valent pas nulles,
              Le code de la carte existe dans la base de données*/
            if (dataR != null) {
                console.log("From Serial.js [214] : User available in BDD !")
                console.log("---------------------------------------")

                //On incrémente le nombre de bornes en utilisation
                self.nbBorneUsed++;

                //On Cherche l'index de l'adresse RFID correspondant à celui dans le tableau de bornes
                let index = self.findIndex("rfid", data.adr)

                /* Modifications des valeurs */
                self.tabTerminal[index].data.kwh = dataR[0].nbKwh;
                self.tabTerminal[index].data.timeP = dataR[0].timeP;
                self.tabTerminal[index].data.kwhGive = 0;
                self.tabTerminal[index].status.isUsed = true;

                //On Calcule le coefficient de prioritées et envoie de données
                self.calcPrio(self.nbBorneUsed - 1, index, () => {
                    self.sendData(self.tabTerminal[index].data);
                });

            } else {
                console.log("From Serv.js [ 231 ] : User not available in BDD.");
                console.log("---------------------------------------");
                self.intervalEmitRfid = setInterval(self.emitRfid, 2000);
            }
        });
    }

    //On vérifie si le Rfid est déjà utilisé ( carte déjà passée et accepté),si Rfid non utilisé-checkbdd (AUTO OK) 
    checkRfidUsed(dataR) {

        //On vérifie si il peut être utilisé (si le rfid existe)
        if (self.checkRfidCanBeUsed(dataR.adr)) {
            //On vérifie s'il n'est pas deja utilisé
            if (self.tabTerminal.some(element => element.rfid.adr == dataR.adr && element.status.isUsed == false)) {
                self.checkBdd(dataR)
            } else {
                console.log("From Serial.js [ 216 ] : RFID Already used !");
                console.log("---------------------------------------")
            }
        } else {
            console.log("From Serial.js [224] Rfid adr non reconnu");
            console.log("---------------------------------------")
        }
    }

    //Envoie les données a la borne (AUTO OK)
    sendData(data) {
        self.io.emit("changeTerminalUsed", self.nbBorneUsed) //Envoie le nombre de borne utilisé pour la page html 
        data.room = "rfid";
        data.status.isUsed = true;
        self.io.emit("changeB", data) //Envoie de la borne utilisé pour la page html 
        //Envoie les données a la borne Ex { room : "firstData", payload : [5,7] }
        self.estimateCharging(data);
    }

    //Demande au port communication d'écrire (AUTO OK)
    async emit() {
        console.log("Appel emit")
        //Va contenir l'index pour le tableau de trame a lire
        let tabLength = self.tabToRead.length;
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
            //On boucle toutes les trames
            for (index = 0; index < self.tabToRead.length; index++) {
                //On va chercher l'index de l'initiateur de la trame dans le tableau de bornes
                index2 = self.findIndex(self.tabToRead[index].whoIsWriting, self.tabToRead[index].adr);
                // On determine qui écrit et on fait une copie de la valeur a modifier
                switch (self.tabToRead[index].whoIsWriting) {
                    case "rfid":
                        copyTabTerminal = self.tabTerminal[index2].rfid;
                        break;
                    case "wattMeter":
                        copyTabTerminal = self.tabTerminal[index2].wattMeter;
                        break;
                    case "him":
                        copyTabTerminal = self.tabTerminal[index2].him;
                        break;
                    default:
                        break;
                }

                console.log("TEST : ", self.tabToRead[index].whoIsWriting,"et ",copyTabTerminal.adr)

                //Si on n'a pas d'erreur on peut écrire
                if (!copyTabTerminal.anyError) {
                    //On écrit et on 
                    await self.mySerial.writeData(self.tabToRead[index].data, self.tabToRead[index].whoIsWriting)
                        .then((e) => {
                            console.log("From Serv.js [273] : Sucess write");
                            dataR = e
                        }).catch((e) => {

                            console.log("From Serv.js [277] : Error timeout");
                            dataR = e
                            //Si l'index du nombre d'essai est supérieur ou égal à 2 on met la borne en panne.
                            if (copyTabTerminal.nbRetry >= 2) {
                                dataR.status = "brokenDown";
                            }
                        })

                    //console.log("Test val :", self.tabToRead[index].data[0], "et ", dataR.adr)
                    //Si l'adresse Rfid reçu est celle actuelle
                    if (self.tabToRead[index].data[0] == dataR.adr) {
                        switch (dataR.status) {
                            //La communication a réussi ont enleve 
                            case "sucess":
                                console.log("Ici 1 ");
                                //Si celui qui écrit est un rfid on enlève du tableau de trame a lire ( on en a plus besoin )
                                if (self.tabToRead[index].whoIsWriting == "rfid") {
                                    self.emitRemoveFromTab(index, dataR.adr)
                                    index--;
                                }
                                break;
                            //La communication a échoué donc on interdit l'écriture du système (IHM,RFID ou MESUREUR)
                            case "error":
                                console.log("From Serv.js [301] : retrying terminal in 5 seconds.!");
                                copyTabTerminal.anyError = true;
                                self.emitSetTimeOut(copyTabTerminal)
                                break;
                            //La communication a échoué à 3 FOIS,nous enlevons la trame du tableau à lire et l'insérons dans le tableau des erreurs
                            case "brokenDown":
                                console.log("From Serv.js [305] : terminal broken-down !");
                                self.fromTabToReadToTabError(index)
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
    calculKwh() {

        switch (self.nbBorneUsed) {
            case 1:
                console.log("From Serv.js [359] : Utilisation de 7kWh"); console.log("---------------------------------------")
                self.kwhToUse = 7;
                break;
            case 2:
                console.log("From Serv.js [363] : Utilisation [3.5] | [3.5] kWh"); console.log("---------------------------------------")
                self.kwhToUse = 3.5;
                break;
            case 3:
                console.log("From Serv.js [367] : Utilisation de [2.33] | [2.33] | [2.33] kWh"); console.log("---------------------------------------")
                self.kwhToUse = 2.33;
                break;
            default:
                console.log("From Serv.js [370] : Erreur calcul kWh !"); console.log("---------------------------------------")
                break;
        }

        self.tabTerminal.forEach(element => {
            element.data.kwhGive = self.kwhToUse;
        });

    }

    //Calcul le coefficient de prioritées selon les données (Présence et kW) (AUTO PAS OK)
    async calcPrio(nbBorneUsed, indexR, callback) {
        let prio = 0;
        let index;
        //Pour chaque borne on calcule la
        for (index = 0; index <= nbBorneUsed; index++) {
            switch (index) {
                case 0:
                    prio = self.tabTerminal[index].data.timeP / self.tabTerminal[index].data.kwh;
                    break;
                case 1:
                    prio = self.tabTerminal[index].data.timeP / self.tabTerminal[index].data.kwh;
                    break;
                case 2:
                    prio = self.tabTerminal[index].data.timeP / self.tabTerminal[index].data.kwh;
                    break;
                default:
                    break;
            }
            //Insertion priorité et l'adresse borne
            self.tabTerminal[index].data.prio = Math.round(prio * 100) / 100;
        }
        self.calculKwh();
        if (self.nbBorneUsed > 1) {
            console.log("INDEX 394 ", index)
            //self.resendData(indexR)
        }

        callback();
    }

    //Check si le rfid est autorisé a être utilisé (AUTO OK) 
    checkRfidCanBeUsed(adrR) {
        //console.log("La :",self.tabTerminal[0].rfid.frame[0][0])
        let isOk = false;
        for (let index = 0; index < self.tabTerminal.length; index++) {
            if (self.tabTerminal[index].rfid.frame[0][0] == adrR) {
                isOk = true;
                return isOk
            }
        }
        return isOk;
    }

    //Va remplacer les valeurs nécéssaires lors de la réception des anciennes données (AUTO OK) *
    replaceData(dataR) {

        if (self.nbBorneUsed > 1) {
            for (let index = 0; index < self.nbBorneUsed - 1; index++) {
                self.Terminal[index].data.timeP = dataR.timeP;
                self.Terminal[index].data.kwh = dataR.kwh;
            }
        }
    }

    //(AUTO OK)
    estimateCharging(dataR) {

        console.log("From Serv.js [437] : Terminal" + dataR.adrT + " Estimation charge : ", Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100, "minutes.");
        console.log("---------------------------------------")
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

    //Simulation toutes les secondes va modifier les kW , estimation charge... et l'afficher sur l'html
    countSec = () => {
        self.tabTerminal.forEach(element => {
            if (element.status.isUsed === true) {

                if (element.data.kwh <= 0) {
                    console.log("Chargement fini !")
                    element.status.isUsed = false;
                    element.data.room = "resetP";
                    self.io.emit("changeB", element.data);
                } else {
                    element.data.kwh = (element.data.kwh - (element.data.kwhGive / 3600)).toFixed(3)
                    element.data.timeP = element.data.timeP - 0.01;
                    element.data.room = "rfid";
                    self.io.emit("changeB", element.data) //Envoie de la borne utilisé pour la page html 
                }

            }
        });
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
        for (let index = 0; index <self.tabTerminal[indexRfid].wattMeter.allFrame.length; index++) {
            self.tabToRead.push({
                whoIsWriting: "wattMeter",
                data: self.tabTerminal[indexRfid].wattMeter.allFrame[index],
                adr: self.tabTerminal[indexRfid].wattMeter.adr,
            });
            console.log("Tab to read :", self.tabToRead[index].data);
        }

        console.log("LENGTH:", self.tabTerminal[indexRfid].wattMeter.allFrame.length);
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
        //console.log("Iic", self.tabTerminal[indexR].status.anyError);
        setTimeout(() => {
            dataR.anyError = false;
            dataR.nbRetry++;
        }, 6000)
        // console.log("Iic 2");
    }

    /* Supression des trames ne communiquant plus
       Ensuite nous les insérons dans le tableau cqui contient seulement les trames qui ne communique plus */
    fromTabToReadToTabError(indexR) {
        //on push dans le tableau d'erreur la trame
        self.tabError.push(self.tabToRead[indexR])
        //on enléve la trame qui ne fonctionne plus du tableau a lire
        self.tabToRead.splice(indexR, 1);
    }

    //Va créer l'interval pour emit les trames
    createEmitInteval() {
        if (self.intervalEmitRfid == null) {
            self.intervalEmitRfid = setInterval(this.checkIfCanEmit, 5000);
        } else {
            console.log("From Serv.js [549] : Error emit interval already created");
        }
    }

    //Va créer la trame pour l'intercace IHM
    createHimFrame() {

    }

}


/* Export du module */
module.exports = Server;
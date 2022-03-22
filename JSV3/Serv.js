

var self = null;

/* Implementation ... */
class Server {

    /* Constructeur */
    constructor() {

        /* Import des modules */
        this.http = require('http');
        this.fs = require('fs');
        this.dotenv = require('dotenv').config({ path: "../.env" })

        /* Events */
        this.emitter = require('./Listener');
        this.myEmitter = this.emitter.myEmitter

        /* Database */
        this.mysql = require('../JSV3/Database');
        this.db = new this.mysql();

        /* Serial com */
        this.Serial = require("../JSV3/Serial");
        this.mySerial = null;

        /* CRC-16 */
        this.crc;
        this.crc16 = require('./CalculCR16')

        /* Terminal */
        this.Terminal = require("../JSV3/Terminal");

        /* Va contenir l'objet de la classe TERMINAL (Borne) */
        this.tabTerminal = [];

        /* Récupération  des informations si une des informations n'est pas disponible nous prenons l'information a droite du ou ( || )*/
        this.port = process.env.PORT || 8080;
        this.fichierHTML = process.env.fichierHTML || '../HTML/index.html'
        this.fichierTEST = process.env.fichierTEST || '../JS/Test.js'
        this.fichierCSS = process.env.fichierCSS || '../CSS/headers.css'

        /* Server app,requête,response */
        this.app = null;
        this.io = require("socket.io");

        /* Nombre de bornes en utilisation */
        this.nbBorneUsed = 0;

        /* Tableau des rfid init ( stockage de leur trame ) */
        this.rfidFrame = [];

        this.kwhToUse = 0;
        this.tabPrio = [{}, {}, {}];

        this.intervalEmitRfid = setInterval(this.emitRfid, 2000);
        this.intervalEmitTerminal = setInterval(this.emitTerminal, 2000);
        this.interval3 = setInterval(this.countSec, 1000);

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
        if (this.app != null) {
            console.log("From Serv.js : HTTP connection already created");
        } else {
            this.app = this.http.createServer(function (req, res) {

                /* Selon la requête on appel la fonction sendFile avec en paramètre la res  ( pour pouvoir répondre à la requête depuis la fonction ),
                on envoie le type de document et le fichier a lire */
                switch (req.url) {
                    case "/":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/index.html')
                        break
                    case "/index.html":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/index.html')
                        break
                    case "/JSV3/Test.js":
                        self.sendFile(res, 'text/javascript', 'utf-8', '../JSV3/Test.js')
                        break
                    case "/JS/Listener":
                        self.sendFile(res, 'text/javascript', 'utf-8', '../JSV3/Listener.js')
                        break
                    case "/dashboard":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/dashboard.html')
                        break
                    case "/informations":
                        self.sendFile(res, 'text/html', 'utf-8', '../HTML/info.html')
                        break
                    case "/CSS/headers.css":
                        self.sendFile(res, 'text/html', 'utf-8', '../CSS/headers.css')
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
                    case "/IMG/voiture.png":
                        self.sendFile(res, 'image/jpg', 'Base64', "../IMG/voiture.png")
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
     * Create the http connection and WebSocket. 
     */
    createHttpConnection(callback) {
        // Lancement du serveur sur le port 8080 
        this.app.listen(this.port, () => {
            console.log(`From Serv.js : Mise en place du serveur http://localhost:${this.port}/`);
            console.log("---------------------------------------");
            this.io = new this.io.Server(this.app)
            this.mySerial = new this.Serial("COM10", 9600, 8, 'none');
            callback();
        });
    }

    /* Envoie de fichier (AUTO OK)*/
    sendFile(res, type, encoding, fichier) {

        this.fs.readFile(`./${fichier}`, encoding, (err, content) => {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': type });
            res.write(content, encoding);
            res.end();
        })
    }

    /* Pour envoyer les données lors d'une nouvelle connexion (AUTO OK)*/
    sendHtmlData() {

        /* Pour chaque rfid on envoie */
        this.tabTerminal.forEach(element => {
            self.io.emit("changeB", element.data)
        });

        /* On change le nombre de borne en utilisation ( html ) */
        self.io.emit("changeTerminalUsed", self.nbBorneUsed)
    }

    /* LA --------------------------------------------------------------------------------------------------------------------------------  (AUTO OK)*/
    manageEvent() {

        this.listenNewData();

    }

    /* Pour la page html (AUTO OK)*/
    manageSocket() {
        this.io.on('connection', function (socket) {
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

    /* check si le code RFID est connu dans le BDD et emet a la borne concerné les données ( tps et kWh ) (AUTO OK) */
    checkBdd(data) {
        console.log("From Serv.js [206] : Checking User in BDD");
        console.log("---------------------------------------");
        this.db.readData(data.keyCode, (dataR) => {
            /* Si il existe dans la BDD */
            if (dataR != null) {
                console.log("From Serial.js [212] : User available in BDD !")
                console.log("---------------------------------------")

                this.nbBorneUsed++;

                let index = this.findIndex("adr", data.adr)

                /* Modifications des valeurs */
                this.tabTerminal[index].data.kwh = dataR[0].nbKwh;
                this.tabTerminal[index].data.timeP = dataR[0].timeP;
                this.tabTerminal[index].data.kwhGive = 0;
                this.tabTerminal[index].data.isCharging = true;

                //Calcul prio et envoie de données
                this.calcPrio(this.nbBorneUsed - 1, index, () => {
                    this.sendData(this.tabTerminal[index].data);
                });

            } else {
                console.log("From Serv.js [ 231 ] : User not available in BDD.");
                console.log("---------------------------------------");
                this.intervalEmitRfid = setInterval(this.emitRfid, 2000);
            }
        });
    }

    /* Check si le rfid est deja utilisé ( carte deja passer et  accepter ) , si rfid non utilisé --> checkBdd (AUTO OK) */
    checkRfidUsed(dataR) {

        if (this.checkRfidCanBeUsed(dataR)) {

            if (this.tabTerminal.some(element => element.data.adr == dataR.adr && element.data.isCharging == false)) {
                this.checkBdd(dataR)
            } else {
                console.log("From Serial.js [ 216 ] : RFID Already used !");
                console.log("---------------------------------------")
            }
        } else {
            console.log("From Serial.js [224] Rfid adr non reconnu");
            console.log("---------------------------------------")
        }
    }

    /* Envoie les données a la borne (AUTO OK) */
    sendData(data) {

        this.io.emit("changeTerminalUsed", self.nbBorneUsed) //Envoie le nombre de borne utilisé pour la page html 
        data.room = "rfid";
        data.isCharging = true;
        this.io.emit("changeB", data) //Envoie de la borne utilisé pour la page html 
        //Envoie les données a la borne Ex { room : "firstData", payload : [5,7] }
        this.estimateCharging(data);

    }

    /* Pour demande au port communication d'écrire (AUTO OK) */
    emitRfid = () => {
        let index = 0;
        this.rfidFrame.forEach(element => {
            index = this.findIndex("adr", element[0].substring(2))
            if (this.tabTerminal[index].data.isCharging === false) {
                this.myEmitter.emit("readRFID", (element));
            }
        });
    }

    /* Pour demande au port communication d'écrire  (AUTO OK)*/
    emitTerminal = () => {

        this.tabTerminal.forEach(element => {
            if (element.data.isCharging === true) {
                this.myEmitter.emit("readTerminal", element.data.adrT);
            }
        });

    }

    /* Ecoute sur les events sur la room "new" (AUTO OK) */
    listenNewData() {

        this.myEmitter.on("new", (dataR) => {
            switch (dataR.room) {
                case "rfid":
                    console.log("From Serv.js [298] : New Rfid init vent trigger !");
                    console.log("---------------------------------------")
                    /* Si la chaine vaut " " c'est qu'il n'y a jamais eu de modification sur le panneau */
                    self.checkRfidUsed(dataR);
                    break
                case "rfidA":
                    //Traitement des valeurs reçu
                    console.log("From Serv.js [307] data asked : ", dataR)
                    console.log("---------------------------------------")
                    self.replaceData(dataR);
                    self.test = true;
                    break
            }

        })
    }

    /* Selon le nombre de véhicule , on fourni les kW a utilisé (AUTO PAS OK) */
    calculKwh() {

        switch (this.nbBorneUsed) {
            case 1:
                console.log("From Serv.js [359] : Utilisation de 7kWh"); console.log("---------------------------------------")
                this.kwhToUse = 7;
                break;
            case 2:
                console.log("From Serv.js [363] : Utilisation [3.5] | [3.5] kWh"); console.log("---------------------------------------")
                this.kwhToUse = 3.5;
                break;
            case 3:
                console.log("From Serv.js [367] : Utilisation de [2.33] | [2.33] | [2.33] kWh"); console.log("---------------------------------------")
                this.kwhToUse = 2.33;
                break;
            default:
                console.log("From Serv.js [370] : Erreur calcul kWh !");console.log("---------------------------------------")
                break;
        }

        this.tabTerminal.forEach(element => {
            element.data.kwhGive = this.kwhToUse;
        });

    }

    /* Calcul la prio selon les données (Présence et kW) (AUTO PAS OK)*/
    async calcPrio(nbBorneUsed, indexR, callback) {
        var prio = 0;
        let index;

        /* Pour chaque borne on calcul la prio */
        for (index = 0; index <= nbBorneUsed; index++) {
            switch (index) {
                case 0:
                    prio = this.tabTerminal[index].data.timeP / this.tabTerminal[index].data.kwh;
                    break;
                case 1:
                    prio = this.tabTerminal[index].data.timeP / this.tabTerminal[index].data.kwh;
                    break;
                case 2:
                    prio = this.tabTerminal[index].data.timeP / this.tabTerminal[index].data.kwh;
                    break;
                default:
                    break;
            }

            /* Insertion prio et l'adresse borne */
            this.tabTerminal[index].data.prio = Math.round(prio * 100) / 100;
        }

        //console.log("From Serv.js [408] Prio calcul :",this.tabTerminal[index].data)
        //console.log("---------------------------------------")

        this.calculKwh();

        if (this.nbBorneUsed > 1) {
            console.log("INDEX 394 ", index)
            this.resendData(indexR)
        }

        callback();
    }

    /* Va renvoyer les données qui on été modifiés (AUTO OK) */
    resendData(index) {
        this.tabTerminal.forEach(element => {
            if (this.tabTerminal[index].data.adrT != element.data.adrT && element.data.isCharging == true) {
                //console.log("on envoie");
                this.estimateCharging(element.data);
                element.data.room = "rfid";
                this.io.emit("changeB", element.data)
            }
        });
    }

    /* Check si le rfid est autorisé a être utilisé (AUTO OK) */
    checkRfidCanBeUsed(data) {
        var isOk = false;
        if (this.rfidFrame.some(element => element[0] == "0x" + data.adr)) {
            isOk = true
        }
        return isOk;
    }

    /* Va remplacer les valeurs nécéssaires lors de la réception des anciennes données (AUTO OK) */
    replaceData(dataR) {

        if (this.nbBorneUsed > 1) {
            for (let index = 0; index < this.nbBorneUsed - 1; index++) {
                this.Terminal[index].data.timeP = dataR.timeP;
                this.Terminal[index].data.kwh = dataR.kwh;
            }
        }
    }

    /* (AUTO OK) */
    estimateCharging(dataR) {

        console.log("From Serv.js [437] : Terminal" + dataR.adrT + " Estimation charge : ", Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100, "minutes.");
        console.log("---------------------------------------")
    }

    /* Creation de toute les bornes (AUTO OK) */
    createAllTerminal(nbBorne) {

        let indexString;
        for (let index = 0; index < nbBorne; index++) {
            indexString = "0" + (index + 5);
            this.tabTerminal.push(new this.Terminal(indexString));

            /* Set RFID adr */
            this.tabTerminal[index].data.adr = this.rfidFrame[index][0].substring(2)
            //console.log("ICI t : ",this.tabTerminal[index].data)

        }

        console.log("From Serv.js [518] : Terminal created.")
        console.log("---------------------------------------");


    }
    
    /* Calcul du crc et insertion dans le tableau */
    createFrameRfid(nbBorne) {
        for (let indexT = 1; indexT <= nbBorne; indexT++) {
            this.rfidFrame.push([
                "0x0" + indexT, "0x03",
                "0x00",
                "0x00",
                "0x00",
                "0x04"
            ]);
            //Calcul et Ajout CRC16/MODBUS
            var stringHex = "";
            this.crc = this.crc16.calculCRC(this.rfidFrame[indexT-1], 6)
            for (let lengtOfCrc = 0; lengtOfCrc < this.crc.length; lengtOfCrc++) {
                stringHex =  this.crc16.determineString(this.crc[lengtOfCrc])
                this.rfidFrame[indexT-1].push(stringHex+this.crc[lengtOfCrc])            
            }
            //console.log("Test : ", this.rfidFrame[indexT-1])
        }
        this.createAllTerminal(nbBorne)
    }

    /* Retrouve l'index de l'element a modifier (AUTO OK)  */
    findIndex(val, dataR) {

        let index = 0;

        switch (val) {
            case "adr":
                for (index = 0; index < this.tabTerminal.length; index++) {
                    if (this.tabTerminal[index].data.adr == dataR) {
                        //console.log(this.tabTerminal[index].data);
                        return index
                    }
                }
                break;
            case "adrT":
                for (index = 0; index < this.tabTerminal.length; index++) {
                    if (this.tabTerminal[index].data.adrT == dataR) {
                        //console.log(this.tabTerminal[index].data);
                        return index
                    }
                }
                break;
            default:
                break;
        }
    }

    countSec = () => {
        this.tabTerminal.forEach(element => {
            if (element.data.isCharging === true) {
                element.data.kwh = (element.data.kwh - (element.data.kwhGive / 3600)).toFixed(3)
                element.data.timeP = element.data.timeP - 0.01;
                element.data.room = "rfid";
                this.io.emit("changeB", element.data) //Envoie de la borne utilisé pour la page html 
            }
        });
    }

    /* Stocker l'adresse du rfid dans l'objet du terminal correspondant  (AUTO OK) */
    linkTerminalToRfid() {

        for (let index = 0; index < this.tabTerminal.length; index++) {

            this.tabTerminal[index].data.adr = this.rfidFrame[index][0].substring(2);

            //console.log("-->", this.tabTerminal[index].data.adr)

        }

    }
}


/* Export du module */
module.exports = Server;
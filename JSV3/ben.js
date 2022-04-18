/* Va renvoyer les données qui on été modifiés (AUTO OK) 
    resendData(index) {
        self.tabTerminal.forEach(element => {
            if (self.tabTerminal[index].data.adrT != element.data.adrT && element.isUsed == true) {
                //console.log("on envoie");
                self.estimateCharging(element.data);
                element.data.room = "rfid";
                self.io.emit("changeB", element.data)
            }
        });
    }*/



//Si la valeur qui est écrite est le volt
if (self.whatIsWritten == "V") {
    self.dataPromise = parseInt(self.dataPromise, 16) / 100
    console.log("From Serial.js [185] : wattMeter data receive.", self.dataPromise, self.whatIsWritten)
}
//Si la valeur qui est écrite n'est pas le volt, c'est soit l'intensité soit l'ampère
else {
    self.dataPromise = parseInt(self.dataPromise, 16) / 1000
    console.log("From Serial.js [185] : wattMeter data receive.", self.dataPromise, self.whatIsWritten)
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

//Check si le rfid est autorisé a être utilisé (AUTO OK) 
checkRfidCanBeUsed(valueR) {
    //console.log("La :",self.tabTerminal[0].rfid.frame[0][0])
    let isOk = false;
    for (let index = 0; index < self.tabTerminal.length; index++) {
        if (self.tabTerminal[index].rfid.frame[0][0] == valueR) {
            isOk = true;
            return isOk
        }
    }
    return isOk;
}

  //(AUTO OK)
  estimateCharging(dataR) {

    console.log("From Serv.js [437] : Terminal" + dataR.adrT + " Estimation charge : ", Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100, "minutes.");
    console.log("---------------------------------------")
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


if (self.tabToRead[index].whoIsWriting == "rfid") {

    var t = async () => {
        await self.rfidProcessing(copyTabTerminal, index, dataR)
            .then((result) => {
                console.log("From Serv.js [327] : ", result);
                index = result;
            }).catch((error) => {
                console.log("From Serv.js [329] : ", error);
                if (error.status == "databaseTimeout") {
                    console.log("affichage d'une erreur BDD")
                }
            })
    }

    t();

} else {

}


switch (valueR.status) {
    //La communication a réussi ont enleve 
    case "sucess":


        switch (whoIsWritingR) {
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

        self.wattMeterProcessing(valueR.data, copyTabTerminalR, self.tabToRead[indexR].whatIsWritten)

        break;
    //La communication a échoué donc on interdit l'écriture du système (IHM,RFID ou MESUREUR)
    case "error":
        console.log("From Serv.js [301] : retrying terminal in 5 seconds.!");
        self.io.emit("rfid", {
            status: "error rfid",
            adr: copyTabTerminalR.adr,
        })
        copyTabTerminalR.anyError = true;
        self.emitSetTimeOut(copyTabTerminalR)
        break;
    //La communication a échoué à 3 FOIS,nous enlevons la trame du tableau à lire et l'insérons dans le tableau des erreurs
    case "brokenDown":
        self.io.emit("rfid", {
            status: "broken-down terminal",
            adr: copyTabTerminalR.adr,
        })
        console.log("From Serv.js [305] : terminal broken-down !");
        self.fromTabToReadToTabError(indexR)
        break;
    default:
        break;
}


self.him.frame.push([
    stringHex + (adr.toString()),
    //Adr fonction lire n mots
    "0x10",
    //Nombre d'octets total
    "0x0C",
    //Intensité
    "0x00",
    "0x00",
    //Consigne courant
    "0x00",
    "0x00",
    //Puissance
    "0x00",
    "0x00",
    "0x00",
    "0x00",
    //Tension
    "0x00",
    "0x00",
    //Durée
    "0x00",
    "0x00",
    //Etat borne
    "0x00",
    "0x00",
    //Crc
    "0xFF",
    "0xFF",

]);


self.him.frame.push([
    stringHex + (adr.toString()),
    //Adr fonction lire n mots
    "0x10",
    // ?
    "0x00",
    //Nombre d'octets total
    "0x0C",
    //Intensité
    "0x00,0x00",
    //Consigne courant
    "0x00,0x00",
    //Puissance
    "0x00,0x00,0x00,0x00,",
    //Tension
    "0x00,0x00",
    //Durée
    "0x00,0x00",
    //Etat borne
    "0x00,0x00",
    //Crc
    "0xFF,0xFF",

]);
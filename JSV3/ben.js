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

wattMeterProcessing(dataR, tabTerminalR, whatIsWrittenR) {
    var value = self.convertIntoHexa(dataR.toString(16), whatIsWrittenR);
    switch (whatIsWrittenR) {
        case "V":
            console.log("Te : ",value)
            tabTerminalR.setAmpereValue(value)
           // console.log("VOLT : ", parseInt(tabTerminalR.wattMeter.voltage[0].substring(2) + tabTerminalR.wattMeter.voltage[1].substring(2), 16) / 100, "V");
            //console.log("VOLT : ", tabTerminalR.wattMeter.voltage );
            //console.log("VOLT : ", parseInt(tabTerminalR.wattMeter.voltage[0].substring(2) + tabTerminalR.wattMeter.voltage[1].substring(2), 16));
            break;
        case "A":
            tabTerminalR.wattMeter.ampere[0] = value.substring(0,4);
            tabTerminalR.wattMeter.ampere[1] = value.substring(5,9);
            console.log("AMPERE : ", parseInt(tabTerminalR.wattMeter.ampere[0].substring(2) + tabTerminalR.wattMeter.ampere[1] .substring(2), 16) / 1000, "A");
            console.log("AMPERE : ", tabTerminalR.wattMeter.ampere);
            //console.log("AMPERE : ", parseInt(tabTerminalR.wattMeter.ampere.substring(2, 4) + tabTerminalR.wattMeter.ampere.substring(7, 9), 16));
            break;
        case "kW":
            tabTerminalR.wattMeter.power[0] = value.substring(0,4);
            tabTerminalR.wattMeter.power[1] = value.substring(5,9);
            tabTerminalR.wattMeter.power[2] = value.substring(10,14);
            tabTerminalR.wattMeter.power[3] = value.substring(15,19);
            console.log("POWER : ", parseInt(tabTerminalR.wattMeter.power[0].substring(2) + tabTerminalR.wattMeter.power[1].substring(2) + tabTerminalR.wattMeter.power[2].substring(2) + tabTerminalR.wattMeter.power[3].substring(2), 16) / 1000, "kW");
            console.log("POWER : ", tabTerminalR.wattMeter.power);
            //console.log("POWER : ", parseInt(tabTerminalR.wattMeter.power.substring(2, 4) + tabTerminalR.wattMeter.power.substring(7, 9) + tabTerminalR.wattMeter.power.substring(12, 14) + tabTerminalR.wattMeter.power.substring(17, 19), 16));
            break;
        default:
            break;
    }
}


 //Lorsqu'on reçoits des trames du mesureur
 wattMeterProcessing(dataR, tabTerminalR, whatIsWrittenR) {
    var value = self.convertIntoHexa(dataR.toString(16), whatIsWrittenR);
    switch (whatIsWrittenR) {
        case "V":
            tabTerminalR.setVoltageValue(value)
            break;
        case "A":
            tabTerminalR.setAmpereValue(value)
            break;
        case "kW":
            tabTerminalR.setPowerValue(value)
            break;
        default:
            break;
    }
}

 //Lorsqu'on reçoits des trames de l'ihm
 himProcessing(tabTerminalR) {
    //On simule les valeurs (kW chargé, restant...)
    tabTerminalR.setHimValue();
}
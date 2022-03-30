calculKwh() {

    switch (this.nbBorneUsed) {
        case 1:
            console.log("Utilisation de 7kWh"); console.log("---------------------------------------")
            this.kwhToUse = 7;
            break;
        case 2:
            console.log("Utilisation [3.5] | [3.5] kWh"); console.log("---------------------------------------")
            this.kwhToUse = 3.5;
            break;
        case 3:
            console.log("Utilisation de [2.33] | [2.33] | [2.33] kWh"); console.log("---------------------------------------")
            break;
        default:
            console.log(this.pr.error("Erreur calcul kWh !")); console.log("---------------------------------------")
            break;
    }

    this.tabRfidUsed.forEach(element => {
        element.kwhGive = this.kwhToUse;
    });


}

calcPrio(nb, callback) {

    var prio = 0;

    if (this.nbBorneUsed > 1) {

        this.test()
    }

    console.log("TITI ", nb)
    for (let index = 0; index <= nb; index++) {
        switch (index) {
            case 0:
                console.log("T L , ", this.tabRfidUsed)
                prio = this.tabRfidUsed[index].timeP / this.tabRfidUsed[index].kwh;
                break;
            case 1:
                prio = this.tabRfidUsed[index].timeP / this.tabRfidUsed[index].kwh;
                break;
            case 2:
                prio = this.tabRfidUsed[index].timeP / this.tabRfidUsed[index].kwh;
                break;
            default:
                break;
        }

        this.tabPrio[index].prio = Math.round(prio * 100) / 100;

        this.tabPrio[index].name = this.tabRfidUsed[index].adr
    }

    // Sort croissant
    this.tabPrio.sort((a, b) => (a.prio < b.prio ? -1 : 1))
    console.log(this.tabPrio)
    console.log("---------------------------------------")

    this.calculKwh();
    callback();




}

test(timeout = 5000) {

    this.myEmitter.emit("terminal" + this.tabRfidUsed[0].adr, {
        room: "sendData",
        adr: this.tabRfidUsed[0].adr,
        timeP: this.tabRfidUsed[0].timeP,
        kwh: this.tabRfidUsed[0].kwh
    });

    self.t = setInterval(() => {
        console.log("timeout waiting for msg")
    }, timeout);

}

t2(dataR) {

    if (self.nbBorneUsed == 2) {


        this.myEmitter.emit("terminal" + self.tabRfidUsed[0].adr, {
            room: "newData",
            timeP: dataR.timeP,
            kwh: dataR.kwh,
            kwhGive: self.kwhToUse
        });

    } else {
        if (self.nbBorneUsed == 3) {
            self.tabRfidUsed[0].kwhGive = self.kwhToUse
            self.tabRfidUsed[1].kwhGive = self.kwhToUse
        }
    }
}

    /* Delete un element du tableau */
    removeItem(arr, value) {
        var index = arr.indexOf(value);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }


    /*
    switch (receiver) {
        case "borne":
            var data = [];
            data.push(crc.toString(16).substring(0, 2))
            data.push(crc.toString(16).substring(2))
            break;
        case "rfid":
            var data = crc;
            break;
        default:
            console.log("From CalculCR16.js : Error in CRC calcul");
            break;
    }*/

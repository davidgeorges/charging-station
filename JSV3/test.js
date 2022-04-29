sendWebIhm() {
    var ihmSend;

    for (const element of self.tabTerminal) {
        ihmSend = element.getHimFrame();
        
        //Si le status de la borne est en fonctionnement qu'il n'y pas d'erreur sur le mesureur ?
        if (ihmSend[19] == "0x01" && element.getNbRetry("wattMeter") <= 0) {

            var kwhGive = element.getKwhGive()
            var kwhLeft = element.getKwhLeft()
            console.log("calcul kwh est", (parseInt(kwhGive[0].substring(2) + kwhGive[1].substring(2), 16)) / 1000)
            console.log("kwh left 1: ",kwhLeft)
            kwhLeft -= ( ( (parseInt(kwhGive[0].substring(2) + kwhGive[1].substring(2), 16)) / 1000 ) / 3600)
            console.log("kwh left  2: ",kwhLeft)
            element.setKwhLeft(kwhLeft)
            console.log("kwh left  3: ",kwhLeft)

        }
        
        self.io.emit("newValueIhm", ihmSend)
    }
}
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
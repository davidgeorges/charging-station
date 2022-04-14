let socket = io.connect({ query: { myParam: 'User' } });

// Element pour l'adresse de la borne
let adrTerminal1 = document.getElementById("adrTerminal1");
let adrTerminal2 = document.getElementById("adrTerminal2");
let adrTerminal3 = document.getElementById("adrTerminal3");

// Element pour les kw fourni pour utilisation
let kwToUse1 = document.getElementById("kWUsed1");
let kwToUse2 = document.getElementById("kWUsed2");
let kwToUse3 = document.getElementById("kWUsed3");

// Element pour les kw  restant à charger
let kwRemaining1 = document.getElementById("kWRemaining1");
let kwRemaining2 = document.getElementById("kWRemaining2");
let kwRemaining3 = document.getElementById("kWRemaining3");

// Element pour l'estimation de charge
let estimationTime1 = document.getElementById("estimationTime1");
let estimationTime2 = document.getElementById("estimationTime2");
let estimationTime3 = document.getElementById("estimationTime3");

// Element pour le status de la borne
let statusTerminal1 = document.getElementById("statusTerminal1");
let statusTerminal2 = document.getElementById("statusTerminal2");
let statusTerminal3 = document.getElementById("statusTerminal3");

let terminalUsed = document.getElementById("nbTermialUsed");

/* Va regrouper tout les fonctionalités dans un event */
socket.on("rfid", (dataR) => {
   console.log("From Test.js : Rfid event trigger !");
   console.log("---------------------------------------", dataR)

   switch (dataR.adr) {
      case "0x01":
         adrTerminal1.innerHTML = dataR.adr
         statusTerminal1.innerHTML = dataR.status;
         break;
      case "0x02":
         adrTerminal2.innerHTML = dataR.adr
         statusTerminal2.innerHTML = dataR.status;
         break;
      case "0x03":
         adrTerminal3.innerHTML = dataR.adr
         statusTerminal3.innerHTML = dataR.status;
         break;
      default:
         break;
   }

})

socket.on("wattMeter", (dataR) => {
   console.log("From Test.js : wattMeter event trigger !");
   console.log("---------------------------------------", dataR)
   //changeB(dataR);
})

socket.on("him", (dataR) => {
   console.log("From Test.js : him event trigger !");
   console.log("---------------------------------------", dataR)
   //changeB(dataR);
})

socket.on("changeTerminalUsed", (dataR) => {
   console.log("B ", dataR)
   //terminalUsed.innerHTML = dataR
})


function changeB(dataR) {
   console.log("Iid : ", dataR.kwhGive);
   switch (dataR.adrT) {

      case '0x15':
         adrTerminal1.innerHTML = dataR.adrT
         statusTerminal1.innerHTML = "charging...";
         kwRemaining1.innerHTML = dataR.kwh
         kwToUse1.innerHTML = dataR.kwhGive
         estimationTime1.innerHTML = Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100
         break;
      case '0x16':
         adrTerminal2.innerHTML = dataR.adrT
         statusTerminal2.innerHTML = "charging...";
         kwRemaining2.innerHTML = dataR.kwh
         kwToUse2.innerHTML = dataR.kwhGive
         estimationTime2.innerHTML = Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100
         break;
      case '0x17':
         statusTerminal3.innerHTML = "charging...";
         kwRemaining3.innerHTML = dataR.kwh
         kwToUse3.innerHTML = dataR.kwhGive
         estimationTime3.innerHTML = Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100
         break;

      default:
         break;
   }


}


function resetP(dataR) {

   switch (dataR.adrT) {

      case '0x0b':
         adrTerminal1.innerHTML = 1
         statusTerminal1.innerHTML = "waiting RFID";
         kwRemaining1.innerHTML = 0
         kwToUse1.innerHTML = 0
         estimationTime1.innerHTML = 0
         break;
      case '0x0c':
         adrTerminal2.innerHTML = 2
         statusTerminal2.innerHTML = "waiting RFID";
         kwRemaining2.innerHTML = 0
         kwToUse2.innerHTML = 0
         estimationTime2.innerHTML = 0
         break;
      case '0x0d':
         statusTerminal3.innerHTML = "waiting RFID";
         kwRemaining3.innerHTML = 0
         kwToUse3.innerHTML = 0
         estimationTime3.innerHTML = 0
         break;
      default:
         break;
   }
}
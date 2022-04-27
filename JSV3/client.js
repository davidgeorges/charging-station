let socket = io.connect({ query: { myParam: 'User' } });

// Element pour l'adresse de la borne
let adrTerminal1 = document.getElementById("adrTerminal1");
let adrTerminal2 = document.getElementById("adrTerminal2");
let adrTerminal3 = document.getElementById("adrTerminal3");

// Element pour les kw fourni pour utilisation
let kwToUse1 = document.getElementById("kwUsed1");
let kwToUse2 = document.getElementById("kwUsed2");
let kwToUse3 = document.getElementById("kwUsed3");

// Element pour les kw  restant à charger
let kwRemaining1 = document.getElementById("kwRemaining1");
let kwRemaining2 = document.getElementById("kwRemaining2");
let kwRemaining3 = document.getElementById("kwRemaining3");

// Element pour l'estimation de charge
let estimationTime1 = document.getElementById("estimationTime1");
let estimationTime2 = document.getElementById("estimationTime2");
let estimationTime3 = document.getElementById("estimationTime3");

// Element pour le status de la borne
let statusTerminal1 = document.getElementById("statusTerminal1");
let statusTerminal2 = document.getElementById("statusTerminal2");
let statusTerminal3 = document.getElementById("statusTerminal3");

let terminalUsed = document.getElementById("nbTermialUsed");


socket.on("changeTerminalUsed", (dataR) => {
   console.log("B ", dataR)
   //terminalUsed.innerHTML = dataR
})

socket.on("newValueIhm", (dataR) => {
   console.log("Data R : ", dataR)
   changeB(dataR);
})


function changeB(dataR) {
   console.log("Val : ", dataR);

   var copyAdrTerminal;
   var copyStatusTerminal;
   var copyKwRemaining;
   var copyKwToUse;
   var copyEstimationTime;

   switch (dataR[0]) {
      case '0x0b':
         copyAdrTerminal = adrTerminal1
         copyStatusTerminal = statusTerminal1
         copyKwRemaining = kwRemaining1
         copyKwToUse = kwToUse1
         copyEstimationTime = estimationTime1
         break;
      case '0x0b':
         copyAdrTerminal = adrTerminal2
         copyStatusTerminal = statusTerminal2
         copyKwRemaining = kwRemaining2
         copyKwToUse = kwToUse2
         copyEstimationTime = estimationTime2
         break;
      case '0x0d':
         copyAdrTerminal = adrTerminal3
         copyStatusTerminal = statusTerminal3
         copyKwRemaining = kwRemaining3
         copyKwToUse = kwToUse3
         copyEstimationTime = estimationTime3
         break;
      default:
         break;
   }

   convertStatus(dataR,copyStatusTerminal);
   convertPower(dataR,copyKwToUse)

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

//Attribution du status en string et insertion dans l'ihm
function convertStatus(dataR, elementR) {
   console.log("d",dataR[19])
   //Obj literals (remplace le switch)
   var getStatus = (val) => {
      var status = {
         "0x00": "waiting",
         "0x01": "working",
         "0x02": "stopped",
         "0x03": "broken-down",
      }
      return status[val];
   }
   //On fait appel 
   var status = getStatus(dataR[19])
   elementR.innerHTML = status;

}

//Conversion Hexa to Dec puissance et insertion dans l'ihm
function convertPower(dataR, elementR) {
   var valString = "";
   for (let index = 10; index < 14; index++) {
      valString += dataR[index].substring(2);
   }
   var finalVal = parseInt(valString, 16) / 1000
   elementR.innerHTML = finalVal;
}
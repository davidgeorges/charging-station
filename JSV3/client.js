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
      case '0x0c':
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

   setStatus(dataR[4],copyStatusTerminal);
   setPower(dataR[1],copyKwToUse)
   setKwhLeft(dataR[2],copyKwRemaining)
   setTimeLeft(dataR[3],copyEstimationTime)
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

//
function setStatus(valueR, elementR) {
   elementR.innerHTML = valueR;
}

//
function setPower(valueR, elementR) {
   elementR.innerHTML = valueR;
}

//
function setKwhLeft(valueR, elementR) {
   elementR.innerHTML = valueR.toFixed(2);
}

//
function setTimeLeft(valueR, elementR) {
      var h = Math.floor(valueR / 60);
      var m = valueR % 60;
      h = h < 10 ? '0' + h : h; 
      m = m < 10 ? '0' + m : m; 
      var s =  h + ':' + m.toFixed();
    
   elementR.innerHTML = s;
}



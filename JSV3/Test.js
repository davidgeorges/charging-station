let socket = io.connect({ query: { myParam: 'User' } });

let b1 = document.getElementById("used1");

let adr1 = document.getElementById("adr1");
let adr2 = document.getElementById("adr2");

let x1 = document.getElementById("t1");
let x2 = document.getElementById("t2");
let x3 = document.getElementById("t3");

let kw1 = document.getElementById("kWUsed1");
let kw2 = document.getElementById("kWUsed2");
let kw3 = document.getElementById("kWUsed3");

let kwR1 = document.getElementById("kWRe1");
let kwR2 = document.getElementById("kWRe2");
let kwR3 = document.getElementById("kWRe3");

let esTime1 = document.getElementById("esTime1");
let esTime2 = document.getElementById("esTime2");
let esTime3 = document.getElementById("esTime3");

let b2 = document.getElementById("used2");
let b3 = document.getElementById("used3");
let terminalUsed = document.getElementById("nbTermialUsed");

/* Va regrouper tout les fonctionalités dans un event */
socket.on("changeB", (dataR) => {

   switch (dataR.room) {
      case "rfid":
         console.log("From Test.js : Rfid event trigger !");
         console.log("---------------------------------------", dataR)
         changeB(dataR);
         /* Si la chaine vaut " " c'est qu'il n'y a jamais eu de modification sur le panneau */
         break;
      case "resetP":
         console.log("From Test.js : reset panel !");
         console.log("---------------------------------------", dataR)
         resetP(dataR);
         /* Si la chaine vaut " " c'est qu'il n'y a jamais eu de modification sur le panneau */
         break;
      default:
         console.log("From Serv.js : Error event trigger")
         console.log("---------------------------------------")
         break;
   }
})

socket.on("changeTerminalUsed", (dataR) => {
   console.log("B ", dataR)
   //terminalUsed.innerHTML = dataR
})

function changeB(dataR) {
   console.log("Iid : ", dataR.kwhGive);
   switch (dataR.adrT) {

      case '0x0b':
         adr1.innerHTML = dataR.adrT
         b1.innerHTML = "charging...";
         //x1.style.color = "red"
         kwR1.innerHTML = dataR.kwh
         kw1.innerHTML = dataR.kwhGive
         esTime1.innerHTML = Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100
         break;
      case '0x0c':
         adr2.innerHTML = dataR.adrT
         b2.innerHTML = "charging...";
         //x2.style.color = "red"
         kwR2.innerHTML = dataR.kwh
         kw2.innerHTML = dataR.kwhGive
         esTime2.innerHTML = Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100
         break;
      case '0x0d':
         b3.innerHTML = "charging...";
         //x3.style.color = "red"
         kwR3.innerHTML = dataR.kwh
         kw3.innerHTML = dataR.kwhGive
         esTime3.innerHTML = Math.round(((dataR.kwh / dataR.kwhGive) * 60 + Number.EPSILON) * 100) / 100
         break;

      default:
         break;
   }


}


function test1() {

   socket.emit("new", {
      room: "rfid",
      adr: "0" + "5",
      keyCode: "'CA845B5'"
   })
}

function test2() {

   socket.emit("new", {
      room: "rfid",
      adr: "0" + "6",
      keyCode: "'CA845B6'"
   })
}

function resetP(dataR){

   switch (dataR.adrT) {

      case '0x0b':
         adr1.innerHTML = 1
         b1.innerHTML = "waiting RFID";
         kwR1.innerHTML = 0
         kw1.innerHTML = 0
         esTime1.innerHTML = 0
         break;
      case '0x0c':
         adr2.innerHTML = 2
         b2.innerHTML = "waiting RFID";
         kwR2.innerHTML = 0
         kw2.innerHTML = 0
         esTime2.innerHTML = 0
         break;
      case '0x0d':
         b3.innerHTML = "waiting RFID";
         kwR3.innerHTML = 0
         kw3.innerHTML = 0
         esTime3.innerHTML = 0
         break;
      default:
         break;
   }
}
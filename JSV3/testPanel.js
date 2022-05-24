
let socket = io.connect('http://localhost:8080')

let borne1Btn1 = document.getElementById("bouton1Borne1")
let borne1Btn2 = document.getElementById("bouton2Borne1")
let borne1Btn3 = document.getElementById("bouton3Borne1")

let borne2Btn1 = document.getElementById("bouton1Borne2")
let borne2Btn2 = document.getElementById("bouton2Borne2")
let borne2Btn3 = document.getElementById("bouton3Borne2")

let borne3Btn1 = document.getElementById("bouton1Borne3")
let borne3Btn2 = document.getElementById("bouton2Borne3")
let borne3Btn3 = document.getElementById("bouton3Borne3")


borne1Btn1.addEventListener("click", () => {
    sendNewSimulation("b1b1")
})

borne1Btn2.addEventListener("click", () => {
    sendNewSimulation("b1b2")
})

borne1Btn3.addEventListener("click", () => {
    sendNewSimulation("b1b3")
})

borne2Btn1.addEventListener("click", () => {
    sendNewSimulation("b2b1")
})

borne2Btn2.addEventListener("click", () => {
    sendNewSimulation("b2b2")
})

borne2Btn3.addEventListener("click", () => {
    sendNewSimulation("b2b3")
})

borne3Btn1.addEventListener("click", () => {
    sendNewSimulation("b3b1")
})

borne3Btn2.addEventListener("click", () => {
    sendNewSimulation("b3b2")
})

borne3Btn3.addEventListener("click", () => {
    sendNewSimulation("b3b3")
})

function sendNewSimulation(idR) {

    console.log(`CLICK HERE for btn  ${idR} `)
    socket.emit("newSimulation", {
        id: idR,
    })

}
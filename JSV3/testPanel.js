
const socket = io.connect();

const borne1Btn1 = document.getElementById("bouton1Borne1")
const borne1Btn2 = document.getElementById("bouton2Borne1")
const borne1Btn3 = document.getElementById("bouton3Borne1")
const borne1Btn4 = document.getElementById("bouton4Borne1")

const borne2Btn1 = document.getElementById("bouton1Borne2")
const borne2Btn2 = document.getElementById("bouton2Borne2")
const borne2Btn3 = document.getElementById("bouton3Borne2")
const borne2Btn4 = document.getElementById("bouton4Borne2")

const borne3Btn1 = document.getElementById("bouton1Borne3")
const borne3Btn2 = document.getElementById("bouton2Borne3")
const borne3Btn3 = document.getElementById("bouton3Borne3")
const borne3Btn4 = document.getElementById("bouton4Borne3")


borne1Btn1.addEventListener("click", () => {
    sendNewSimulation({id : "b1b1"},"newSimulationFromPanel")
})

borne1Btn2.addEventListener("click", () => {
    sendNewSimulation({id : "b1b2",index : 0},"disconnectFromPanel")
})

borne1Btn3.addEventListener("click", () => {
    sendNewSimulation({id : "b1b3"},"newSimulationFromPanel")
})

borne1Btn4.addEventListener("click", () => {
    sendNewSimulation({id : "b1b4",index : 0},"hardResetFromPanel")
})

borne2Btn1.addEventListener("click", () => {
    sendNewSimulation({id : "b2b1"},"newSimulationFromPanel")
})

borne2Btn2.addEventListener("click", () => {
    sendNewSimulation({id : "b2b2",index : 1},"disconnectFromPanel")
})

borne2Btn3.addEventListener("click", () => {
    sendNewSimulation({id : "b2b3"},"newSimulationFromPanel")
})

borne2Btn4.addEventListener("click", () => {
    sendNewSimulation({id : "b2b4",index : 1},"hardResetFromPanel")
})

borne3Btn1.addEventListener("click", () => {
    sendNewSimulation({id : "b3b1"},"newSimulationFromPanel")
})

borne3Btn2.addEventListener("click", () => {
    sendNewSimulation({id : "b3b2",index : 2},"disconnectFromPanel")
})

borne3Btn3.addEventListener("click", () => {
    sendNewSimulation({id : "b3b3"},"newSimulationFromPanel")
})

borne3Btn4.addEventListener("click", () => {
    sendNewSimulation({id : "b3b4",index : 2},"hardResetFromPanel")
})

function sendNewSimulation(objR,roomR) {

    console.log(`CLICK HERE for btn  ${objR.id} `)
    socket.emit(roomR,objR)

}

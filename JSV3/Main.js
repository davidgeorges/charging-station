

/* Import des modules */
const Server = require("./Serv");
console.log("---------------------------------------")

/* Instanciation */
const server = new Server();

/* Appel des méthodes dans le constructeur pour créer le serveur */
server.createHttpServer();
server.createHttpConnection(() => {
    server.manageEvent();
    server.manageSocket();
    server.db.createConnection("localhost","root","root");
    server.createAllTerminal(2)
});








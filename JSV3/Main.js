

/* Import des modules */
const Server = require("./Serv");
console.log("---------------------------------------")

/* Instanciation */
const server = new Server();

/* Appel des méthodes dans le constructeur pour créer le serveur et plus*/
server.createHttpServer();
server.createHttpConnection(() => {
    server.manageSocket();
    server.db.createConnection("localhost","root","root");
    server.createAllTerminal(2)
});








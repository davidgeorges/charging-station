

/* Import des modules */
const Server = require("./Serv");
console.log("---------------------------------------")

/* Instanciation */
const server = new Server();

/* Appel des méthodes dans le constructeur pour créer le serveur et plus 172.26.10.30*/
server.createHttpServer();
server.createHttpConnection(() => {
    server.manageSocket();
    server.db.createConnection("localhost", "root", "root", (stringR) => {
        if (stringR.length == 0) {
            server.createAllTerminal(2)
            server.createEmitInteval();
        }
    });
});








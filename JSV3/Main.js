

/* Import des modules */
const Server = require("./Serv");
console.log("---------------------------------------")

/* Instanciation */
const server = new Server();

/* Appel des méthodes dans le constructeur pour créer le serveur et plus "localhost", "root", "root"*/
server.createHttpServer();
server.createHttpConnection(() => {
    server.db.createConnection(process.env.dbName,process.env.dbLogin,process.env.dbPassword, (stringR) => {
        server.createAllTerminal(3)
        server.createEmitInteval();
        server.createWebEmitInteval();
        server.manageSocket();
    });
});



/* Import des modules */
const Server = require("./Serv");
console.log("---------------------------------------")

/* Instanciation */
const server = new Server();

/* Appel des méthodes dans le constructeur pour créer le serveur et plus "172.26.10.30", "root", "" 
                                                                         "localhost", "root", "root"*/
server.createHttpServer();
server.createHttpConnection(() => {
    server.manageSocket();
    //172.26.10.30
    server.db.createConnection("localhost", "root", "root", (stringR) => {
        /*if (stringR.length == 0) {
            server.createAllTerminal(2)
            server.createEmitInteval();
        }else{
            console.log("From Mains.js [22] : Error bdd can't use terminal !")
        }*/
        server.createAllTerminal(2)
        server.createEmitInteval();
    });
});








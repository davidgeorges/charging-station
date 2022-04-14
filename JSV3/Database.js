class Database {

    /* Constructeur */
    constructor() {

        /* Module */
        this.mysql = require('mysql');
        this.db = null;

    }

    /**
     * Create Bdd connection
     *
     * 
     */
    async createConnection(hostR, userR, passwordR, callback) {
        var anyError = "";
        this.db = this.mysql.createConnection({
            host: hostR,
            user: userR,
            password: passwordR
        });
        this.db.connect(function (err) {
            if (err) {
                console.log("From Database.js : Error while connecting...")
                console.log("---------------------------------------")
                anyError = "Error_W_Connecting"
            } else {
                console.log("From Database.js : Connected to BDD !");
                console.log("---------------------------------------")
            }
            callback(anyError);
        });



    }

    readData(dataToRead, cl) {

        var res = {
            length : 0,
            data : null,
        }

        this.db.query(`SELECT * FROM db1.user WHERE keyCode = '${dataToRead}'`, function (err, result) {
            if (err) {
                res.length =-1
                console.log("From Database.js : Error while reading data...");
                console.log("---------------------------------------")
            } else {
                res.length = result.length
                res.data = result
                //console.log("47 DB",result.length)
                //console.log("Res : ", result)
                // console.log("---------------------------------------")
            }
            cl(res);
        });
    }


    writeData(whereWrite, dataToWrite) {

        this.db.query("INSERT INTO user (name, address) VALUES ('Company Inc', 'Highway 37')", function (err, result) {
            if (err) throw err;
            console.log("From Database.js : 1 record inserted");
            console.log("---------------------------------------")
        });

    }



}

/* Export du module */
module.exports = Database;
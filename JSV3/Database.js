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
    createConnection(hostR, userR, passwordR,callback) {
        
        var anyError = "";
        if (this.db == null) {
            this.db = this.mysql.createConnection({
                host: hostR,
                user: userR,
                password: passwordR
            });
            this.db.connect(function (err) {
                if(err){
                    console.log("From Database.js : Error while connecting...")
                    console.log("---------------------------------------")
                    anyError = "Error_W_Connecting"
                }else {
                    console.log("From Database.js : Connected to BDD !");
                    console.log("---------------------------------------")
                }
            });
        }else {
            console.log("From Database.js : Error can't create db twice.")
            console.log("---------------------------------------")
            anyError = "Error_DB_Already_Created";
        }

        //callback(anyError);
    }

    readData(dataToRead, cl) {
        this.db.query(`SELECT * FROM db1.user WHERE keyCode = '${dataToRead}'`, function (err, result, fields) {
            if (err) {
                result = null;
                console.log("From Database.js : Error while reading data...");
                console.log("---------------------------------------")
            } else {
               // console.log("Res : ", result)
               // console.log("---------------------------------------")
            }
            cl(result);
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
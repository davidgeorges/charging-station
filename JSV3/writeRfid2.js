// Import dependencies
const SerialPort = require("serialport");
var childProcess = require('child_process');

// Defining the serial port
const port = new SerialPort("COM12",{
    baudRate : 9600,
    dataBits :8,
    parity :'none'
});

const t1 = [0x02, 0x03, 0x08, 0x41, 0x45, 0x38, 0x34, 0x35, 0x42, 0x35, 0x42, 0xa2, 0xe3];

var dataReceive = [];

var dataHex = [];

//console.log("writeRfid.js")



// Write the data to the serial port
port.write(t1,() => {

    port.close((err) => {
        // Now we can run a script and invoke a callback when complete, e.g.
        runScript('./write2.js', function (err) {
            console.log('finished running some-script.js');
        });
    })

});


function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}


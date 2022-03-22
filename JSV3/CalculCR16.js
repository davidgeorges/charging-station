//import {error} from "./PrintColor"

function calculCRC(buf, len) {

    //console.log("TT ! ",buf)
    // Compute the MODBUS RTU CRC
    var crc = 0xFFFF;

    for (var pos = 0; pos < len; pos++) {
        crc ^= buf[pos];          // XOR byte into least sig. byte of crc

        for (var i = 8; i != 0; i--) {    // Loop over each bit
            if ((crc & 0x0001) != 0) {      // If the LSB is set
                crc >>= 1;                    // Shift right and XOR 0xA001
                crc ^= 0xA001;
            }
            else                            // Else LSB is not set
                crc >>= 1;                    // Just shift right
        }
    }
    // Note, this number has low and high bytes swapped, so use it accordingly (or swap bytes)

    /*
    switch (receiver) {
        case "borne":
            var data = [];
            data.push(crc.toString(16).substring(0, 2))
            data.push(crc.toString(16).substring(2))
            break;
        case "rfid":
            var data = crc;
            break;
        default:
            console.log("From CalculCR16.js : Error in CRC calcul");
            break;
    }*/
    var data = [];
    data.push(crc.toString(16).substring(0, 2))
    data.push(crc.toString(16).substring(2))

    return data

}


function determineString(dataR) {

    switch (dataR.length) {
        case 4:
            stringHex = ""
            break;
        case 2:
            stringHex = "0x";
            break;
        case 1:
            stringHex = "0x0"
            break;
        default:
            stringHex = "Err";
            break;
    }

    if(stringHex!="Err"){
        return  stringHex;
    }else{
        console.log("From calculCRC16 [66] : Error determine string to use")
    }
}
    module.exports = { calculCRC, determineString }
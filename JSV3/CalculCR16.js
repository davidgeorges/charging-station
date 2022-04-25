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

    switch (crc.toString(16).length) {
        case 3:
            crc = "0"+crc.toString(16)
            break;
        default:
            break;
    }

    var data = [];

    data.push(crc.toString(16).substring(2))
    data.push(crc.toString(16).substring(0, 2))

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

    if (stringHex != "Err") {
        return stringHex;
    } else {
        console.log("From calculCRC16 [66] : Error determine string to use")
    }
}

//Conversion 
function convertIntoHexa(dataR, whatIsWrittenR) {
    var finalValue = [];
    var nbByte;
    var stringHex = " ";

    //Si pair
    //Determine le nombre d'octets
    switch (whatIsWrittenR) {
        case "V":
            nbByte = 2;
            break;
        case "A":
            nbByte = 2;
            break;
        case "kW":
            nbByte = 4;
            break;
        case "kwhGive":
            nbByte = 2;
            break;
        default:
            break;
    }

    const buf = Buffer.allocUnsafe(nbByte);
    buf.writeIntBE("0x" + dataR, 0, nbByte)

    for (const element of buf) {
        stringHex = determineString(element.toString(16))
        finalValue.push(stringHex + element.toString(16))
    }

    return finalValue
}



module.exports = { calculCRC, determineString ,convertIntoHexa}
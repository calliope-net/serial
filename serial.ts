
namespace serial { /* serial.ts

Unterstützte Module (WLAN können alle, MQTT kann nur Cytron)
^^ = CRLF
Seeed Studio: Grove - UART WiFi V2 (ESP8285) https://www.seeedstudio.com/Grove-UART-WiFi-V2-ESP8285.html
AT+GMR (138 Zeichen) = "AT version:1.6.0.0(Feb  3 2018 12:00:06)^^SDK version:2.2.1(f42c330)^^compile time:Feb 12 2018 16:31:26^^Bin version(Wroom 02):1.6.1^^OK^^"

SparkFun: WiFi Module - ESP8266 (4MB Flash) https://www.sparkfun.com/wifi-module-esp8266-4mb-flash.html
AT-GMR (109 Zeichen= = "AT version:1.7.5.0(Okt  9 2021 09:26:04)^^SDK version:3.0.5(b29dsd3)^^compile time:Sep 15 2022 20:04:36^^OK^^"

Cytron: Grove WiFi 8266 - IoT for micro:bit and beyond https://www.cytron.io/p-grove-wifi-8266-iot-for-microbit-and-beyond
let GMR_CYTRON_187 = "AT version:2.2.0.0(b097cdf - ESP8266 - Jun 17 2021 12:57:45)^^SDK version:v3.4-22-g967752e2^^compile time(6800286):Aug  4 2021 17:34:06^^Bin version:2.2.0(Cytron_ESP-12F_WROOM-02)^^^^OK^^"


*/
    let read_list: string[] = []
    let i_list: number

    //% group="MQTT" subcategory=MQTT
    //% block="WLAN beim Start" weight=9
    export function initWLAN() {
        serial.redirect(
            SerialPin.C17,
            SerialPin.C16,
            BaudRate.BaudRate115200
        )
        serial.setTxBufferSize(80)
        serial.setRxBufferSize(200)
        read_list = []
    }


    //% group="MQTT" subcategory=MQTT
    //% block="%at timeout %sekunden Sekunden" weight=8
    //% sekunden.min=1 sekunden.max=10 sekunden.defl=2
    export function at_command(at_command: eAT_commands, sekunden: number) {
        let at = ""
        switch (at_command) {
            case eAT_commands.at: { at = "AT"; break }
            case eAT_commands.at_rst: { at = "AT+RST"; break }
            case eAT_commands.ate0: { at = "ATE0"; break }
            case eAT_commands.ate1: { at = "ATE1"; break }
            case eAT_commands.at_gmr: { at = "AT+GMR"; break }
            case eAT_commands.at_cmd: { at = "AT+CMD?"; break }
            case eAT_commands.at_mqttconn: { at = "AT+MQTTCONN?"; break }

        }
        if (at.length > 0) {
            serial.writeString(at + String.fromCharCode(13) + String.fromCharCode(10))
            return wait_response(sekunden * 1000)
        }
        else
            return at_command == eAT_commands.none_true
        /*         if (enabled) {
                    serial.writeString(at + String.fromCharCode(13) + String.fromCharCode(10))
                    return wait_response(timeout)
                } else {
                    return false
                } */
    }


    const OK = String.fromCharCode(13) + String.fromCharCode(10) + "OK" + String.fromCharCode(13) + String.fromCharCode(10)

    function wait_response(timeout: number) {
        let read_string: string
        i_list = read_list.length
        let start = input.runningTime()
        while (input.runningTime() - start < timeout) {
            read_string = serial.readString()
            if (read_string.length > 0) {
                read_list.push(read_string)
                if (read_string.includes(OK)) {
                    return true
                }
            }
            basic.pause(20) // ms
        }
        return false
    }

    //% group="MQTT" subcategory=MQTT
    //% block="Response" weight=1
    export function get_response() {
        return read_list
    }

    export enum eAT_commands {
        //% block="AT (aus - false)"
        none,
        //% block="AT (aus - true)"
        none_true,
        //% block="AT Test OK"
        at,
        //% block="AT+RST Reset"
        at_rst,
        //% block="ATE0 Echo off"
        ate0,
        //% block="ATE1 Echo on"
        ate1,
        //% block="AT+GMR Firmware Version"
        at_gmr,
        //% block="AT+CMD? AT Commands"
        at_cmd,
        //% block="AT+MQTTCONN? MQTT Status"
        at_mqttconn
    }

} // serial.ts

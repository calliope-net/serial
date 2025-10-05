
namespace serial { /* serial.ts

Unterstützte Module (WiFi und TCT/IP können alle, MQTT kann nur Cytron)

Seeed Studio: Grove - UART WiFi V2 (ESP8285) https://www.seeedstudio.com/Grove-UART-WiFi-V2-ESP8285.html
Wiki und AT Commands: https://wiki.seeedstudio.com/Grove-UART_Wifi_V2/#basic-at-commands
AT+GMR (138 Zeichen müssen in serielle Puffergröße für RX passen):
AT version:1.6.0.0(Feb 3 2018 12:00:06)
SDK version:2.2.1(f42c330)
compile time:Feb 12 2018 16:31:26
Bin version(Wroom 02):1.6.1
OK


SparkFun: WiFi Module - ESP8266 (4MB Flash) https://www.sparkfun.com/wifi-module-esp8266-4mb-flash.html
Verdrahtung und AT Commands: https://cdn.sparkfun.com/assets/f/e/5/6/f/ESP8266ModuleV2.pdf
Chip Enable (EN) mit 3V3 verbinden rot, TX gelb, RX weiß
AT+GMR (109 Zeichen müssen in serielle Puffergröße für RX passen):
AT version:1.7.5.0(Oct 9 2021 09:26:04)
SDK version:3.0.5(b29dcd3)
compile time:Sep 15 2022 20:04:36
OK


Cytron: Grove WiFi 8266 - IoT for micro:bit and beyond https://www.cytron.io/p-grove-wifi-8266-iot-for-microbit-and-beyond
AT Commands: https://docs.espressif.com/projects/esp-at/en/release-v2.2.0.0_esp8266/AT_Command_Set/index.html
AT+GMR (187 Zeichen müssen in serielle Puffergröße für RX passen):
AT version:2.2.0.0(b097cdf - ESP8266 - Jun 17 2021 12:57:45)
SDK version:v3.4-22-g967752e2
compile time(6800286):Aug 4 2021 17:34:06
Bin version:2.2.0(Cytron_ESP-12F_WROOM-02)
OK


*/
    let response_array: string[] = []
    let response_index: number = 0

    //% group="Seriell C16 C17 115200" subcategory="WLAN MQTT"
    //% block="Grove beim Start" weight=9
    export function init_serial() {
        serial.redirect(
            SerialPin.C17,
            SerialPin.C16,
            BaudRate.BaudRate115200
        )
        serial.setTxBufferSize(80)
        serial.setRxBufferSize(200)
        response_array = []
        response_index = 0
    }


    // ========== group="WLAN" subcategory="WLAN MQTT"

    //% group="WLAN" subcategory="WLAN MQTT"
    //% block="WLAN verbinden SSID %ssid Password %password" 
    export function wifi_connect(ssid: string, password: string) {
        if (at_command("AT+CWMODE=1", 1))
            return at_command("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"", 10) // 10 Sekunden
        else
            return false
    }


    // ========== group="MQTT" subcategory="WLAN MQTT"

    //% group="MQTT" subcategory="WLAN MQTT"
    //% block="MQTT verbinden Host %host Port %port" weight=8
    //% host.defl="192.168.8.2" port.defl=1884
    export function mqtt_connect(host: string, port: number) {
        if (at_command("AT+MQTTUSERCFG=0,1,\"calliope\",\"\",\"\",0,0,\"\"", 5))
            return at_command("AT+MQTTCONN=0,\"" + host + "\"," + port + ",0", 5) // 5 Sekunden
        else
            return false
    }

    //% group="MQTT" subcategory="WLAN MQTT"
    //% block="MQTT Publish Topic %topic Daten %payload" weight=6
    //% topic.defl="topic"
    export function mqtt_publish(topic: string, payload: string) {
        return at_command("AT+MQTTPUB=0,\"" + topic + "\",\"" + payload + "\",1,0", 5) // 5 Sekunden
    }



    //% group="MQTT (ohne Response)" subcategory="WLAN MQTT"
    //% block="MQTT Publish Topic %topic Daten %payload" weight=5
    //% topic.defl="topic"
    export function mqtt_publish_no_response(topic: string, payload: string) {
        serial.writeString("AT+MQTTPUB=0,\"" + topic + "\",\"" + payload + "\",1,0" + String.fromCharCode(13) + String.fromCharCode(10))
    }


    // ========== group="AT" subcategory="WLAN MQTT"

    //% group="AT" subcategory="WLAN MQTT"
    //% block="%at timeout %sekunden Sekunden" weight=8
    //% at.shadow=serial_eAT
    //% sekunden.min=1 sekunden.max=10 sekunden.defl=2
    export function at_command(at: string, sekunden: number) {
        /*         let at = ""
                switch (at_command) {
                    case eAT_commands.at: { at = "AT"; break }
                    case eAT_commands.at_rst: { at = "AT+RST"; break }
                    case eAT_commands.ate0: { at = "ATE0"; break }
                    case eAT_commands.ate1: { at = "ATE1"; break }
                    case eAT_commands.at_gmr: { at = "AT+GMR"; break }
                    case eAT_commands.at_cmd: { at = "AT+CMD?"; break }
                    case eAT_commands.at_mqttconn: { at = "AT+MQTTCONN?"; break }
        
                } */
        if (at == "true")
            return true
        else if (at.length > 0) {
            serial.writeString(at + String.fromCharCode(13) + String.fromCharCode(10))
            return wait_response(sekunden * 1000)
        }
        else
            return false// at_command == eAT_commands.none_true
        /*         if (enabled) {
                    serial.writeString(at + String.fromCharCode(13) + String.fromCharCode(10))
                    return wait_response(timeout)
                } else {
                    return false
                } */
    }











    const OK = String.fromCharCode(13) + String.fromCharCode(10) + "OK" + String.fromCharCode(13) + String.fromCharCode(10)

    function wait_response(timeout_ms: number) {
        let read_string: string
        response_index = response_array.length
        let start = input.runningTime()
        while (input.runningTime() - start < timeout_ms) {
            read_string = serial.readString()
            if (read_string.length > 0) {
                response_array.push(read_string)
                if (read_string.includes(OK)) {
                    return true
                }
            }
            basic.pause(20) // ms
        }
        return false
    }

    //% group="AT" subcategory="WLAN MQTT"
    //% block="AT Response Array" weight=1
    export function get_response() {
        return response_array
    }

    //% blockId=serial_eAT blockHidden=true
    //% group="AT" subcategory="WLAN MQTT"
    //% block="%pAT" weight=3
    export function serial_eAT(pAT: eAT_commands): string {
        switch (pAT) {
            case eAT_commands.none_true: return "true"
            case eAT_commands.at: return "AT"
            case eAT_commands.at_rst: return "AT+RST"
            case eAT_commands.ate0: return "ATE0"
            case eAT_commands.ate1: return "ATE1"
            case eAT_commands.at_gmr: return "AT+GMR"
            case eAT_commands.at_cmd: return "AT+CMD?"
            case eAT_commands.at_mqttconn: return "AT+MQTTCONN?"
            default: return ""
        }
    }

    export enum eAT_commands {
        //% block="AT -"
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

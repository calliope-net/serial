
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

Lutz Elßner, Freiberg, Oktober 2025, lutz@elssner.net
*/
    let q_response_array: string[] = [] // push in wait_response, max. Länge = 10
    let q_response_index = 0

    //% group="Cytron 'Grove WiFi 8266' for micro:bit and beyond" subcategory="WLAN MQTT IoT"
    //% block="beim Start Grove RX/TX"
    export function init_serial() {
        serial.redirect(
            SerialPin.C17,
            SerialPin.C16,
            BaudRate.BaudRate115200
        )
        serial.setTxBufferSize(80)
        serial.setRxBufferSize(200)
        clear_response()
    }



    // ========== group="WLAN (gibt true zurück, wenn Response OK)" subcategory="WLAN MQTT IoT"

    //% group="WLAN (gibt true zurück, wenn Response OK)" subcategory="WLAN MQTT IoT"
    //% block="WLAN verbinden SSID %ssid Password %password || Timeout %sekunden s"
    //% sekunden.min=1 sekunden.max=10 sekunden.defl=10
    export function wifi_connect(ssid: string, password: string, sekunden = 10) {
        //clear_response()
        if (at_command("AT+CWMODE=1", 1))
            return at_command("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"", sekunden) // 10 Sekunden
        else
            return false
    }



    // ========== group="MQTT (hat nur Cytron in der 8266 Firmware)" subcategory="WLAN MQTT IoT"

    //% group="MQTT (hat nur Cytron in der 8266 Firmware)" subcategory="WLAN MQTT IoT"
    //% block="MQTT Client ID %client_id || Username %username Password %password Timeout %sekunden s" weight=9
    //% client_id.defl="calliope" username.defl="" password.defl=""
    //% sekunden.min=1 sekunden.max=10 sekunden.defl=2
    //% inlineInputMode=inline
    export function mqtt_client(client_id: string, username?: string, password?: string, sekunden = 2) {
        if (!username) username = ""
        if (!password) password = ""
        //clear_response()
        // return (at_command("AT+MQTTUSERCFG=0,1,\"calliope\",\"\",\"\",0,0,\"\"", 5))
        return (at_command("AT+MQTTUSERCFG=0,1,\"" + client_id + "\",\"" + username + "\",\"" + password + "\",0,0,\"\"", sekunden)) // 2 Sekunden
    }

    //% group="MQTT (hat nur Cytron in der 8266 Firmware)" subcategory="WLAN MQTT IoT"
    //% block="MQTT Client verbinden Host %host || Port %port Timeout %sekunden s" weight=8
    //% host.defl="192.168.8.2" port.defl=1883
    //% sekunden.min=1 sekunden.max=10 sekunden.defl=5
    export function mqtt_connect(host: string, port = 1883, sekunden = 5) {
        //clear_response()
        //if (at_command("AT+MQTTUSERCFG=0,1,\"calliope\",\"\",\"\",0,0,\"\"", 5))
        return at_command("AT+MQTTCONN=0,\"" + host + "\"," + port + ",0", sekunden) // 5 Sekunden
        //else
        //    return false
    }

    //% group="MQTT (hat nur Cytron in der 8266 Firmware)" subcategory="WLAN MQTT IoT"
    //% block="MQTT Publish Topic %topic Daten %payload || Timeout %sekunden s" weight=6
    //% topic.defl="topic"
    //% sekunden.min=1 sekunden.max=10 sekunden.defl=5
    export function mqtt_publish(topic: string, payload: string, sekunden = 5) {
        //clear_response()
        return at_command("AT+MQTTPUB=0,\"" + topic + "\",\"" + payload + "\",1,0", sekunden) // 5 Sekunden
    }



    // ========== group="Daten mit ; trennen (Komma nicht erlaubt)" subcategory="WLAN MQTT IoT"

    //% group="Daten mit ; trennen (Komma nicht erlaubt)" subcategory="WLAN MQTT IoT"
    //% block="%sep %t1 %t2 || %t3 %t4 %t5 %t6" weight=4
    //% sep.defl=";"
    //% inlineInputMode=inline
    export function string_join(sep: string, t1: any, t2: any, t3?: any, t4?: any, t5?: any, t6?: any) {
        let list: string[] = []
        if (t1 || t1 === 0) { // Antwort von Copilot:
            // Hier landest du, wenn x ≠ "" ist – 
            // also bei 0, bei nicht-leeren Strings, bei Objekten, true, …
            list.push(convertToText(t1))
        } else {
            // x ist entweder "" oder ein anderer falsy-Wert (undefined, null, false, NaN)
        }
        if (t2 || t2 === 0) list.push(convertToText(t2))
        if (t3 || t3 === 0) list.push(convertToText(t3))
        if (t4 || t4 === 0) list.push(convertToText(t4))
        if (t5 || t5 === 0) list.push(convertToText(t5))
        if (t6 || t6 === 0) list.push(convertToText(t6))

        return list.join(sep)
    }

    //% group="Daten mit ; trennen (Komma nicht erlaubt)" subcategory="WLAN MQTT IoT"
    //% block="%sep %list" weight=3
    //% sep.defl=";"
    export function array_join(sep: string, list: string[]) {
        return list.join(sep)
    }



    // ========== group="AT Kommandos" subcategory="WLAN MQTT IoT"

    //% group="AT Kommandos" subcategory="WLAN MQTT IoT"
    //% block="%at Timeout %sekunden Sekunden" weight=8
    //% at.shadow=serial_eAT
    //% sekunden.min=1 sekunden.max=10 sekunden.defl=2
    export function at_command(at: string, sekunden: number) {
        if (at == "true")
            return true
        else if (at.length > 0) {
            serial.writeString(at + String.fromCharCode(13) + String.fromCharCode(10))
            return wait_response(sekunden * 1000)
        }
        else
            return false
    }

    //% group="AT Kommandos" subcategory="WLAN MQTT IoT"
    //% block="AT Response Array" weight=3
    export function get_response() {
        return q_response_array
    }

    //% group="AT Kommandos" subcategory="WLAN MQTT IoT"
    //% block="AT Response Index" weight=2
    export function get_response_index() {
        return q_response_index
    }


    //% group="AT Kommandos" subcategory="WLAN MQTT IoT" deprecated=true
    //% block="AT Response Array leeren" weight=1
    export function clear_response() {
        // Simulator pxsim_Array_.length_set is not a function
        //if ("€".charCodeAt(0) != 8364)
        //response_array.length = 0
        q_response_array = []
        q_response_index = 0
    }



    // ========== blockHidden=true

    const OK = String.fromCharCode(13) + String.fromCharCode(10) + "OK" + String.fromCharCode(13) + String.fromCharCode(10)

    function wait_response(timeout_ms: number) {
        let read_string: string
        q_response_index = q_response_array.length
        let start = input.runningTime()
        while (input.runningTime() - start < timeout_ms) {
            read_string = serial.readString()
            if (read_string.length > 0) {
                while (q_response_array.length > 9) {
                    q_response_array.removeAt(0)
                    q_response_index--
                }
                /*  if (q_response_array.length > 9) {
                     q_response_array.removeAt(0)
                     q_response_index--
                 } */
                q_response_array.push(read_string)
                if (read_string.includes(OK)) {
                    return true
                }
            }
            basic.pause(50) // ms
        }
        return false
    }

    //% blockId=serial_eAT blockHidden=true
    //% group="AT Kommandos" subcategory="WLAN MQTT IoT"
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
            case eAT_commands.at_mqttclean: return "AT+MQTTCLEAN=0"
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
        at_mqttconn,
        //% block="AT+MQTTCLEAN=0 Close MQTT"
        at_mqttclean
    }

} // serial.ts

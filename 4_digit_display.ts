
namespace serial { /* 4_digit_display.ts
"Grove": "github:calliope-edu/pxt-grove#v0.9.2"
*/

    //% group="Grove - 4-Digit Display" subcategory="4-Digit Display"
    //% block="Pins: Takt %clkPin Daten %dataPin" weight=9
    //% clkPin.defl=DigitalPin.C16 dataPin.defl=DigitalPin.C17
    //% blockSetVariable=Display
    export function createDisplay(clkPin: DigitalPin, dataPin: DigitalPin): TM1637 {
        let display = new TM1637();

        display.buf = pins.createBuffer(4);
        display.clkPin = clkPin;
        display.dataPin = dataPin;
        display.brightnessLevel = 0;
        display.pointFlag = false;
        display.clear();

        return display;
    }


    // ========== class TM1637

    export class TM1637 {
        clkPin: DigitalPin
        dataPin: DigitalPin
        brightnessLevel: number
        pointFlag: boolean
        buf: Buffer


        // ========== group="4-Ziffern Display" subcategory="4-Digit Display"

        //% group="dezimal" subcategory="4-Digit Display"
        //% block="%Display Zahl 0..9999 anzeigen %dispData" weight=9
        show(dispData: number) {
            let compare_01: number = dispData % 100;
            let compare_001: number = dispData % 1000;

            if (dispData < 10) {
                this.bit(dispData, 3);
                this.bit(0x7f, 2);
                this.bit(0x7f, 1);
                this.bit(0x7f, 0);
            }
            else if (dispData < 100) {
                this.bit(dispData % 10, 3);
                if (dispData > 90) {
                    this.bit(9, 2);
                } else {
                    this.bit(Math.floor(dispData / 10) % 10, 2);
                }

                this.bit(0x7f, 1);
                this.bit(0x7f, 0);
            }
            else if (dispData < 1000) {
                this.bit(dispData % 10, 3);
                if (compare_01 > 90) {
                    this.bit(9, 2);
                } else {
                    this.bit(Math.floor(dispData / 10) % 10, 2);
                }
                if (compare_001 > 900) {
                    this.bit(9, 1);
                } else {
                    this.bit(Math.floor(dispData / 100) % 10, 1);
                }
                this.bit(0x7f, 0);
            }
            else if (dispData < 10000) {
                this.bit(dispData % 10, 3);
                if (compare_01 > 90) {
                    this.bit(9, 2);
                } else {
                    this.bit(Math.floor(dispData / 10) % 10, 2);
                }
                if (compare_001 > 900) {
                    this.bit(9, 1);
                } else {
                    this.bit(Math.floor(dispData / 100) % 10, 1);
                }
                if (dispData > 9000) {
                    this.bit(9, 0);
                } else {
                    this.bit(Math.floor(dispData / 1000) % 10, 0);
                }
            }
            else {
                this.bit(9, 3);
                this.bit(9, 2);
                this.bit(9, 1);
                this.bit(9, 0);
            }
        }


        //% group="dezimal" subcategory="4-Digit Display"
        //% block="%Display Ziffer 0..9 anzeigen %dispData an Stelle %bitAddr" weight=7
        //% dispData.min=0 dispData.max=9
        //% bitAddr.min=0 bitAddr.max=3
        bit(dispData: number, bitAddr: eZiffer) {
            if ((dispData == 0x7f) || ((dispData <= 9) && (bitAddr <= 3))) {
                let segData = 0;

                segData = this.coding(dispData);
                this.start();
                this.writeByte(0x44);
                this.stop();
                this.start();
                this.writeByte(bitAddr | 0xc0);
                this.writeByte(segData);
                this.stop();
                this.start();
                this.writeByte(0x88 + this.brightnessLevel);
                this.stop();

                this.buf[bitAddr] = dispData;
            }
        }



        // ========== group="Steuerung" subcategory="4-Digit Display"



        //% group="Grove - 4-Digit Display" subcategory="4-Digit Display"
        //% block="%Display löschen" weight=4
        clear() {
            this.bit(0x7f, 0x00);
            this.bit(0x7f, 0x01);
            this.bit(0x7f, 0x02);
            this.bit(0x7f, 0x03);
        }


        //% group="Grove - 4-Digit Display" subcategory="4-Digit Display"
        //% block="%Display Helligkeit %level 0..7" weight=3
        //% level.min=0 level.max=7 level.defl=5
        set(level: number) {
            this.brightnessLevel = level;
            this.bit(this.buf[0], 0x00);
            this.bit(this.buf[1], 0x01);
            this.bit(this.buf[2], 0x02);
            this.bit(this.buf[3], 0x03);
        }



        //% group="Grove - 4-Digit Display" subcategory="4-Digit Display"
        //% block="%Display Doppelpunkt %point" weight=2
        // blockId=grove_tm1637_display_point 
        //%  point.shadow=toggleOnOff
        point(point: boolean) {
            this.pointFlag = point;

            this.bit(this.buf[0], 0x00);
            this.bit(this.buf[1], 0x01);
            this.bit(this.buf[2], 0x02);
            this.bit(this.buf[3], 0x03);
        }


        // ========== private

        private writeByte(wrData: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.clkPin, 0);
                if (wrData & 0x01) pins.digitalWritePin(this.dataPin, 1);
                else pins.digitalWritePin(this.dataPin, 0);
                wrData >>= 1;
                pins.digitalWritePin(this.clkPin, 1);
            }

            pins.digitalWritePin(this.clkPin, 0); // Wait for ACK
            pins.digitalWritePin(this.dataPin, 1);
            pins.digitalWritePin(this.clkPin, 1);
        }

        private start() {
            pins.digitalWritePin(this.clkPin, 1);
            pins.digitalWritePin(this.dataPin, 1);
            pins.digitalWritePin(this.dataPin, 0);
            pins.digitalWritePin(this.clkPin, 0);
        }

        private stop() {
            pins.digitalWritePin(this.clkPin, 0);
            pins.digitalWritePin(this.dataPin, 0);
            pins.digitalWritePin(this.clkPin, 1);
            pins.digitalWritePin(this.dataPin, 1);
        }

        private coding(dispData: number): number {
            let pointData = 0;

            if (this.pointFlag == true) pointData = 0x80;
            else if (this.pointFlag == false) pointData = 0;

            if (dispData == 0x7f) dispData = 0x00 + pointData;
            else dispData = TubeTab[dispData] + pointData;

            return dispData;
        }

    }

    let TubeTab: number[] = [
        0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07,
        0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71
    ]

    export enum eZiffer {
        //% block="0..."
        a = 0,
        //% block=".1.."
        b = 1,
        //% block="..2."
        c = 2,
        //% block="...3"
        d = 3
    }

} // 4_digit_display.ts
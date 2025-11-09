
namespace serial { /* 4_digit_display.ts
"Grove": "github:calliope-edu/pxt-grove#v0.9.2"
*/

    //% group="Grove - 4-Digit Display" subcategory="4-Digit Display"
    //% block="Pins: Takt %clkPin Daten %dataPin" weight=9
    //% clkPin.defl=DigitalPin.C16 dataPin.defl=DigitalPin.C17
    //% blockSetVariable=Display
    export function createDisplay(clkPin: DigitalPin, dataPin: DigitalPin): TM1637 {
        let display = new TM1637()

        display.buf = pins.createBuffer(4)
        display.clkPin = clkPin
        display.dataPin = dataPin
        display.brightnessLevel = 5
        display.pointFlag = false
        display.clear()

        return display
    }


    // ========== class TM1637

    export class TM1637 {
        clkPin: DigitalPin
        dataPin: DigitalPin
        brightnessLevel: number
        pointFlag: boolean
        buf: Buffer


        //% group="hexadezimal" subcategory="4-Digit Display"
        //% block="%Display Zahl 0..FFFF anzeigen %hex_string || %display0" weight=9
        display_hex(hex_string: string, display0 = false) {
            let digits: number[] = display0 ? [0, 0, 0, 0] : [0x3f, 0x3f, 0x3f, 0x3f]
            for (let i = 0; i < hex_string.length; i++) {
                let ci = hex_string.charAt(i)
                if (ci == '-')
                    digits.push(0b01000000)
                else if (ci == '°')
                    digits.push(0b01100011)
                else {
                    let hi = parseInt(ci, 16)
                    if (hi != NaN) 
                        digits.push(this.convert_7segment(hi))
                     else
                        digits[digits.length - 1] |= 0x80 // Doppelpunkt bei letzter Ziffer an schalten
                }
                // digits.push(parseInt(hex_string.charAt(i), 16))
            }
            basic.showNumber(digits.length)

            this.segmente_anzeigen(digits.pop(), 3) // Einer
            this.segmente_anzeigen(digits.pop(), 2) // Zehner
            this.segmente_anzeigen(digits.pop(), 1) // Hunderter
            this.segmente_anzeigen(digits.pop(), 0) // Tausender
        }

        // ========== group="4-Ziffern Display" subcategory="4-Digit Display"

        //% group="dezimal" subcategory="4-Digit Display"
        //% block="%Display Zahl 0..9999 anzeigen %dispData" weight=9
        show(dispData: number) {
            let compare_01: number = dispData % 100
            let compare_001: number = dispData % 1000

            if (dispData < 10) {
                this.ziffer_anzeigen(dispData, 3) // Einer
                this.ziffer_anzeigen(0x7f, 2) // 0-1-2-aus
                this.ziffer_anzeigen(0x7f, 1)
                this.ziffer_anzeigen(0x7f, 0)
            }
            else if (dispData < 100) {
                this.ziffer_anzeigen(dispData % 10, 3) // Einer
                if (dispData > 90) {
                    this.ziffer_anzeigen(9, 2) // 90
                } else {
                    this.ziffer_anzeigen(Math.floor(dispData / 10) % 10, 2) // Zehner
                }

                this.ziffer_anzeigen(0x7f, 1) // 0-1-aus
                this.ziffer_anzeigen(0x7f, 0)
            }
            else if (dispData < 1000) {
                this.ziffer_anzeigen(dispData % 10, 3) // Einer
                if (compare_01 > 90) {
                    this.ziffer_anzeigen(9, 2) // 90
                } else {
                    this.ziffer_anzeigen(Math.floor(dispData / 10) % 10, 2) // Zehner
                }
                if (compare_001 > 900) {
                    this.ziffer_anzeigen(9, 1) // 900
                } else {
                    this.ziffer_anzeigen(Math.floor(dispData / 100) % 10, 1) // Hunderter
                }
                this.ziffer_anzeigen(0x7f, 0) // 0-aus
            }
            else if (dispData < 10000) {
                this.ziffer_anzeigen(dispData % 10, 3) // Einer
                if (compare_01 > 90) {
                    this.ziffer_anzeigen(9, 2) // 90
                } else {
                    this.ziffer_anzeigen(Math.floor(dispData / 10) % 10, 2) // Zehner
                }
                if (compare_001 > 900) {
                    this.ziffer_anzeigen(9, 1) // 900
                } else {
                    this.ziffer_anzeigen(Math.floor(dispData / 100) % 10, 1) // Hunderter
                }
                if (dispData > 9000) {
                    this.ziffer_anzeigen(9, 0) // 9000
                } else {
                    this.ziffer_anzeigen(Math.floor(dispData / 1000) % 10, 0) // Tausender
                }
            }
            else { // 9999
                this.ziffer_anzeigen(9, 3) // Einer
                this.ziffer_anzeigen(9, 2) // Zehner
                this.ziffer_anzeigen(9, 1) // Hunderter
                this.ziffer_anzeigen(9, 0) // Tausender
            }
        }


        //% group="dezimal" subcategory="4-Digit Display"
        //% block="%Display Ziffer 0..9 anzeigen %dispData an Stelle %stelle" weight=7
        //% dispData.min=0 dispData.max=9
        // stelle.min=0 stelle.max=3
        //% stelle.shadow=serial_eZiffer
        ziffer_anzeigen(ziffer_0_9: number, stelle_0_3: number) {
            // if ((ziffer_0_9 == 0x7f) || ((ziffer_0_9 <= 9) && (stelle_0_3 <= 3))) {
            let segData = 0;

            segData = this.convert_7segment(ziffer_0_9, this.pointFlag)
            this.start();
            this.writeByte(0x44);
            this.stop();
            this.start();
            this.writeByte(stelle_0_3 | 0xc0);
            this.writeByte(segData);
            this.stop();
            this.start();
            this.writeByte(0x88 + this.brightnessLevel);
            this.stop();

            this.buf[stelle_0_3] = ziffer_0_9 // nur merken für Helligkeit und Doppelpunkt
            // }
        }

        segmente_anzeigen(seg_byte: number, stelle_0_3: number) {
            this.start()
            this.writeByte(0x44)
            this.stop()
            this.start()
            this.writeByte(stelle_0_3 | 0xc0)
            this.writeByte(seg_byte)
            this.stop()
            this.start()
            this.writeByte(0x88 + this.brightnessLevel)
            this.stop()
        }

        // ========== group="Steuerung" subcategory="4-Digit Display"



        //% group="Grove - 4-Digit Display" subcategory="4-Digit Display"
        //% block="%Display löschen" weight=4
        clear() {
            this.ziffer_anzeigen(0x7f, 0x00);
            this.ziffer_anzeigen(0x7f, 0x01);
            this.ziffer_anzeigen(0x7f, 0x02);
            this.ziffer_anzeigen(0x7f, 0x03);
        }


        //% group="Grove - 4-Digit Display" subcategory="4-Digit Display"
        //% block="%Display Helligkeit %level 0..7" weight=3
        //% level.min=0 level.max=7 level.defl=5
        set(level: number) {
            this.brightnessLevel = level;
            this.ziffer_anzeigen(this.buf[0], 0x00);
            this.ziffer_anzeigen(this.buf[1], 0x01);
            this.ziffer_anzeigen(this.buf[2], 0x02);
            this.ziffer_anzeigen(this.buf[3], 0x03);
        }



        //% group="Grove - 4-Digit Display" subcategory="4-Digit Display"
        //% block="%Display Doppelpunkt %point" weight=2
        // blockId=grove_tm1637_display_point 
        //%  point.shadow=toggleOnOff
        point(point: boolean) {
            this.pointFlag = point;

            /*   this.ziffer_anzeigen(this.buf[0], 0x00);
              this.ziffer_anzeigen(this.buf[1], 0x01);
              this.ziffer_anzeigen(this.buf[2], 0x02);
              this.ziffer_anzeigen(this.buf[3], 0x03); */
        }


        // ========== private

        private writeByte(wrData: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.clkPin, 0)
                if (wrData & 0x01)
                    pins.digitalWritePin(this.dataPin, 1)
                else
                    pins.digitalWritePin(this.dataPin, 0)
                wrData >>= 1
                pins.digitalWritePin(this.clkPin, 1)
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

        private convert_7segment(hex_0_15: number, punkt: boolean = false) { // Punkt rechts neben der Ziffer; Doppelpunkt nur bei Ziffer .1:..
            return TubeTab[hex_0_15] | (punkt ? 0x80 : 0x00)
        }

        /*   private coding(ziffer_0_9: number): number {
              let pointData = 0;
  
              if (this.pointFlag)
                  pointData = 0x80 // Doppelpunkt
              //else //if (this.pointFlag == false)
              //    pointData = 0
  
              if (ziffer_0_9 == 0x7f)
                  ziffer_0_9 = 0x00 + pointData;
              else
                  ziffer_0_9 = TubeTab[ziffer_0_9] + pointData;
  
              return ziffer_0_9;
          } */

    }

    let TubeTab: number[] = [
        0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, // 0 1 2 3 4 5 6 7
        0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71 // 8 9 A b C d E F
    ]


    //% blockId=serial_eZiffer blockHidden=true
    //% block="%pZiffer" 
    export function serial_eZiffer(pZiffer: eZiffer): number { return pZiffer }

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
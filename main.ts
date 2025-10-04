serial.initWLAN()
if (serial.at_command(serial.eAT_commands.none, 1)) {
    basic.setLedColor(0x00ff00)
} else {
    basic.setLedColor(0xff0000)
}

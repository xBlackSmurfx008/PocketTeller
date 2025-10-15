#!/usr/bin/expect -f
set timeout 10
spawn ~/Library/Android/sdk/platform-tools/adb pair 192.168.1.98:44487
expect "Enter pairing code:"
send "91008\r"
expect eof

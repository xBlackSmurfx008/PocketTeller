#!/usr/bin/expect -f
set timeout 10
spawn ~/Library/Android/sdk/platform-tools/adb pair 192.168.1.98:45295
expect "Enter pairing code:"
send "590599\r"
expect eof

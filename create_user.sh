#!/usr/bin/expect -f
set username [lindex $argv 0]
set password [lindex $argv 1]

spawn ocpasswd -c /etc/ocserv/clients/ocpasswd $username
expect "Enter password:"
send "$password\r"
expect "Re-enter password:"
send "$password\r"
expect eof

## После создания сделай файл исполняемым:
## chmod +x create_user.sh

(Get-Content .\pvkey.txt) -replace '^0x', '' | Set-Content .\pvkey.txt

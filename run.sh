#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"

while true; do
    echo "$(date): khởi động Node..."
    npm start
    echo "$(date): tiến trình Node đã dừng (exit code $?), khởi động lại sau 3s..."
    sleep 3
done
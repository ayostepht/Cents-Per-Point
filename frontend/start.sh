#!/bin/sh
PORT=${PORT:-3000}
IP=$(hostname -i | awk '{print $1}')
echo "You can access the UI at: http://$IP:$PORT"
exec serve -s build -l $PORT 
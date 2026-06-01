#!/bin/bash
# Double-click this file, or run: ./preview.sh
cd "$(dirname "$0")"
PORT=8765
URL="http://127.0.0.1:${PORT}/"
PIDFILE=".preview-server.pid"

stop_old() {
  if [ -f "$PIDFILE" ]; then
    oldpid=$(cat "$PIDFILE")
    kill "$oldpid" 2>/dev/null
    rm -f "$PIDFILE"
  fi
  lsof -ti tcp:"$PORT" 2>/dev/null | xargs kill 2>/dev/null
}

start_server() {
  stop_old
  echo "Starting server at $URL"
  nohup python3 -m http.server "$PORT" --bind 127.0.0.1 > .preview-server.log 2>&1 &
  echo $! > "$PIDFILE"
  sleep 0.8
}

if ! curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q 200; then
  start_server
fi

if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q 200; then
  echo "Server is running."
  open "$URL" || open -a "Google Chrome" "$URL" || open -a Safari "$URL"
  echo "Opened $URL"
  echo "Leave this window open, or run: tail -f .preview-server.log"
else
  echo "Could not start server. Try manually:"
  echo "  cd \"$(pwd)\""
  echo "  python3 -m http.server $PORT --bind 127.0.0.1"
  echo "Then open $URL"
  exit 1
fi

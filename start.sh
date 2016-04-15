#!/usr/bin/env bash

while true
do
	node ./bin/www 2>&1 >> /tmp/discord-bot-log
	sleep 5
done
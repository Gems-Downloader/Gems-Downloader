#!/bin/bash

sudo -u $SUDO_USER /usr/lib/postgresql/9.1/bin/pg_ctl -D ~/gems_downloader/postgresql stop
sudo -u $SUDO_USER /usr/lib/postgresql/9.1/bin/pg_ctl -D ~/gems_downloader/postgresql start

# update the rubygems DB
~/gems_downloader/rubygems.org/script/load-pg-dump -u $USER -c ~/gems_downloader/RG_PG_DUMP
rm -rf ~/gems_downloader/RG_PG_DUMP

# Latest is from the past two weeks (assuming we run it every week).
QUERY_DATE="$(date --date="2 weeks ago" +%d/%m/%y)"
rg_downloader -d $QUERY_DATE

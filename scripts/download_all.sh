#!/bin/bash

# stop existing user postgresql services and start a new one
sudo -u $SUDO_USER /usr/lib/postgresql/9.1/bin/pg_ctl -D ~/gems_downloader/postgresql stop
sudo -u $SUDO_USER /usr/lib/postgresql/9.1/bin/pg_ctl -D ~/gems_downloader/postgresql start

# update the rubygems DB
~/gems_downloader/rubygems.org/script/load-pg-dump -u $USER -c ~/gems_downloader/RG_PG_DUMP
rm -rf ~/gems_downloader/RG_PG_DUMP

rg_downloader

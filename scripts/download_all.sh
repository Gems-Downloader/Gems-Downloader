#!/bin/bash

# stop existing user postgresql services and start a new one
{
  /usr/lib/postgresql/9.1/bin/pg_ctl -D ~/gems_downloader/postgresql stop
  /usr/lib/postgresql/9.1/bin/pg_ctl -D ~/gems_downloader/postgresql start
} &> /dev/null

# update the rubygems DB
~/gems_downloader/rubygems.org/script/load-pg-dump -u $USER -c ~/gems_downloader/RG_PG_DUMP
rm -rf ~/gems_downloader/RG_PG_DUMP

rg_downloader

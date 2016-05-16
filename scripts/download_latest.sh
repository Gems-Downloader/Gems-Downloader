#!/bin/bash

# update the rubygems DB
~/gems_downloader/rubygems.org/script/load-pg-dump -u $SUDO_USER -c ~/gems_downloader/RG_PG_DUMP
rm -rf ~/gems_downloader/RG_PG_DUMP

# Latest is from the past two weeks (assuming we run it every week).
QUERY_DATE=`date -v-14d +%d/%m/%y`
rg_downloader -d $QUERY_DATE

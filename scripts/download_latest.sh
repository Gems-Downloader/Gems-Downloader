#!/bin/bash

# Latest is from the past two weeks (assuming we run it every week).
QUERY_DATE=`date -v-14d +%d/%m/%y`
rg_downloader -d $QUERY_DATE

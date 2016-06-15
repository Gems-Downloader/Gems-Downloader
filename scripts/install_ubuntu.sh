#!/bin/bash

# run as sudo
if [ $EUID != 0 ]; then
  sudo "$0" "$@"
  exit $?
fi

# create the directory to place everything in
sudo mkdir ~/gems_downloader
sudo chmod -R ugo+rw ~/gems_downloader

# update resorces
sudo rm -rf /var/lib/apt/lists/*
sudo apt-get update

# install postgress
sudo apt-get -f -y install postgresql-9.1 postgresql-contrib

# kill existing postgresql running (and delete their lock files)
sudo service postgresql stop
sudo chmod -R ugo+rw /var/run/postgresql
sudo rm -rf /var/run/postgresql/*

# stop existing user postgresql services and delete the DB folder
sudo -u $SUDO_USER /usr/lib/postgresql/9.1/bin/pg_ctl -D ~/gems_downloader/postgresql stop
sudo rm -rf ~/gems_downloader/postgresql
sudo -u $SUDO_USER /usr/lib/postgresql/9.1/bin/initdb ~/gems_downloader/postgresql
sudo -u $SUDO_USER /usr/lib/postgresql/9.1/bin/pg_ctl -D ~/gems_downloader/postgresql -l ~/gems_downloader/postgresql/server.log start

# # wait a few seconds for the DB service to go up
sleep 5

# # install git
install git
sudo apt-get -f -y install git

# clone RubyGems.org project for the DB script
git clone https://github.com/rubygems/rubygems.org.git ~/gems_downloader/rubygems.org
# Downloanding and inporting the most updated version of the DB.
~/gems_downloader/rubygems.org/script/load-pg-dump -u $SUDO_USER -c ~/gems_downloader/RG_PG_DUMP
rm -rf ~/gems_downloader/RG_PG_DUMP

# install curl
sudo apt-get install curl

# install node.js
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get -f -y install nodejs

# install ruby
gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
curl -sSL https://get.rvm.io | bash -s stable
source ~/.rvm/scripts/rvm
rvm requirements
rvm install ruby
rvm use ruby --default
rvm rubygems current

# install RubyGems Downloader
git clone https://github.com/Gems-Downloader/RubyGems-Downloader.git ~/gems_downloader/RubyGems-Downloader
cd ~/gems_downloader/RubyGems-Downloader
npm remove -g
npm install -g
cd ..

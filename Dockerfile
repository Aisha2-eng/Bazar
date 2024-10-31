FROM ubuntu:latest

WORKDIR /home/

COPY . .

RUN apt-get update -y

RUN apt-get install -y nodejs npm

COPY package*.json ./

RUN npm install

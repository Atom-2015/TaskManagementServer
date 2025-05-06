FROM node:20

WORKDIR /myapp

COPY package*.json ./

RUN npm install

RUN npm install -g nodemon

COPY . .

EXPOSE 9001

CMD ["npm", "start"]

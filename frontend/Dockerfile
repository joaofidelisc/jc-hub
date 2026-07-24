FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Para desenvolvimento local
CMD ["npm", "run", "dev"]

FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install


COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
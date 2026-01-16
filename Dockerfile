FROM node:18-alpine

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 5173

# 개발 서버 실행 (호스트 0.0.0.0으로 바인딩하여 외부 접근 가능)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

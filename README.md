# seatly
Initial codebase for technical interviews

## Requirements

- Java 17
- Kotlin (JVM)
- Gradle
- Docker
- Docker Compose
- node
- yarn

## Running The App

```bash
cd infra
docker-compose up -d
cd ..

cd backend
./gradlew run
cd ..

cd frontend
yarn
yarn dev
```

## Running Backend Tests

```bash
cd infra
docker-compose up -d
cd ..

cd backend
./gradlew test
cd ..
```

## Running Frontend Checks

```bash
cd frontend
yarn typecheck

yarn test

```

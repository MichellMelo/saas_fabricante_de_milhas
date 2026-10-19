import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
 const app = await NestFactory.create(AppModule);
 app.setGlobalPrefix("api");
 app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? ["http://localhost:3000"],
  credentials: true
 });
 app.enableShutdownHooks();
 const port = Number(process.env.API_PORT ?? 4000);
 await app.listen(port);
 console.log("Fabricante de Milhas API listening on port " + port);
}
void bootstrap();

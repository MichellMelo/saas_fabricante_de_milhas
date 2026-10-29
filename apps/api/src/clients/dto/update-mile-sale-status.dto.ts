import { IsEnum } from "class-validator";
import { MileSaleStatusDto } from "./create-mile-sale.dto";

export class UpdateMileSaleStatusDto {
  @IsEnum(MileSaleStatusDto)
  status!: MileSaleStatusDto;
}

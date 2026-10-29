import { IsBoolean } from "class-validator";

export class SetGroupVipPublicationDto {
  @IsBoolean()
  published!: boolean;
}

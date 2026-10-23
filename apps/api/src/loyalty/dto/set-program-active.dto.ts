import { IsBoolean } from "class-validator";

export class SetProgramActiveDto {
  @IsBoolean()
  active!: boolean;
}

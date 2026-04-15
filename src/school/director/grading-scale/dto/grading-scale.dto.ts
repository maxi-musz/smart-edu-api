import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class GradeThresholdDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @MaxLength(12)
  label: string;

  @ApiProperty({ example: 80, description: 'Minimum percentage (inclusive) for this grade' })
  @IsNumber()
  @Min(0)
  @Max(100)
  minInclusive: number;
}

export class UpdateSchoolGradeScaleDto {
  @ApiProperty({ type: [GradeThresholdDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => GradeThresholdDto)
  bands: GradeThresholdDto[];
}

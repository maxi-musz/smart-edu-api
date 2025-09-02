import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TopicOrderDto {
  @ApiProperty({
    description: 'Topic ID',
    example: 'topic-uuid-123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'New order number for the topic',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  order: number;
}

export class ReorderTopicsDto {
  @ApiProperty({
    description: 'Array of topic orders',
    type: [TopicOrderDto],
    example: [
      { id: 'topic-1-uuid', order: 1 },
      { id: 'topic-2-uuid', order: 2 },
      { id: 'topic-3-uuid', order: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicOrderDto)
  topics: TopicOrderDto[];
}

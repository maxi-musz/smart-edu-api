import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

/** Must match exactly — prevents accidental calls. */
export const DELETE_ALL_LIBRARY_AI_BOOKS_CONFIRM = 'DELETE_ALL_LIBRARY_AI_BOOKS';

export class DeleteAllLibraryAiBooksDto {
  @ApiProperty({
    enum: [DELETE_ALL_LIBRARY_AI_BOOKS_CONFIRM],
    description: 'Type exactly DELETE_ALL_LIBRARY_AI_BOOKS to confirm.',
  })
  @IsString()
  @IsIn([DELETE_ALL_LIBRARY_AI_BOOKS_CONFIRM], {
    message: `confirm must be exactly "${DELETE_ALL_LIBRARY_AI_BOOKS_CONFIRM}"`,
  })
  confirm: string;
}

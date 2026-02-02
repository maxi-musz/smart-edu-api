import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const PERMISSION_ACTIONS = ['add', 'remove'] as const;

export class UpdatePermissionDto {
  @ApiProperty({
    description: 'Action: add or remove the permission',
    enum: PERMISSION_ACTIONS,
    example: 'add',
  })
  @IsString()
  @IsIn(PERMISSION_ACTIONS)
  action: (typeof PERMISSION_ACTIONS)[number];

  @ApiProperty({
    description: 'Permission code from the available-permissions catalog (e.g. manage_library_users, view_analytics)',
    example: 'view_analytics',
  })
  @IsString()
  @IsNotEmpty()
  permissionCode: string;
}

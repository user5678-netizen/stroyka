import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export class CreateProductWithFilesDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number = 0;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number = 0;

  // This field will be populated from uploaded files
  images?: string[];
}

// Separate validation for when images are uploaded as files
export class CreateProductWithUploadDto extends CreateProductWithFilesDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    minItems: 3,
  })
  @ValidateIf((o) => !o.images || o.images.length === 0)
  imageFiles?: any[]; // Will be populated by Multer
}
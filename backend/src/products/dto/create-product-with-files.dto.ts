import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductWithFilesDto {
  @ApiProperty({ example: 'Молоток строительный' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Профессиональный молоток для строительных работ' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2499.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 5, example: 4.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number = 0;

  @ApiPropertyOptional({ minimum: 0, example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_quantity?: number = 0;
}

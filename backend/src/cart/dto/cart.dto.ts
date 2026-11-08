import {
  IsUUID,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CartItemDto {
  @ApiProperty()
  @IsUUID()
  product_id: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ApplyPromoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
  };

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  line_total: number;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional()
  promo_code?: string;

  @ApiProperty()
  discount_amount: number;

  @ApiProperty()
  discount_percentage: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
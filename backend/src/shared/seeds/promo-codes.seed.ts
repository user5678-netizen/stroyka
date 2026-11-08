import { DataSource } from 'typeorm';
import { PromoCode } from '../entities/promo-code.entity';

export async function seedPromoCodes(dataSource: DataSource): Promise<void> {
  const promoCodeRepository = dataSource.getRepository(PromoCode);

  const promoCodes = [
    {
      code: 'SAVE10',
      discount_percentage: 10.00,
      is_active: true,
    },
    {
      code: 'BUILD10',
      discount_percentage: 10.00,
      is_active: true,
    },
    {
      code: 'WELCOME15',
      discount_percentage: 15.00,
      is_active: true,
    },
  ];

  for (const promoData of promoCodes) {
    const existing = await promoCodeRepository.findOne({
      where: { code: promoData.code },
    });

    if (!existing) {
      const promoCode = promoCodeRepository.create(promoData);
      await promoCodeRepository.save(promoCode);
      console.log(`Promo code seeded: ${promoData.code}`);
    }
  }
}
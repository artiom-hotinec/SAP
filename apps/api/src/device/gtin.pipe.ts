import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/** Accepts a GTIN-14 (exactly 14 digits) and rejects anything else with 400. */
@Injectable()
export class GtinPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^\d{14}$/.test(value)) {
      throw new BadRequestException('gtin must be 14 digits');
    }
    return value;
  }
}

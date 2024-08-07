import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma } from '@prisma/client';
import { IPaginationOptions } from 'src/common';

interface ICreateTradeRequest {
  requestedId: number;
  offeredId: number;
  userId: number;
}

@Injectable()
export class TradingService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new trade request record.
   *
   * @param requestedId the ID of the membership being requested
   * @param offeredId the ID of the membership being offered
   * @param userId the ID of the user
   */
  async create({ requestedId, offeredId, userId }: ICreateTradeRequest) {

    return this.prismaService.tradeRequest.create({
      data: {
        user: { connect: { id: userId } },
        requested: { connect: { id: requestedId } },
        offered: { connect: { id: offeredId } },
      },
    });
  }

  /**
   * Update the trade request record.
   *
   * @param where the where clause options
   * @param data the data to update
   */
  async update(
    where: Prisma.TradeRequestWhereUniqueInput,
    data: Prisma.TradeRequestUpdateInput,
  ) {
    return this.prismaService.tradeRequest.update({
      where,
      data,
    });
  }

  /**
   * Get all the trade request records.
   *
   * @param where the where clause options
   * @param orderBy the options used to order the data
   * @param data the data to update
   */
  async findMany(
    { limit, offset }: IPaginationOptions,
    orderBy?: Prisma.TradeRequestOrderByWithRelationInput,
    where?: Prisma.TradeRequestWhereInput,
  ) {
    return this.prismaService.tradeRequest.findMany({
      skip: offset,
      take: limit,
      where,
      orderBy,
    });
  }

  /**
   * Get a count of trade request records.
   *
   * @param where the where clause options
   */
  async count(where: Prisma.TradeRequestWhereInput) {
    return this.prismaService.tradeRequest.count({
      where,
    });
  }

  /**
   * Find one trade request.
   *
   * @param where the options to use to filter the search:
   */
  async findOne(
    where: Prisma.TradeRequestWhereInput, 
    include?: Prisma.TradeRequestInclude,
  ) {
    return this.prismaService.tradeRequest.findFirst({ where, include });
  }
}

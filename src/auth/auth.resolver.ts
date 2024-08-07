import { Args, Context, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { UserService } from '../user';
import { ISuccessResponse, IUser, JoiValidationPipe, Role, SuccessResponseModel, UserModel, createSuccessResponse } from '../common';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { CreateUserInput } from './inputs';
import { CreateUserSchema } from './schema';
import { EncryptionService } from '../encryption';
import { SuccessRegistrationResponseModel } from './models';
import { LocalAuthGuard } from './guards';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../wallet';

@ObjectType()
class RegisterationSuccessResponse extends SuccessResponseModel(UserModel) { }

@Resolver()
export class AuthResolver {
  constructor(
    private readonly userService: UserService,
    private readonly encryptionService: EncryptionService,
    private readonly jwtService: JwtService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Create an account for a user.
   *
   * @param payload the data required to register for a new user account
   */
  @Mutation(() => RegisterationSuccessResponse, {
    description: 'Create an account for a user.',
  })
  async register(
    @Args('payload', new JoiValidationPipe(CreateUserSchema))
    payload: CreateUserInput,
  ): Promise<ISuccessResponse<IUser>> {

    try {
      const user = await this.userService.findOne({
        username: payload.username,
      });

      if (user) {
        return createSuccessResponse(false, 'The username is already taken.', HttpStatus.CONFLICT);
      }

      const wallet = await this.walletService.createWallet();
      if (!wallet) {
        return createSuccessResponse(false, 'Failed to create a wallet.', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const { digest, ...data } = await this.userService.createUser({
        digest: this.encryptionService.generateHash(payload.password),
        username: payload.username,
        role: payload.role,
        wallet: {
          connect: {
            address: wallet.address,
          },
        }
      });
      return createSuccessResponse(true, 'Successfully created your account.', HttpStatus.CREATED, { ...data, role: data.role as Role }, wallet.onChainSummary.message);
    } catch (e) {
      console.error(e);
      return createSuccessResponse(false, `${e?.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verify the user credentials and receive an access token.
   *
   * @param username The user's username.
   * @param password The user's password.
   *
   * @param user The user data object containing the current user's ID
   */
  @Mutation(() => String, {
    description: 'Verify the user credentials and receive an access token.',
  })
  @UseGuards(LocalAuthGuard)
  async login(
    @Args('username', { description: "The user's username." }) username: string,
    @Args('password', { description: "The user's password." }) password: string,
    @Context('user') user: IUser,
  ) {
    return this.jwtService.signAsync({ sub: user.id, role: user.role, walletAddress: user.walletAddress });
  }
}

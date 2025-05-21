import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../user/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return this.generateTokens(user);
  }

  async register(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
    });
    
    const savedUser = await this.userRepository.save(user);
    
    // Remove password from response
    const { password: _, ...result } = savedUser;
    
    return this.generateTokens(result);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });
    
    if (!tokenEntity || tokenEntity.isRevoked || new Date() > tokenEntity.expiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    const user = tokenEntity.user;
    
    // Revoke the old refresh token
    await this.refreshTokenRepository.update(tokenEntity.id, { isRevoked: true });
    
    // Generate new tokens
    return this.generateTokens(user);
  }

  async logout(refreshToken: string) {
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });
    
    if (tokenEntity) {
      await this.refreshTokenRepository.update(tokenEntity.id, { isRevoked: true });
    }
    
    return { success: true };
  }

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id };
    
    // Generate access token
    const accessToken = this.jwtService.sign(payload);
    
    // Generate refresh token
    const refreshToken = uuidv4();
    
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Save refresh token to database
    await this.refreshTokenRepository.save({
      token: refreshToken,
      expiresAt,
      user: { id: user.id },
      userId: user.id,
    });
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
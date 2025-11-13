import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedService } from './feed.service';

@Controller('feed')
@UseGuards(AuthGuard('jwt')) // Protege o controller inteiro
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed(@Request() req, @Query('page') page: string = '1') {
    const userId = req.user.id;
    return this.feedService.getFeedForUser(userId, parseInt(page, 10));
  }
} 

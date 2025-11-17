import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedService } from './feed.service';

@Controller('feed')
@UseGuards(AuthGuard('jwt'))
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed(@Request() req, @Query('page') page: string = '1') {
    const userId = req.user.id;
    return this.feedService.getFeedForUser(userId, parseInt(page, 10));
  }

  @Get('for-you')
  getForYouFeed(@Request() req, @Query('page') page: string = '1') {
    const userId = req.user.id;
    return this.feedService.getForYouFeed(userId, parseInt(page, 10));
  }
}
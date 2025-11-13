import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Request() req) {
    return this.notificationsService.getNotificationsForUser(req.user.id);
  }

  @Post('read')
  markAsRead(@Request() req) {
    return this.notificationsService.markAsRead(req.user.id);
  }
} 

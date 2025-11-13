import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SupportsService } from './supports.service';

@Controller('proofs/:proofId/support')
export class SupportsController {
  constructor(private readonly supportsService: SupportsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  toggleSupport(@Param('proofId') proofId: string, @Request() req) {
    return this.supportsService.toggleSupport(proofId, req.user);
  }
} 

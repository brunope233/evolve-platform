import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller() // Deixamos o path base para ser definido no módulo
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('proofs/:proofId/comments')
  getCommentsForProof(@Param('proofId') proofId: string) {
    return this.commentsService.getCommentsForProof(proofId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('proofs/:proofId/comments')
  createComment(
    @Param('proofId') proofId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.createComment(proofId, createCommentDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string, @Request() req) {
    return this.commentsService.deleteComment(commentId, req.user);
  }
}
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ValidationPipe, BadRequestException } from '@nestjs/common';
import { JourneysService } from './journeys.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('journeys')
export class JourneysController {
  constructor(private readonly journeysService: JourneysService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: any, @Request() req) {
    const createJourneyDto = new CreateJourneyDto();
    createJourneyDto.title = body.title;
    createJourneyDto.description = body.description;
    createJourneyDto.tags = body.tags || []; 

    const validationPipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
    try {
      const validatedDto = await validationPipe.transform(createJourneyDto, { type: 'body', metatype: CreateJourneyDto });
      return this.journeysService.create(validatedDto, req.user);
    } catch(e) {
      throw new BadRequestException(e.message);
    }
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('author') authorUsername?: string,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.journeysService.findAll({ page, limit, authorUsername });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.journeysService.findOneById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe()) updateJourneyDto: UpdateJourneyDto, @Request() req) {
    return this.journeysService.update(id, updateJourneyDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.journeysService.remove(id, req.user);
  }
}
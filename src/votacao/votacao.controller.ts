import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { VotacaoService } from './votacao.service';
import { CreateVotacaoDto } from './dto/create-votacao.dto';
import { UpdateVotacaoDto } from './dto/update-votacao.dto';
import { CreateVotoDto } from './dto/create-voto.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('votacao')
export class VotacaoController {
  constructor(private readonly votacaoService: VotacaoService) {}

  @Post()
  create(@Body() createVotacaoDto: CreateVotacaoDto) {
    return this.votacaoService.create(createVotacaoDto);
  }

  @Get()
  findAll() {
    return this.votacaoService.findAll();
  }

  @Get('votos')
  findVotesByDate(@Query('date') date: string) {
    return this.votacaoService.findVotesByDate(date);
  }

  @Get(':id/votos')
  findVotesById(@Param('id') id: string) {
    return this.votacaoService.findVotesById(id);
  }

  @Post(':id/votar')
  votar(
    @Param('id') id: string,
    @Body() createVotoDto: CreateVotoDto,
    @GetUser() user: { id: number },
  ) {
    return this.votacaoService.votar(id, user.id, createVotoDto);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.votacaoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateVotacaoDto: UpdateVotacaoDto) {
    return this.votacaoService.update(id, updateVotacaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.votacaoService.remove(id);
  }
}

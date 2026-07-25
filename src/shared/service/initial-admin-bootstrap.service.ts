import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class InitialAdminBootstrapService implements OnApplicationBootstrap {
  constructor(private readonly userService: UserService) {}

  async onApplicationBootstrap() {
    await this.userService.ensureInitialAdmin();
  }
}

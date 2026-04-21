import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  saveVideo: jest.fn(),
  unsaveVideo: jest.fn(),
  isSaved: jest.fn(),
  getSavedVideos: jest.fn(),
};

const mockUser = { id: 'user-1', email: 'test@test.com', name: '테스트' };
const mockRequest = { user: mockUser };

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('POST /users/saved-videos → saveVideo 호출', async () => {
    mockUsersService.saveVideo.mockResolvedValue({ saved: true });
    const result = await controller.saveVideo(mockRequest as any, { videoId: 'yt-abc123' });
    expect(mockUsersService.saveVideo).toHaveBeenCalledWith('user-1', 'yt-abc123');
    expect(result).toEqual({ saved: true });
  });

  it('DELETE /users/saved-videos/:videoId → unsaveVideo 호출', async () => {
    mockUsersService.unsaveVideo.mockResolvedValue({ saved: false });
    const result = await controller.unsaveVideo(mockRequest as any, 'yt-abc123');
    expect(mockUsersService.unsaveVideo).toHaveBeenCalledWith('user-1', 'yt-abc123');
    expect(result).toEqual({ saved: false });
  });

  it('GET /users/saved-videos → getSavedVideos 호출', async () => {
    mockUsersService.getSavedVideos.mockResolvedValue([]);
    const result = await controller.getSavedVideos(mockRequest as any);
    expect(mockUsersService.getSavedVideos).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([]);
  });

  it('GET /users/saved-videos/:videoId → isSaved 호출', async () => {
    mockUsersService.isSaved.mockResolvedValue(true);
    const result = await controller.checkSaved(mockRequest as any, 'yt-abc123');
    expect(mockUsersService.isSaved).toHaveBeenCalledWith('user-1', 'yt-abc123');
    expect(result).toEqual({ saved: true });
  });
});

import { PlacesService } from './places.service'

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}))

const mockFindUnique = jest.fn()
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    place: { findUnique: mockFindUnique },
  })),
}))

describe('PlacesService.getVideosByPlace', () => {
  let service: PlacesService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new PlacesService()
  })

  it('returns [] when place is not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const result = await service.getVideosByPlace('unknown-place-id')
    expect(result).toEqual([])
  })

  it('excludes the current video when excludeVideoId is provided', async () => {
    const analyzedAt = new Date('2024-01-01T00:00:00Z')
    mockFindUnique.mockResolvedValue({
      appearances: [
        {
          video: {
            id: 'video-uuid-1',
            videoId: 'abc12345678',
            title: 'Tokyo Vlog',
            destCity: 'Tokyo',
            destCountry: 'JP',
            analyzedAt,
            channel: { channelName: 'TravelChan', thumbnailUrl: 'https://example.com/thumb.jpg' },
            _count: { places: 5 },
          },
        },
      ],
    })

    const result = await service.getVideosByPlace('ChIJtest', 'otherVideoId')
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { googlePlaceId: 'ChIJtest' },
      })
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      videoId: 'abc12345678',
      title: 'Tokyo Vlog',
      channelName: 'TravelChan',
      placeCount: 5,
      analyzedAt: '2024-01-01T00:00:00.000Z',
    })
  })

  it('falls back to empty string when channel thumbnailUrl is null', async () => {
    const analyzedAt = new Date('2024-01-01T00:00:00Z')
    mockFindUnique.mockResolvedValue({
      appearances: [
        {
          video: {
            id: 'video-uuid-2',
            videoId: 'xyz98765432',
            title: 'Osaka Walk',
            destCity: null,
            destCountry: null,
            analyzedAt,
            channel: { channelName: 'WalkChan', thumbnailUrl: null },
            _count: { places: 3 },
          },
        },
      ],
    })

    const result = await service.getVideosByPlace('ChIJtest2')
    expect(result[0].channelThumbnailUrl).toBe('')
  })
})

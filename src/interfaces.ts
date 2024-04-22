export interface Anime_Info {
  id: string,
  title: string,
  url: string,
  image: string,
  releaseDate: string,
  description: string,
  genres: [
    string
  ],
  subOrDub: string,
  type: string,
  status: string,
  otherName: string,
  totalEpisodes: number,
  episodes: [
    {
      id: string,
      number: number,
      url: string
    }
  ]
}

export interface Anime_Streaming {
  headers: {
    Referer: string,
  }
  sources: {
    url: string,
    quality: string,
  }[]
}

export interface Anime_Search_Results {
  currentPage: number,
  hasNextPage: true,
  results:
  {
    id: string,
    title: string,
    image: string,
    releaseDate: string,
    subOrDub: string
  }[],
}

export interface Anime_Recent_Episodes {
  currentPage: number,
  hasNextPage: true,
  results: [
    {
      id: string,
      episodeId: string,
      episodeNumber: number,
      title: string,
      image: string,
      url: string
    }
  ]
}

export interface Anime {
  episodes: {
    id: string,
    url: string,
  }[],
}

export interface AnimeUrl {
  headers: {
    Referer: string,
  }
  sources: {
    url: string,
    quality: string,
  }[]
}

export interface AnimeSearch {
  currentPage: 0,
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

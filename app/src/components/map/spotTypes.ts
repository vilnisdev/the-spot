export interface SpotMedia {
  id?: string
  type: 'image' | 'audio'
  url: string
  name?: string
}

export interface SpotComment {
  id: string
  author: string
  body: string
  date: string
}

export interface SpotForModal {
  id: string
  title: string
  lat: number
  lng: number
  description?: string
  state?: string
  date?: string
  author?: string
  tags?: string[]
  media?: SpotMedia[]
  comments?: SpotComment[]
  spot_networks: { network_id: string }[]
}

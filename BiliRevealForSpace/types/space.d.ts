export interface SpaceResponse {
    code: number
    data: {
        card: Card
    }
}

interface Card {
    mid: string
    name: string
    approve: boolean
    rank: string
    face: string
    DisplayRank: string
    regtime: number
    spacesta: number
    birthday: string
    place: string
    description: string
    article: number
    attentions: null
    fans: number
    space_tag: SpaceTag[]
}

export interface SpaceTag {
    type: string
    title: string
    text_color: string
    night_text_color: string
    background_color: string
    night_background_color: string
    uri: string
    icon: string
}

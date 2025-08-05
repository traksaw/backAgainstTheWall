
export interface CastCrewMember {
  name: string
  role: string
  description: string
  image?: string
  readMoreUrl?: string
  order?: number
}

export const castAndCrew: CastCrewMember[] = [
  {
    name: "Jenna Lam",
    role: "Samara, Executive Producer & Director",
    description: "Award-winning filmmaker with a passion for stories that explore human psychology and social issues. Jenna brings over a decade of experience in independent filmmaking, with previous work showcased at Sundance and SXSW.",
    image: "/cast/jenna-lam.jpg",
    order: 1,
    readMoreUrl: "https://www.linkedin.com/in/jennalamx/"
  },
  {
    name: "Corey Brown",
    role: "Boyfriend",
    description: "Talented actor bringing depth and authenticity to the role of the supportive boyfriend. Corey's performance captures the nuanced dynamics of relationships under financial pressure.",
    image: "/cast/corey-brown.jpg",
    order: 2
  },
  {
    name: "Gracie Prahek",
    role: "Mom",
    description: "Accomplished actress whose portrayal of the concerned mother brings emotional weight to the family dynamics central to the story.",
    image: "/cast/gracie-prahek.jpg",
    order: 3
  },
  {
    name: "Terry Cruz",
    role: "Assistant Director",
    description: "Experienced assistant director ensuring smooth production workflow and maintaining the creative vision throughout filming.",
    image: "/cast/terry-cruz.jpg",
    order: 4
  },
  {
    name: "James Liston",
    role: "Director of Photography, JL Films",
    description: "Skilled cinematographer capturing the visual essence of the story with innovative camera work and lighting techniques.",
    image: "/cast/james-liston.jpg",
    order: 5
  },
  {
    name: "Victoria Le",
    role: "Set Producer",
    description: "Dedicated producer managing all aspects of set operations and ensuring seamless coordination between departments.",
    image: "/cast/victoria-le.jpg",
    order: 6
  },
  {
    name: "Astoria Hendricks",
    role: "Production Assistant",
    description: "Essential team member supporting all production activities and contributing to the smooth operation of daily filming.",
    image: "/cast/astoria-hendricks.jpg",
    order: 7
  },
  {
    name: "Rachel Cherry",
    role: "Script Supervisor",
    description: "Meticulous script supervisor ensuring continuity throughout filming and maintaining the integrity of the narrative.",
    image: "/cast/rachel-cherry.jpg",
    order: 8
  }
]
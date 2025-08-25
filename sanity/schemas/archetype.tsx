const archetype = {
  name: 'archetype',
  title: 'Archetype',
  type: 'document',
  fields: [
    {
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Only published archetypes will appear in the app',
      initialValue: true
    },
    {
      name: 'key',
      title: 'Archetype Key',
      type: 'string',
      description: 'Must be one of: Avoider, Gambler, Realist, Architect',
      options: {
        list: [
          { title: 'Avoider', value: 'Avoider' },
          { title: 'Gambler', value: 'Gambler' },
          { title: 'Realist', value: 'Realist' },
          { title: 'Architect', value: 'Architect' },
        ],
        layout: 'radio'
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'strengths',
      title: 'Strengths',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule: any) => Rule.min(1)
    },
    {
      name: 'blindSpots',
      title: 'Blind Spots',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule: any) => Rule.min(1)
    },
    {
      name: 'reflectionQuestion',
      title: 'Reflection Question',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'filmCharacterTieIn',
      title: 'Film Character Tie-In',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'exploration',
      title: 'Exploration',
      type: 'object',
      fields: [
        { name: 'description', title: 'Description', type: 'text', rows: 3, validation: (Rule: any) => Rule.required() },
        { name: 'tips', title: 'Tips', type: 'array', of: [{ type: 'string' }], validation: (Rule: any) => Rule.min(1) },
        { name: 'resources', title: 'Resources', type: 'array', of: [{ type: 'string' }], validation: (Rule: any) => Rule.min(1) },
        { name: 'nextSteps', title: 'Next Steps', type: 'array', of: [{ type: 'string' }], validation: (Rule: any) => Rule.min(1) },
      ]
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      validation: (Rule: any) => Rule.min(1)
    }
  ],
  preview: {
    select: {
      title: 'key',
      subtitle: 'summary'
    },
    prepare(selection: any) {
      const { title, subtitle } = selection
      return {
        title,
        subtitle: subtitle ? `${subtitle.substring(0, 60)}…` : ''
      }
    }
  }
}

export default archetype

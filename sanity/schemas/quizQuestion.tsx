const quizQuestion = {
  name: 'quizQuestion',
  title: 'Quiz Question',
  type: 'document',
  fields: [
    {
      name: 'questionId',
      title: 'Question ID',
      type: 'number',
      description: 'Numeric id that matches app ordering',
      validation: (Rule: any) => Rule.required().min(1)
    },
    {
      name: 'text',
      title: 'Question Text',
      type: 'text',
      rows: 2,
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'text', title: 'Answer Text', type: 'string', validation: (Rule: any) => Rule.required() },
            {
              name: 'archetype',
              title: 'Archetype',
              type: 'string',
              options: {
                list: [
                  { title: 'Avoider', value: 'Avoider' },
                  { title: 'Gambler', value: 'Gambler' },
                  { title: 'Realist', value: 'Realist' },
                  { title: 'Architect', value: 'Architect' },
                ]
              },
              validation: (Rule: any) => Rule.required()
            },
            { name: 'points', title: 'Points', type: 'number', validation: (Rule: any) => Rule.required().min(1).max(5) },
          ]
        }
      ],
      validation: (Rule: any) => Rule.required().min(2)
    }
  ],
  preview: {
    select: {
      title: 'text',
      subtitle: 'questionId'
    },
    prepare(selection: any) {
      const { title, subtitle } = selection
      return {
        title: title?.substring(0, 60),
        subtitle: `Q${subtitle}`
      }
    }
  },
  orderings: [
    {
      title: 'By Question ID',
      name: 'byQuestionId',
      by: [
        { field: 'questionId', direction: 'asc' }
      ]
    }
  ]
}

export default quizQuestion

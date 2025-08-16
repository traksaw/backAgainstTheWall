const supporter = {
  name: 'supporter',
  title: 'Supporter/Partner',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Organization/Partner Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'type',
      title: 'Supporter Type',
      type: 'string',
      options: {
        list: [
          { title: 'Foundation Grant', value: 'foundation' },
          { title: 'Corporate Partner', value: 'corporate' },
          { title: 'Community Partner', value: 'community' },
          { title: 'Individual Supporter', value: 'individual' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'logo',
      title: 'Logo/Image',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'website',
      title: 'Website URL',
      type: 'url',
      description: 'Optional link to partner website'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Brief description of the partnership or support'
    },
    {
      name: 'featured',
      title: 'Featured Supporter',
      type: 'boolean',
      description: 'Show prominently in the main section',
      initialValue: false
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first (1, 2, 3...)',
      validation: (Rule: any) => Rule.min(1)
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
      media: 'logo'
    },
    prepare(selection: any) {
      const { title, subtitle, media } = selection
      return {
        title,
        subtitle: subtitle ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1) : 'Supporter',
        media
      }
    }
  }
}

export default supporter
